import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

/* ================= CONFIG ================= */
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

console.log("🤖 BOT START:", new Date().toISOString());

/* ================= DATABASE ================= */
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

/* ================= SAFETY LOCK ================= */
// mencegah spam & double proses
const processing = new Set();

/* ================= /start ================= */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `👋 *Helpdesk IT Bot*

Perintah:
• ketik *daftar* → buat akun
• ketik *batal* → batalkan proses
• */reset KODE PASSWORD* → reset password

Contoh:
/reset 123456 passwordbaru`,
    { parse_mode: "Markdown" }
  );

  // simpan chat id kalau belum ada
  await db.query(
    "UPDATE users SET telegram_chat_id=? WHERE telegram_chat_id IS NULL",
    [chatId]
  );
});

/* ================= RESET TOKEN ================= */
bot.onText(/\/reset (\d{6}) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const token = match[1];
  const newPassword = match[2];

  if (newPassword.length < 4) {
    return bot.sendMessage(chatId, "❌ Password minimal 4 karakter.");
  }

  try {
    const [rows] = await db.query(
      `SELECT id FROM users
       WHERE reset_token=?
       AND telegram_chat_id=?
       AND reset_expired > NOW()
       LIMIT 1`,
      [token, chatId]
    );

    if (!rows.length) {
      return bot.sendMessage(chatId, "❌ Token tidak valid / kadaluarsa.");
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users
       SET password=?, reset_token=NULL, reset_expired=NULL
       WHERE id=?`,
      [hash, rows[0].id]
    );

    return bot.sendMessage(chatId, "✅ Password berhasil direset.");
  } catch (err) {
    console.error("RESET ERROR:", err);
    return bot.sendMessage(chatId, "❌ Terjadi kesalahan server.");
  }
});

/* ================= MESSAGE HANDLER UTAMA ================= */
bot.on("message", async (msg) => {
  // ===== FILTER WAJIB =====
  if (msg.from?.is_bot) return;
  if (!msg.text) return;

  const text = msg.text.trim().toLowerCase();
  const chatId = msg.chat.id;

  // command sudah ditangani onText
  if (text.startsWith("/")) return;

  // ===== ANTI DOUBLE PROCESS =====
  if (processing.has(chatId)) return;
  processing.add(chatId);

  try {
    const [[user]] = await db.query(
      "SELECT * FROM users WHERE telegram_chat_id=? LIMIT 1",
      [chatId]
    );

    // ===== BATAL =====
    if (text === "batal") {
      await db.query(
        "UPDATE users SET telegram_step=NULL WHERE telegram_chat_id=?",
        [chatId]
      );
      return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
    }

    // ===== DAFTAR =====
    if (text === "daftar") {
      await db.query(
        "UPDATE users SET telegram_step='daftar_username' WHERE telegram_chat_id=?",
        [chatId]
      );
      return bot.sendMessage(chatId, "Masukkan *username*:", {
        parse_mode: "Markdown",
      });
    }

    // ===== STEP USERNAME =====
    if (user?.telegram_step === "daftar_username") {
      const [cek] = await db.query(
        "SELECT id FROM users WHERE username=? LIMIT 1",
        [text]
      );

      if (cek.length) {
        return bot.sendMessage(chatId, "❌ Username sudah digunakan.");
      }

      await db.query(
        "UPDATE users SET username=?, telegram_step='daftar_password' WHERE telegram_chat_id=?",
        [text, chatId]
      );

      return bot.sendMessage(chatId, "Masukkan *password*:", {
        parse_mode: "Markdown",
      });
    }

    // ===== STEP PASSWORD =====
    if (user?.telegram_step === "daftar_password") {
      if (text.length < 4) {
        return bot.sendMessage(chatId, "❌ Password minimal 4 karakter.");
      }

      const hash = await bcrypt.hash(text, 10);

      await db.query(
        `UPDATE users
         SET password=?, role='user', telegram_step=NULL
         WHERE telegram_chat_id=?`,
        [hash, chatId]
      );

      return bot.sendMessage(
        chatId,
        "✅ Akun berhasil dibuat.\nSilakan login di web."
      );
    }
  } catch (err) {
    console.error("BOT ERROR:", err);
  } finally {
    // cooldown kecil supaya tidak spam
    setTimeout(() => processing.delete(chatId), 500);
  }
});

/* ================= GLOBAL ERROR GUARD ================= */
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
