import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import express from "express";

/* ================= ENV ================= */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 8080;

/* ================= BOT ================= */
const bot = new TelegramBot(TOKEN);
console.log("🤖 BOT WEBHOOK HIDUP");

/* ================= EXPRESS ================= */
const app = express();
app.use(express.json());

bot.setWebHook(`${WEBHOOK_URL}/bot`);
console.log("🌐 WEBHOOK SET TO:", `${WEBHOOK_URL}/bot`);

app.post("/bot", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("🚀 Webhook listening on port", PORT);
});

/* ================= DATABASE ================= */
const db = await mysql.createPool(process.env.DATABASE_URL);

/* ================= SESSION ================= */
const sessions = {};

/* ================= /start ================= */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // RESET SESSION TOTAL
  delete sessions[chatId];
  await db.query(
    "UPDATE users SET telegram_step=NULL WHERE telegram_chat_id=?",
    [chatId]
  );

  await bot.sendMessage(
    chatId,
    `👋 *Helpdesk IT Bot*

Perintah:
• *daftar* → buat akun
• *batal* → batalkan proses`,
    { parse_mode: "Markdown" }
  );
});

/* ================= MESSAGE HANDLER ================= */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const rawText = (msg.text || "").trim(); // ASLI
  const text = rawText.toLowerCase(); // COMMAND SAJA

  try {
    /* ===== BATAL ===== */
    if (text === "batal") {
      delete sessions[chatId];
      await db.query(
        "UPDATE users SET telegram_step=NULL WHERE telegram_chat_id=?",
        [chatId]
      );
      return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
    }

    /* ===== DAFTAR ===== */
    if (text === "daftar") {
      // RESET SESSION BIAR BERSIH
      delete sessions[chatId];

      const [rows] = await db.query(
        "SELECT id FROM users WHERE telegram_chat_id=? LIMIT 1",
        [chatId]
      );

      if (!rows.length) {
        await db.query(
          "INSERT INTO users (telegram_chat_id, role) VALUES (?, 'user')",
          [chatId]
        );
      } else {
        // PASTIKAN USER BELUM PUNYA USERNAME
        await db.query(
          "UPDATE users SET username=NULL, password=NULL WHERE telegram_chat_id=?",
          [chatId]
        );
      }

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

    /* ===== USERNAME ===== */
    if (session.step === "username") {
      const username = rawText; // PAKAI ASLI

      const [exist] = await db.query(
        "SELECT id FROM users WHERE username=? LIMIT 1",
        [username]
      );

      if (exist.length) {
        // RESET TOTAL
        delete sessions[chatId];
        await db.query(
          "UPDATE users SET telegram_step=NULL WHERE telegram_chat_id=?",
          [chatId]
        );

        return bot.sendMessage(
          chatId,
          "❌ Username sudah digunakan.\nKetik *daftar* untuk ulangi.",
          { parse_mode: "Markdown" }
        );
      }

      // SIMPAN USERNAME BARU
      sessions[chatId] = {
        step: "password",
        username,
      };

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

    /* ===== PASSWORD ===== */
    if (session.step === "password") {
      if (rawText.length < 4) {
        return bot.sendMessage(chatId, "❌ Password minimal 4 karakter.");
      }

      const hash = await bcrypt.hash(rawText, 10);

      const [result] = await db.query(
        `
        UPDATE users
        SET username=?, password=?, telegram_step=NULL
        WHERE telegram_chat_id=?
          AND username IS NULL
        `,
        [session.username, hash, chatId]
      );

      // JIKA GAGAL (USERNAME BENTROK / SESSION KOTOR)
      if (result.affectedRows === 0) {
        delete sessions[chatId];
        return bot.sendMessage(
          chatId,
          "❌ Username sudah digunakan.\nKetik *daftar* untuk ulangi.",
          { parse_mode: "Markdown" }
        );
      }

      delete sessions[chatId];

      return bot.sendMessage(
        chatId,
        "✅ Akun berhasil dibuat.\nSilakan login di web."
      );
    }
  } catch (err) {
    console.error("BOT ERROR:", err);

    delete sessions[chatId];
    await db.query(
      "UPDATE users SET telegram_step=NULL WHERE telegram_chat_id=?",
      [chatId]
    );

    return bot.sendMessage(
      chatId,
      "⚠️ Terjadi kesalahan server.\nKetik *daftar* untuk ulangi."
    );
  }
});
