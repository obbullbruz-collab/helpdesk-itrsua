import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import express from "express";

/* ================= ENV ================= */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEB_BASE_URL = process.env.WEB_BASE_URL;
const PORT = process.env.PORT || 8080;

/* ================= VALIDASI ENV ================= */
if (!TOKEN || !WEBHOOK_URL || !process.env.DATABASE_URL) {
  console.error("❌ ENV belum lengkap");
  process.exit(1);
}

/* ================= BOT ================= */
const bot = new TelegramBot(TOKEN);

/* ================= SERVER ================= */
const app = express();
app.use(express.json());

/* ================= DATABASE ================= */
const db = await mysql.createPool(process.env.DATABASE_URL);

/* ================= SESSION ================= */
const sessions = {};

/* ================= TELEGRAM WEBHOOK ================= */
app.post("/bot", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* ================= HELPER ================= */
async function safeSend(chatId, text, opt = {}) {
  try {
    await bot.sendMessage(chatId, text, opt);
  } catch (e) {
    console.error("SEND ERROR:", e.message);
  }
}

/* =================================================
   🔔 NOTIF DARI WEB
================================================= */

/* === NOTIF RESET PASSWORD (🔥 INI YANG PENTING) === */
app.post("/notify-reset", async (req, res) => {
  const { telegram_chat_id } = req.body;
  if (!telegram_chat_id) return res.sendStatus(400);

  await safeSend(
    telegram_chat_id,
    `🔐 *Reset Password*

Ketik *reset* untuk melanjutkan.`,
    { parse_mode: "Markdown" }
  );

  res.json({ success: true });
});

/* === NOTIF TEKNISI === */
app.post("/notify-teknisi", async (req, res) => {
  const { laporan_id } = req.body;
  if (!laporan_id) return res.sendStatus(400);

  const [[lap]] = await db.query(`
    SELECT l.*, u.username AS pelapor
    FROM laporan l
    JOIN users u ON u.id=l.user_id
    WHERE l.id=?
  `, [laporan_id]);

  if (!lap) return res.sendStatus(404);

  const [rows] = await db.query(`
    SELECT telegram_chat_id FROM users
    WHERE role='teknisi' AND telegram_chat_id IS NOT NULL
  `);

  const msg = `
🛠️ *Laporan Baru*
🆔 ${lap.id}
👤 ${lap.pelapor}
📝 ${lap.judul}
📌 ${lap.status}

${WEB_BASE_URL}/laporan/${lap.id}
`;

  for (const r of rows) {
    if (lap.gambar) {
      await bot.sendPhoto(r.telegram_chat_id, lap.gambar, {
        caption: msg,
        parse_mode: "Markdown",
      });
    } else {
      await safeSend(r.telegram_chat_id, msg, { parse_mode: "Markdown" });
    }
  }

  res.json({ success: true });
});

/* === NOTIF USER === */
app.post("/notify-user", async (req, res) => {
  const { laporan_id } = req.body;
  if (!laporan_id) return res.sendStatus(400);

  const [[lap]] = await db.query(`
    SELECT l.*, u.telegram_chat_id
    FROM laporan l
    JOIN users u ON u.id=l.user_id
    WHERE l.id=?
  `, [laporan_id]);

  if (!lap || !lap.telegram_chat_id) return res.sendStatus(404);

  await safeSend(
    lap.telegram_chat_id,
    `📢 *Update Laporan*
📝 ${lap.judul}
📌 ${lap.status}`,
    { parse_mode: "Markdown" }
  );

  res.json({ success: true });
});

/* =================================================
   🤖 TELEGRAM HANDLER
================================================= */

bot.onText(/\/start/, async (msg) => {
  await safeSend(
    msg.chat.id,
    `👋 *Helpdesk IT Bot*
Selamat datang di Helpdesk IT RSUA! 
Silahkan gunakan perintah di bawah ini:
Perintah:
• *daftar*
• *reset*`,
    { parse_mode: "Markdown" }
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim().toLowerCase();

  try {
    /* ===== DAFTAR ===== */
    if (text === "daftar") {
      sessions[chatId] = { step: "username" };
      return safeSend(chatId, "Masukkan *username baru*:", { parse_mode: "Markdown" });
    }

    /* ===== RESET (AMBIL DARI password_resets) ===== */
    if (text === "reset") {
      const [[req]] = await db.query(`
        SELECT pr.id, pr.user_id
        FROM password_resets pr
        JOIN users u ON u.id=pr.user_id
        WHERE u.telegram_chat_id=? AND pr.used=0
        ORDER BY pr.id DESC
        LIMIT 1
      `, [chatId]);

      if (!req) return safeSend(chatId, "❌ Tidak ada permintaan reset.");

      sessions[chatId] = {
        step: "reset_pass",
        userId: req.user_id,
        resetId: req.id,
      };

      return safeSend(chatId, "🔐 Masukkan *password baru*:", {
        parse_mode: "Markdown",
      });
    }

    const s = sessions[chatId];
    if (!s) return;

    /* ===== STEP DAFTAR ===== */
    if (s.step === "username") {
      const [cek] = await db.query(
        "SELECT id FROM users WHERE username=?",
        [msg.text]
      );

      if (cek.length) {
        delete sessions[chatId];
        return safeSend(chatId, "❌ Username sudah digunakan.");
      }

      sessions[chatId] = { step: "password", username: msg.text };
      return safeSend(chatId, "Masukkan *password*:", { parse_mode: "Markdown" });
    }

    if (s.step === "password") {
      if (msg.text.length < 4)
        return safeSend(chatId, "❌ Password minimal 4 karakter.");

      const hash = await bcrypt.hash(msg.text, 10);
      await db.query(
        "INSERT INTO users (username,password,role,telegram_chat_id) VALUES (?,?, 'user', ?)",
        [s.username, hash, chatId]
      );

      delete sessions[chatId];
      return safeSend(chatId, "✅ Akun berhasil dibuat.");
    }

    /* ===== STEP RESET ===== */
    if (s.step === "reset_pass") {
      if (msg.text.length < 4)
        return safeSend(chatId, "❌ Minimal 4 karakter.");

      const hash = await bcrypt.hash(msg.text, 10);

      await db.query(
        "UPDATE users SET password=? WHERE id=?",
        [hash, s.userId]
      );
      await db.query(
        "UPDATE password_resets SET used=1 WHERE id=?",
        [s.resetId]
      );

      delete sessions[chatId];
      return safeSend(chatId, "✅ Password berhasil direset.");
    }
  } catch (e) {
    console.error("BOT ERROR:", e);
    delete sessions[chatId];
    safeSend(chatId, "⚠️ Terjadi kesalahan server.");
  }
});

/* ================= START ================= */
app.listen(PORT, async () => {
  console.log("🤖 Bot running on port", PORT);
  await bot.setWebHook(`${WEBHOOK_URL}/bot`);
  console.log("✅ Webhook set:", `${WEBHOOK_URL}/bot`);
});
