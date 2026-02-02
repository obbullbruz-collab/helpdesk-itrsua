import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

/* ================= BOT ================= */
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

console.log("🤖 BOT STEP 2 HIDUP");

/* ================= DATABASE ================= */
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ================= SESSION ================= */
const sessions = {};

/* ================= /start ================= */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await db.query(
      "INSERT IGNORE INTO users (telegram_chat_id, role) VALUES (?, 'user')",
      [chatId]
    );

    await bot.sendMessage(
      chatId,
      `👋 *Helpdesk IT Bot*

Ketik:
• *daftar* → buat akun
• *batal* → batalkan proses`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("START ERROR:", err);
    bot.sendMessage(chatId, "⚠️ Server error.");
  }
});

/* ================= MESSAGE HANDLER ================= */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  try {
    // ===== BATAL =====
    if (text.toLowerCase() === "batal") {
      delete sessions[chatId];
      await db.query(
        "UPDATE users SET telegram_step=NULL WHERE telegram_chat_id=?",
        [chatId]
      );
      return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
    }

    // ===== DAFTAR =====
    if (text.toLowerCase() === "daftar") {
      sessions[chatId] = { step: "username" };

      await db.query(
        "UPDATE users SET telegram_step='username' WHERE telegram_chat_id=?",
        [chatId]
      );

      return bot.sendMessage(chatId, "Masukkan *username*:", {
        parse_mode: "Markdown",
      });
    }

    const session = sessions[chatId];
    if (!session) return;

    // ===== USERNAME =====
    if (session.step === "username") {
      const username = text.toLowerCase();

      const [rows] = await db.query(
        "SELECT id FROM users WHERE username=? LIMIT 1",
        [username]
      );

      if (rows.length) {
        return bot.sendMessage(chatId, "❌ Username sudah dipakai.");
      }

      session.username = username;
      session.step = "password";

      await db.query(
        "UPDATE users SET telegram_step='password' WHERE telegram_chat_id=?",
        [chatId]
      );

      return bot.sendMessage(
        chatId,
        "Masukkan *password* (min 4 karakter):",
        { parse_mode: "Markdown" }
      );
    }

    // ===== PASSWORD =====
    if (session.step === "password") {
      if (text.length < 4) {
        return bot.sendMessage(chatId, "❌ Password minimal 4 karakter.");
      }

      const hash = await bcrypt.hash(text, 10);

      await db.query(
        `UPDATE users
         SET username=?, password=?, telegram_step=NULL
         WHERE telegram_chat_id=?`,
        [session.username, hash, chatId]
      );

      delete sessions[chatId];

      return bot.sendMessage(
        chatId,
        "✅ Akun berhasil dibuat.\nSilakan login di web."
      );
    }
  } catch (err) {
    console.error("BOT ERROR:", err);
    return bot.sendMessage(
      chatId,
      "⚠️ Server error.\nKetik *daftar* untuk ulangi.",
      { parse_mode: "Markdown" }
    );
  }
});
