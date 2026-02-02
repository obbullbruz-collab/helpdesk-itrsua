import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import express from "express";

// ================= CONFIG =================
const TOKEN = "8526115117:AAHrFzBCQ6cAg_McFe6l5LiBn_iD_a0whjw";
const bot = new TelegramBot(TOKEN, { polling: true });

// ================= DATABASE =================
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "helpdesk_it",
});

// ================= EXPRESS =================
const app = express();
app.use(express.json());

app.listen(4000, () => {
  console.log("📡 Bot API jalan di http://localhost:4000");
});

// ================= /start =================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 *Helpdesk IT UNAND Bot*

Perintah:
👉 *daftar* — membuat akun
👉 *batal* — membatalkan proses
👉 */reset KODE PASSWORD* — reset password

Contoh:
/reset 123456 passwordbaru`,
    { parse_mode: "Markdown" }
  );
});

// ================= SESSION DAFTAR =================
const sessions = {};

// ================= RESET PASSWORD (PAKAI TOKEN) =================
bot.onText(/\/reset (\d{6}) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const token = match[1];
  const newPassword = match[2];

  if (newPassword.length < 4) {
    return bot.sendMessage(chatId, "Password minimal 4 karakter.");
  }

  try {
    const [rows] = await db.query(
      `SELECT id FROM users
       WHERE reset_token = ?
       AND telegram_chat_id = ?
       AND reset_expired > NOW()
       LIMIT 1`,
      [token, chatId]
    );

    if (!rows.length) {
      return bot.sendMessage(
        chatId,
        "❌ Token tidak valid atau sudah kadaluarsa."
      );
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users
       SET password=?, reset_token=NULL, reset_expired=NULL
       WHERE id=?`,
      [hash, rows[0].id]
    );

    return bot.sendMessage(
      chatId,
      "✅ Password berhasil direset.\nSilakan login dengan password baru."
    );
  } catch (e) {
    console.error(e);
    return bot.sendMessage(chatId, "❌ Server error.");
  }
});

// ================= DAFTAR VIA TELEGRAM =================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = (msg.text || "").trim().toLowerCase();

  if (text === "batal") {
    delete sessions[chatId];
    return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
  }

  if (text === "daftar") {
    sessions[chatId] = { step: "username" };
    return bot.sendMessage(chatId, "Masukkan *username*:", {
      parse_mode: "Markdown",
    });
  }

  const session = sessions[chatId];
  if (!session) return;

  // STEP USERNAME
  if (session.step === "username") {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE username=? LIMIT 1",
      [text]
    );

    if (rows.length) {
      return bot.sendMessage(chatId, "❌ Username sudah digunakan.");
    }

    session.username = text;
    session.step = "password";
    return bot.sendMessage(chatId, "Masukkan *password*:", {
      parse_mode: "Markdown",
    });
  }

  // STEP PASSWORD
  if (session.step === "password") {
    if (text.length < 4) {
      return bot.sendMessage(chatId, "Password minimal 4 karakter.");
    }

    const hash = await bcrypt.hash(text, 10);

    await db.query(
      `INSERT INTO users
       (username, password, role, telegram_id, telegram_chat_id)
       VALUES (?, ?, 'user', ?, ?)`,
      [session.username, hash, userId, chatId]
    );

    delete sessions[chatId];
    return bot.sendMessage(
      chatId,
      "✅ Akun berhasil dibuat.\nSilakan login di web Helpdesk IT."
    );
  }
});

console.log("🤖 Bot Telegram berjalan...");
