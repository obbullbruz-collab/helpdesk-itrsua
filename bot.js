import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import express from "express";

/* ================= ENV ================= */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // https://xxx.up.railway.app
const WEB_BASE_URL = process.env.WEB_BASE_URL; // https://web-kamu.com
const PORT = process.env.PORT || 8080;

/* ================= BOT & SERVER ================= */
const bot = new TelegramBot(TOKEN);
const app = express();

/* 🔥 WAJIB: BODY PARSER (INI KUNCI) */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

bot.setWebHook(`${WEBHOOK_URL}/bot`);

app.post("/bot", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("🚀 Bot running on port", PORT);
});

/* ================= DATABASE ================= */
const db = await mysql.createPool(process.env.DATABASE_URL);

/* ================= SESSION ================= */
const sessions = {};

/* ================= HELPER ================= */
async function safeSend(chatId, text, opt = {}) {
  if (!chatId) return;
  try {
    await bot.sendMessage(chatId, text, opt);
  } catch (e) {
    console.error("SEND ERROR:", e.message);
  }
}

/* ================= NOTIF TEKNISI ================= */
async function notifTeknisi(d) {
  const [teknisi] = await db.query(
    "SELECT telegram_chat_id FROM users WHERE role='teknisi' AND telegram_chat_id IS NOT NULL"
  );

  if (!teknisi.length) {
    console.log("⚠️ Tidak ada teknisi dengan telegram_chat_id");
    return;
  }

  const caption = `
🛠️ *Laporan Helpdesk Baru*

🆔 *ID:* ${d.id}
👤 *Pelapor:* ${d.pelapor}
📝 *Judul:* ${d.judul}
📄 *Deskripsi:* ${d.deskripsi}
📍 *Lokasi:* ${d.lokasi || "-"}
⚠️ *Prioritas:* ${d.prioritas || "-"}
📌 *Status:* *${d.status}*

🔗 ${WEB_BASE_URL}/laporan/${d.id}
`;

  for (const t of teknisi) {
    try {
      if (d.gambar) {
        await bot.sendPhoto(t.telegram_chat_id, d.gambar, {
          caption,
          parse_mode: "Markdown",
        });
      } else {
        await bot.sendMessage(t.telegram_chat_id, caption, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        });
      }
    } catch (e) {
      console.error("TEKNISI SEND ERROR:", e.message);
    }
  }
}

/* ================= API DARI WEB ================= */
app.post("/notify-teknisi", async (req, res) => {
  try {
    console.log("🔥 /notify-teknisi HIT");
    console.log("BODY:", req.body);

    const laporan_id = req.body?.laporan_id;

    if (!laporan_id) {
      return res.status(400).json({ error: "laporan_id wajib" });
    }

    const [[lap]] = await db.query(
      `
      SELECT l.*, u.username AS pelapor
      FROM laporan l
      JOIN users u ON u.id = l.user_id
      WHERE l.id = ?
      LIMIT 1
      `,
      [laporan_id]
    );

    if (!lap) {
      return res.status(404).json({ error: "laporan tidak ditemukan" });
    }

    await notifTeknisi(lap);

    console.log("✅ NOTIF TEKNISI TERKIRIM");
    return res.json({ success: true });
  } catch (err) {
    console.error("NOTIFY TEKNISI ERROR:", err);
    return res.status(500).json({ error: "server error" });
  }
});

/* ================= /start ================= */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;

  if (username) {
    await db.query(
      "UPDATE users SET telegram_chat_id=? WHERE username=?",
      [chatId, username]
    );
  }

  await safeSend(
    chatId,
    `👋 *Helpdesk IT Bot*
Akun Telegram terhubung ✅`,
    { parse_mode: "Markdown" }
  );
});
