import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

/* ================= BOT ================= */
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

console.log("🤖 BOT DAFTAR HIDUP");

/* ================= DATABASE ================= */
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* ================= SESSION MEMORY ================= */
const sessions = {};

/* ================= /start ================= */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // pastikan user tercatat
  await db.query(
    `INSERT INTO users (telegram_chat_id, role)
     VALUES (?, 'user')
     ON DUPLICATE KEY UPDATE telegram_chat_id=telegram_chat_id`,
    [chatId]
  );

  await bot.sendMessage(
    chatId,
    `👋 *Helpdesk IT Bot*

Perintah:
• ketik *daftar* → buat akun
• ketik *batal* → batalkan proses`,
    { parse_mode: "Markdown" }
  );
});

/* ================= MESSAGE HANDLER ================= */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  console.log("MSG:", chatId, text);

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
      "UPDATE users SET telegram_step='daftar_username' WHERE telegram_chat_id=?",
      [chatId]
    );

    return bot.sendMessage(chatId, "Masukkan *username*:", {
      parse_mode: "Markdown",
    });
  }

  const session = sessions[chatId];
  if (!session) return;

  // ===== STEP USERNAME =====
  if (session.step === "username") {
    const username = text.toLowerCase();

    const [rows] = await db.query(
      "SELECT id FROM users WHERE username=? LIMIT 1",
      [username]
    );

    if (rows.length) {
      return bot.sendMessage(chatId, "❌ Username sudah dipakai, coba lagi:");
    }

    session.username = username;
    session.step = "password";

    await db.query(
      "UPDATE users SET telegram_step='daftar_password' WHERE telegram_chat_id=?",
      [chatId]
    );

    return bot.sendMessage(chatId, "Masukkan *password* (min 4 karakter):", {
      parse_mode: "Markdown",
    });
  }

  // ===== STEP PASSWORD =====
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
      "✅ Akun berhasil dibuat.\nSilakan login di web Helpdesk IT."
    );
  }
});
