const crypto = require("crypto")

/**
 * MoMo HMAC SHA256 — sort keys alphabetically, join key=value&
 * @see https://developers.momo.vn/v3/docs/payment/api/other/signature/
 */
function buildHmacSha256(secretKey, dataObj) {
  const sortedKeys = Object.keys(dataObj).sort()
  const raw = sortedKeys.map((k) => `${k}=${dataObj[k]}`).join("&")
  return crypto.createHmac("sha256", secretKey).update(raw).digest("hex")
}

function createPaymentSignature(
  {
    accessKey,
    amount,
    extraData,
    ipnUrl,
    orderId,
    orderInfo,
    partnerCode,
    redirectUrl,
    requestId,
    requestType,
  },
  secretKey
) {
  return buildHmacSha256(secretKey, {
    accessKey,
    amount,
    extraData,
    ipnUrl,
    orderId,
    orderInfo,
    partnerCode,
    redirectUrl,
    requestId,
    requestType,
  })
}

function verifyIpnSignature(body, secretKey) {
  const sig = body.signature ?? body.Signature
  if (!sig) return false
  const rest = { ...body }
  delete rest.signature
  delete rest.Signature
  const calculated = buildHmacSha256(secretKey, rest)
  return calculated === sig
}

/**
 * Redirect GET: chỉ dùng đúng các field kết quả giao dịch (không gộp query thừa).
 * IPN JSON: thường trùng bộ field; ví dụ trong tài liệu không có accessKey trên body IPN.
 * Thử thêm accessKey nếu có (một số môi trường MoMo gửi kèm).
 * @see https://developers.momo.vn/v3/docs/payment/api/result-handling/notification/
 */
const MOMO_RESULT_SIGN_KEYS_BASE = [
  "amount",
  "extraData",
  "message",
  "orderId",
  "orderInfo",
  "orderType",
  "partnerCode",
  "payType",
  "requestId",
  "responseTime",
  "resultCode",
  "transId",
]

function pickSignPayload(payload, keyList) {
  const rest = {}
  for (const k of keyList) {
    if (Object.prototype.hasOwnProperty.call(payload, k) && payload[k] !== undefined && payload[k] !== null) {
      rest[k] = payload[k]
    }
  }
  return rest
}

/**
 * @param {string} [accessKeyFromEnv] — MoMo thường KHÔNG gửi accessKey trên redirect URL nhưng vẫn đưa vào chuỗi ký (giống sample PHP).
 */
function verifyMomoResultSignature(payload, secretKey, accessKeyFromEnv) {
  const sig = payload.signature ?? payload.Signature
  if (!sig) return false

  const basePayload = { ...payload }
  delete basePayload.signature
  delete basePayload.Signature

  const variants = [basePayload]
  if (accessKeyFromEnv && !basePayload.accessKey) {
    variants.push({ ...basePayload, accessKey: accessKeyFromEnv })
  }

  const keySets = [
    MOMO_RESULT_SIGN_KEYS_BASE,
    ["accessKey", ...MOMO_RESULT_SIGN_KEYS_BASE],
  ]

  for (const p of variants) {
    for (const keys of keySets) {
      const rest = pickSignPayload(p, keys)
      if (buildHmacSha256(secretKey, rest) === sig) return true
      const restStr = {}
      for (const k of Object.keys(rest)) {
        restStr[k] = String(rest[k])
      }
      if (buildHmacSha256(secretKey, restStr) === sig) return true
    }
  }

  return false
}

module.exports = {
  createPaymentSignature,
  verifyIpnSignature,
  verifyMomoResultSignature,
}
