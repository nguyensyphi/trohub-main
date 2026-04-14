const db = require("../models")
const asyncHandler = require("express-async-handler")
const { Op } = require("sequelize")

module.exports = {
  getOrdersByOwner: asyncHandler(async (req, res) => {
    const { uid } = req.user
    const { limit = 5, sort = "createdAt", order = "DESC", page = 1, title, ...rest } = req.query
    const whereClause = rest
    whereClause.idUser = uid

    const sortBy = [[sort, order.toUpperCase()]]

    const offset = (parseInt(page) - 1) * parseInt(limit)
    const response = await db.Order.findAll({
      where: whereClause,
      include: [
        { model: db.User, as: "rUser", attibutes: ["id", "fullname", "avatar"] },
        { model: db.Post, as: "rPost", attibutes: ["id", "title", "status"] },
      ],
      limit,
      offset,
      order: sortBy,
    })
    const count = await db.Order.count({ where: whereClause })

    return res.json({
      success: true,
      orders: response,
      pagination: {
        limit,
        page,
        count,
        totalPages: Math.ceil(count / limit),
      },
    })
  }),
  publicPost: asyncHandler(async (req, res) => {
    const { id } = req.params
    const { uid } = req.user
    const { orderedDays, idPost } = req.body

    const days = parseInt(orderedDays)
    if (!days || isNaN(days) || days <= 0) {
      return res.json({ success: false, msg: "Số ngày đăng hợp lệ là bắt buộc." })
    }

    const t = await db.sequelize.transaction()
    try {
      const post = await db.Post.findOne({ where: { id: idPost, idUser: uid }, transaction: t })
      if (!post) throw new Error("Không tìm thấy tin đăng phù hợp.")

      const priorityMap = { 5: 100000, 4: 80000, 3: 60000, 2: 40000, 1: 20000, 0: 10000 }
      const pricePerDay = priorityMap[post.priority] || 10000
      const totalAmount = pricePerDay * days

      const user = await db.User.findByPk(uid, { transaction: t })
      if (!user || user.balance < totalAmount) {
        throw new Error("Số dư tài khoản không đủ để thanh toán.")
      }

      const expiredDate = Date.now() + days * 24 * 3600 * 1000

      await db.Order.update(
        { status: "Thành công", expiredDate },
        { where: { id, idUser: uid }, transaction: t }
      )
      
      await db.Post.update({ expiredDate }, { where: { id: idPost }, transaction: t })
      await db.User.decrement({ balance: totalAmount }, { where: { id: uid }, transaction: t })

      await t.commit()

      return res.json({
        success: true,
        msg: "Tin đăng đã được công khai thành công.",
      })
    } catch (error) {
      await t.rollback()
      return res.json({
        success: false,
        msg: error.message || "Có lỗi hãy thử lại sau.",
      })
    }
  }),
  removeOrder: asyncHandler(async (req, res) => {
    const { uid } = req.user
    const { id } = req.params

    const response = await db.Order.destroy({ where: { id, idUser: uid } })

    const isSuccess = response > 0
    return res.json({
      success: isSuccess,
      msg: isSuccess ? "Xóa hóa đơn thành công." : "Xóa hóa đơn không thành công.",
    })
  }),
}
