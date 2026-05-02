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


module.exports = {


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
