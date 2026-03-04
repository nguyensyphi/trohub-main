const ctrls = require("../controllers/payment.controller")
const joi = require("joi")
const { validateDto } = require("../middlewares/validate-dto.midd")
const { verifyToken } = require("../middlewares/verify-token.midd")
const { numberReq } = require("../utils/joi-schema")
const router = require("express").Router()

router.post("/deposit", verifyToken, validateDto(joi.object({ amount: numberReq })), ctrls.depositMoney)
router.get("/vnpay-return", ctrls.handleVnpReturn)
module.exports = router
