const asyncHandler = require("express-async-handler")
const db = require("../models")
const querystring = require("qs")
const moment = require("moment")
const crypto = require("crypto")
const { sortObject } = require("../utils/helpers")
const randomstring = require("randomstring")
const {
  createPaymentSignature,
  verifyIpnSignature,
  verifyMomoResultSignature,
} = require("../utils/momo")

const vnp_TmnCode = process.env.VNP_TMNCODE
const vnp_ReturnUrl = process.env.VNP_RETURN_URL
const vnp_Url = process.env.VNP_URL
const vnp_hashSecret = process.env.VNP_HASHSECRET
const bankCode = process.env.VNP_BANKCODE
const clientPaymentReturnUrl = process.env.CLIENT_PAYMENT_RETURN_URL

const momoEndpoint =
  process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create"
const momoPartnerCode = process.env.MOMO_PARTNER_CODE
const momoAccessKey = process.env.MOMO_ACCESS_KEY
const momoSecretKey = process.env.MOMO_SECRET_KEY
const momoPartnerName = process.env.MOMO_PARTNER_NAME || "MoMo Partner"
const momoStoreId = process.env.MOMO_STORE_ID || "MoMoStore"
const momoRedirectUrl = process.env.MOMO_REDIRECT_URL
const momoIpnUrl = process.env.MOMO_IPN_URL

const MOMO_MIN = 10_000
const MOMO_MAX = 50_000_000

/**
 * Cộng số dư + ghi Payment khi MoMo báo thành công (idempotent theo orderId).
 * IPN server-to-server gọi được khi MOMO_IPN_URL là URL công khai.
 * Nếu IPN không tới (localhost), MoMo vẫn redirect user về MOMO_REDIRECT_URL kèm query + signature — handleMomoReturn cũng gọi hàm này.
 */
