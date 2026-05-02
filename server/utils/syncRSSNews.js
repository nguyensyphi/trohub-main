const https = require("https")
const db = require("../models")

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => resolve(data))
      })
      .on("error", (err) => reject(err))
  })
}

const syncVNExpressNews = async () => {
  try {
    const xmlData = await fetchUrl("https://vnexpress.net/rss/bat-dong-san.rss")

    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    let newNewsCount = 0

    while ((match = itemRegex.exec(xmlData)) !== null) {
      const itemContent = match[1]

      // Extract title
      let titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)
      if (!titleMatch) titleMatch = itemContent.match(/<title>(.*?)<\/title>/)
      const title = titleMatch ? titleMatch[1].trim() : null

      // Extract image
      const imgMatch = itemContent.match(/<img[^>]+src=["'](.*?)["']/)
      let avatarUrl = "https://s.vnecdn.net/vnexpress/i/v20/logos/vne_logo_rss.png" // Mặc định
      if (imgMatch) avatarUrl = imgMatch[1]

      // Extract description
      let description = "Dữ liệu thu thập tự động từ hệ thống báo chí."
      const descMatch = itemContent.match(/<\/a>(?:<\/br>)?(?:<br>)?\s*([^<]+)\]\]>/)
      if (descMatch && descMatch[1]) {
        description = descMatch[1].trim()
      }

      if (title) {
        // ID Admin gốc (thường là 1) hoặc để tài khoản Admin đầu tiên lấy từ CSDL
        let adminId = 1
        const adminUser = await db.User.findOne({ where: { role: "Quản trị viên" } })
        if (adminUser) adminId = adminUser.id

        const [, created] = await db.New.findOrCreate({
          where: { title },
          defaults: {
            title,
            avatar: avatarUrl,
            content: description,
            idUser: adminId,
          },
        })
        if (created) newNewsCount++
      }
    }
    
    if (newNewsCount > 0) {
      console.log(`[RSS Sync] Đã tự động cập nhật ${newNewsCount} tin tức Bất động sản mới!`)
    } else {
      console.log(`[RSS Sync] Chưa có tin tức mới. Hệ thống ở mức ổn định.`)
    }
  } catch (error) {
    console.error(`[RSS Sync Error]: Lỗi đồng bộ dữ liệu RSS.`, error.message)
  }
}

module.exports = { syncVNExpressNews }
