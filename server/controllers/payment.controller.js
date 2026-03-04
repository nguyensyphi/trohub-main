const asyncHandler = require("express-async-handler")
const db = require("../models")
const querystring = require("qs")
const moment = require("moment")
const crypto = require("crypto")
const { sortObject } = require("../utils/helpers")
const randomstring = require("randomstring")

const vnp_TmnCode = process.env.VNP_TMNCODE
const vnp_ReturnUrl = process.env.VNP_RETURN_URL
const vnp_Url = process.env.VNP_URL
const vnp_hashSecret = process.env.VNP_HASHSECRET
const bankCode = process.env.VNP_BANKCODE
const clientPaymentReturnUrl = process.env.CLIENT_PAYMENT_RETURN_URL

const createPaymentUrl = ({ amount, ipAddr, orderInfo }) => {
  process.env.TZ = "Asia/Ho_Chi_Minh"

  const date = new Date()
  const createDate = moment(date).format("YYYYMMDDHHmmss")
  const orderId = moment(date).format("DDHHmmss")

  let vnp_Params = {}
  vnp_Params["vnp_Version"] = "2.1.0"
  vnp_Params["vnp_Command"] = "pay"
  vnp_Params["vnp_TmnCode"] = vnp_TmnCode
  vnp_Params["vnp_Locale"] = "vn"
  vnp_Params["vnp_Amount"] = amount * 100 // Số tiền VNPay tính bằng VND
  vnp_Params["vnp_CurrCode"] = "VND"
  vnp_Params["vnp_TxnRef"] = orderId // Mã giao dịch
  vnp_Params["vnp_OrderInfo"] = orderInfo
  vnp_Params["vnp_OrderType"] = "other"
  vnp_Params["vnp_ReturnUrl"] = vnp_ReturnUrl
  vnp_Params["vnp_IpAddr"] = ipAddr
  vnp_Params["vnp_CreateDate"] = createDate
  vnp_Params["vnp_BankCode"] = bankCode

  vnp_Params = sortObject(vnp_Params)

  const signData = querystring.stringify(vnp_Params, { encode: false })
  const hmac = crypto.createHmac("sha512", vnp_hashSecret)
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")

  vnp_Params["vnp_SecureHash"] = signed

  return `${vnp_Url}?${querystring.stringify(vnp_Params, { encode: false })}`
}

module.exports = {
  depositMoney: asyncHandler(async (req, res) => {
    const { amount } = req.body
    const { uid } = req.user

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress

    const paymentUrl = createPaymentUrl({ amount, orderInfo: `Nap tien vao tai khoan -${uid}`, ipAddr })

    return res.json({
      success: true,
      paymentUrl,
    })
  }),

  handleVnpReturn: asyncHandler(async (req, res) => {
    let vnp_Params = req.query
    const secureHash = vnp_Params["vnp_SecureHash"]

    delete vnp_Params["vnp_SecureHash"]
    delete vnp_Params["vnp_SecureHashType"]

    vnp_Params = sortObject(vnp_Params)

    const signData = querystring.stringify(vnp_Params, { encode: false })
    const hmac = crypto.createHmac("sha512", vnp_hashSecret)
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")

    if (secureHash !== signed) {
      return res.redirect(clientPaymentReturnUrl + "97")
    }
    const isSuccess = +vnp_Params.vnp_TransactionStatus === 0
    if (!isSuccess) return res.redirect(clientPaymentReturnUrl + "02")
    // TODO
    try {
      const orderInfo = vnp_Params.vnp_OrderInfo

      const amount = +vnp_Params.vnp_Amount / 100 || 0
      const idUser = orderInfo.split("-")[orderInfo.split("-").length - 1]

      const payload = {
        amount,
        idUser,
        status: "Thành công",
        method: "VNPay",
        idInvoice: randomstring.generate(8).toUpperCase(),
      }

      const [updateUser, payment] = await Promise.all([
        db.User.increment("balance", { by: amount, where: { id: idUser } }),
        db.Payment.create(payload),
      ])

      const isSuccess = !!payment
      if (!isSuccess)
        await Promise.all([
          db.User.decrement("balance", { by: amount, where: { id: idUser } }),
          db.Payment.destroy({ where: { id: payment.id } }),
        ])

      return res.redirect(clientPaymentReturnUrl + "00")
    } catch (error) {
      console.log(error)
      return res.redirect(clientPaymentReturnUrl + "02")
    }
  }),
}