async function applyMomoTopUpIfSuccess(body) {
  if (!momoPartnerCode || String(body.partnerCode) !== String(momoPartnerCode)) return

  const rc = Number(body.resultCode)
  if (rc !== 0 && rc !== 9000) return

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) return

  let uid
  try {
    if (body.extraData) {
      const parsed = JSON.parse(Buffer.from(body.extraData, "base64").toString("utf8"))
      uid = parsed.uid != null ? Number(parsed.uid) : null
    }
  } catch {
    uid = null
  }
  if (!uid) {
    const parts = String(body.orderId || "").split("-")
    if (parts[0] === "PTCB" && parts[1]) uid = Number(parts[1])
  }
  if (!uid || Number.isNaN(uid)) {
    console.warn("MoMo: cannot resolve uid", body.orderId)
    return
  }

  const orderId = body.orderId
  const existing = await db.Payment.findOne({
    where: {
      idInvoice: orderId,
      method: "MoMo",
      status: "Thành công",
    },
  })
  if (existing) return

  const t = await db.sequelize.transaction()
  try {
    await db.Payment.create(
      {
        idUser: uid,
        amount,
        status: "Thành công",
        method: "MoMo",
        idInvoice: orderId,
      },
      { transaction: t }
    )
    await db.User.increment("balance", { by: amount, where: { id: uid }, transaction: t })
    await t.commit()
  } catch (err) {
    await t.rollback()
    throw err
  }
}

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

  depositMomo: asyncHandler(async (req, res) => {
    const { amount } = req.body
    const { uid } = req.user

    if (!momoPartnerCode || !momoAccessKey || !momoSecretKey || !momoRedirectUrl || !momoIpnUrl) {
      return res.status(503).json({
        success: false,
        msg: "MoMo chưa được cấu hình (thiếu biến môi trường).",
      })
    }

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < MOMO_MIN || amt > MOMO_MAX) {
      return res.json({
        success: false,
        msg: `Số tiền phải từ ${MOMO_MIN.toLocaleString("vi-VN")} đến ${MOMO_MAX.toLocaleString("vi-VN")} VND.`,
      })
    }

    const requestId = `${Date.now()}-momo-${randomstring.generate(6)}`
    const orderId = `PTCB-${uid}-${Date.now()}-${randomstring.generate(5)}`
    const orderInfo = `Nap tien PTCB user ${uid}`
    const extraData = Buffer.from(JSON.stringify({ uid: Number(uid) }), "utf8").toString("base64")

    const requestBody = {
      partnerCode: momoPartnerCode,
      accessKey: momoAccessKey,
      partnerName: momoPartnerName,
      storeId: momoStoreId,
      requestId,
      amount: amt,
      orderId,
      orderInfo,
      redirectUrl: momoRedirectUrl,
      ipnUrl: momoIpnUrl,
      lang: "vi",
      requestType: "captureWallet",
      extraData,
    }

    const signature = createPaymentSignature(
      {
        accessKey: momoAccessKey,
        amount: amt,
        extraData,
        ipnUrl: momoIpnUrl,
        orderId,
        orderInfo,
        partnerCode: momoPartnerCode,
        redirectUrl: momoRedirectUrl,
        requestId,
        requestType: "captureWallet",
      },
      momoSecretKey
    )

    requestBody.signature = signature

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 35_000)

    try {
      const moRes = await fetch(momoEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
      const data = await moRes.json()

      if (data.resultCode !== 0 || !data.payUrl) {
        return res.json({
          success: false,
          msg: data.message || "Không tạo được giao dịch MoMo.",
          momoResultCode: data.resultCode,
        })
      }

      return res.json({
        success: true,
        paymentUrl: data.payUrl,
        orderId,
      })
    } catch (e) {
      console.error("MoMo create error:", e.message || e)
      return res.status(502).json({
        success: false,
        msg: "Không kết nối được MoMo. Thử lại sau.",
      })
    } finally {
      clearTimeout(timeout)
    }
  }),

  handleMomoIpn: asyncHandler(async (req, res) => {
    if (!momoSecretKey || !momoPartnerCode) {
      return res.status(503).end()
    }

    if (!verifyIpnSignature(req.body, momoSecretKey)) {
      console.warn("MoMo IPN: invalid signature")
      return res.status(400).send("Invalid signature")
    }

    const body = req.body
    if (body.partnerCode !== momoPartnerCode) {
      return res.status(400).send("Invalid partner")
    }

    try {
      await applyMomoTopUpIfSuccess(body)
    } catch (err) {
      console.error("MoMo IPN processing error:", err)
      return res.status(500).send("Error")
    }

    return res.status(204).end()
  }),

  handleMomoReturn: asyncHandler(async (req, res) => {
    if (!clientPaymentReturnUrl) {
      return res.status(500).send("CLIENT_PAYMENT_RETURN_URL missing")
    }

    let q = req.query
    if (momoSecretKey && (q.signature || q.Signature)) {
      let okSig =
        verifyMomoResultSignature(q, momoSecretKey, momoAccessKey) ||
        verifyIpnSignature(q, momoSecretKey)
      if (!okSig && req.originalUrl && req.originalUrl.includes("?")) {
        const qs = req.originalUrl.split("?")[1].split("#")[0]
        const qAlt = querystring.parse(qs)
        okSig =
          verifyMomoResultSignature(qAlt, momoSecretKey, momoAccessKey) ||
          verifyIpnSignature(qAlt, momoSecretKey)
        if (okSig) q = qAlt
      }
      if (okSig) {
        try {
          await applyMomoTopUpIfSuccess(q)
        } catch (err) {
          console.error("MoMo return (redirect) apply error:", err)
        }
      } else if (process.env.NODE_ENV === "development") {
        console.warn(
          "MoMo return: chữ ký query không khớp. Keys:",
          Object.keys(q).filter((k) => k !== "signature" && k !== "Signature")
        )
      } else {
        console.warn("MoMo return: chữ ký query không hợp lệ")
      }
    } else if (q.resultCode === "0" || q.resultCode === 0) {
      console.warn(
        "MoMo: redirect thành công nhưng không có signature trên query — cộng tiền chỉ qua IPN. " +
          "Đặt MOMO_IPN_URL thành URL công khai (ngrok) hoặc kiểm tra MoMo có gửi signature trên return URL."
      )
    }

    const rc = q.resultCode
    const ok = rc === "0" || rc === 0 || rc === "9000" || rc === 9000
    const code = ok ? "00" : "02"
    return res.redirect(clientPaymentReturnUrl + code)
  }),
}
