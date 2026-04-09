"use strict"

/** Thêm giá trị MoMo vào ENUM method của bảng Payments (PostgreSQL). */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'enum_Payments_method' AND e.enumlabel = 'MoMo'
        ) THEN
          ALTER TYPE "enum_Payments_method" ADD VALUE 'MoMo';
        END IF;
      END $$;
    `)
  },

  async down() {
    // PostgreSQL không hỗ trợ xóa giá trị ENUM đơn giản; bỏ qua.
  },
}
