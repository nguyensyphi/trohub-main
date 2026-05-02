const ctrls = require("../controllers/payment.controller")
const joi = require("joi")
const { validateDto } = require("../middlewares/validate-dto.midd")
const { verifyToken } = require("../middlewares/verify-token.midd")
const { numberReq } = require("../utils/joi-schema")
const router = require("express").Router()

router.post("/deposit-momo", verifyToken, validateDto(joi.object({ amount: numberReq })), ctrls.depositMomo)
router.get("/momo-return", ctrls.handleMomoReturn)
router.post("/momo-ipn", ctrls.handleMomoIpn)
module.exports = router
