import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import express from "express";

/* ================= ENV ================= */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 8080;

/* ================= BOT & SERVER ================= */
const bot = new TelegramBot(TOKEN);
const app = express();
app.use(express.json());

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

/* ================= NOTIFIKASI ================= */
async function kirimNotifikasiUser(chatId, data) {
  if (!chatId) return;

  const pesan = `
📢 *Update Laporan Helpdesk*

📝 *Judul:* ${data.judul}
📄 *Deskripsi:* ${data.deskripsi}
👤 *PIC:* ${data.pic}
⏱️ *Estimasi Penyelesaian:* ${data.estimasi}
💬 *Komentar Teknisi:* ${data.komentar}
📌 *Status:* *${data.status}*

Terima kasih telah menunggu 🙏
  `;

  await bot.sendMessage(chatId, pesan, { parse_mode: "Markdown" });
}

/* ================= /start ================= */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // SIMPAN CHAT ID USER (INI KUNCI)
  await db.query(
    "UPDATE users SET telegram_chat_id=? WHERE username IS NOT NULL AND telegram_chat_id IS NULL",
    [chatId]
  );

  delete sessions[chatId];

  await bot.sendMessage(
    chatId,
    `👋 *Helpdesk IT Bot*

Perintah:
• *daftar* → buat akun
• *testnotif* → tes notifikasi
• *updatelaporan* → kirim notifikasi laporan`,
    { parse_mode: "Markdown" }
  );
});

/* ================= MESSAGE HANDLER ================= */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const rawText = (msg.text || "").trim();
  const text = rawText.toLowerCase();

  try {
    /* ===== TEST NOTIF ===== */
    if (text === "testnotif") {
      await kirimNotifikasiUser(chatId, {
        judul: "Gazzz",
        deskripsi: "Oemhjiii",
        pic: "Oci",
        estimasi: "10 menit",
        komentar: "Gsgwhw",
        status: "Diproses",
      });
      return;
    }

    /* ===== UPDATE LAPORAN (REAL DB) ===== */
    if (text === "updatelaporan") {
      const [[laporan]] = await db.query(`
        SELECT 
          l.judul,
          l.deskripsi,
          l.status,
          l.estimasi,
          l.komentar,
          l.pic,
          u.telegram_chat_id
        FROM laporan l
        JOIN users u ON u.id = l.user_id
        ORDER BY l.id DESC
        LIMIT 1
      `);

      if (!laporan) {
        return bot.sendMessage(chatId, "❌ Tidak ada laporan.");
      }

      if (!laporan.telegram_chat_id) {
        return bot.sendMessage(
          chatId,
          "⚠️ User belum terhubung ke Telegram."
        );
      }

      await kirimNotifikasiUser(laporan.telegram_chat_id, {
        judul: laporan.judul,
        deskripsi: laporan.deskripsi,
        pic: laporan.pic || "-",
        estimasi: laporan.estimasi || "-",
        komentar: laporan.komentar || "-",
        status: laporan.status || "Pending",
      });

      return bot.sendMessage(chatId, "✅ Notifikasi laporan terkirim.");
    }

    /* ===== DAFTAR ===== */
    if (text === "daftar") {
      sessions[chatId] = { step: "username" };
      return bot.sendMessage(chatId, "Masukkan *username*:", {
        parse_mode: "Markdown",
      });
    }

    const session = sessions[chatId];
    if (!session) return;

    if (session.step === "username") {
      const [exist] = await db.query(
        "SELECT id FROM users WHERE username=? LIMIT 1",
        [rawText]
      );

      if (exist.length) {
        delete sessions[chatId];
        return bot.sendMessage(chatId, "❌ Username sudah dipakai.");
      }

      sessions[chatId] = { step: "password", username: rawText };
      return bot.sendMessage(chatId, "Masukkan *password*:");
    }

    if (session.step === "password") {
      const hash = await bcrypt.hash(rawText, 10);

      await db.query(
        "INSERT INTO users (username, password, role, telegram_chat_id) VALUES (?, ?, 'user', ?)",
        [session.username, hash, chatId]
      );

      delete sessions[chatId];
      return bot.sendMessage(chatId, "✅ Akun berhasil dibuat.");
    }
  } catch (err) {
    console.error("BOT ERROR:", err);
    delete sessions[chatId];
    return bot.sendMessage(chatId, "⚠️ Terjadi kesalahan server.");
  }
});
