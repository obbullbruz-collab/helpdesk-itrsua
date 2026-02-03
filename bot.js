import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import express from "express";

/* ================= ENV ================= */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // https://xxxx.up.railway.app
const WEB_BASE_URL = process.env.WEB_BASE_URL;
const PORT = process.env.PORT || 8080;

/* ================= VALIDASI ENV ================= */
if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN belum diset");
  process.exit(1);
}
if (!WEBHOOK_URL) {
  console.error("❌ WEBHOOK_URL belum diset");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL belum diset");
  process.exit(1);
}

/* ================= BOT ================= */
// ⚠️ Railway: JANGAN pakai webHook:{port}
const bot = new TelegramBot(TOKEN);

/* ================= SERVER ================= */
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

/* ================= NOTIF RESET PASSWORD (🔥 FIX UTAMA) ================= */
app.post("/notify-reset", async (req, res) => {
  const { telegram_chat_id, token } = req.body;

  if (!telegram_chat_id || !token) {
    return res.status(400).json({ error: "payload invalid" });
  }

  const msg = `
🔐 *Reset Password Helpdesk IT*

Kode reset kamu:
*${token}*

Ketik:
reset
di chat ini untuk lanjut.
`;

  try {
    await bot.sendMessage(telegram_chat_id, msg, {
      parse_mode: "Markdown",
    });
    res.json({ success: true });
  } catch (e) {
    console.error("RESET SEND ERROR:", e.message);
    res.status(500).json({ error: "send failed" });
  }
});

/* ================= NOTIF TEKNISI ================= */
async function notifTeknisi(lap) {
  const [rows] = await db.query(`
    SELECT telegram_chat_id
    FROM users
    WHERE role='teknisi' AND telegram_chat_id IS NOT NULL
  `);

  if (!rows.length) return;

  const msg = `
🛠️ *Laporan Helpdesk Baru*

🆔 *ID:* ${lap.id}
👤 *Pelapor:* ${lap.pelapor}
📝 *Judul:* ${lap.judul}
📄 *Deskripsi:* ${lap.deskripsi}
📍 *Lokasi:* ${lap.lokasi || "-"}
⚠️ *Prioritas:* ${lap.prioritas || "-"}
📌 *Status:* *${lap.status}*

🔗 ${WEB_BASE_URL}/laporan/${lap.id}
`;

  for (const r of rows) {
    if (lap.gambar) {
      await bot.sendPhoto(r.telegram_chat_id, lap.gambar, {
        caption: msg,
        parse_mode: "Markdown",
      });
    } else {
      await safeSend(r.telegram_chat_id, msg, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    }
  }
}

/* ================= NOTIF USER ================= */
async function notifUser(lap) {
  if (!lap.telegram_chat_id) return;

  const msg = `
📢 *Update Laporan Helpdesk*

📝 *Judul:* ${lap.judul}
📄 *Deskripsi:* ${lap.deskripsi}
👤 *PIC:* ${lap.pic || "-"}
⏱️ *Estimasi:* ${lap.estimasi || "-"}
💬 *Komentar:* ${lap.komentar || "-"}
📌 *Status:* *${lap.status}*
`;

  await safeSend(lap.telegram_chat_id, msg, { parse_mode: "Markdown" });
}

/* ================= API DARI WEB ================= */
app.post("/notify-teknisi", async (req, res) => {
  const { laporan_id } = req.body;
  if (!laporan_id) return res.status(400).json({ error: "laporan_id wajib" });

  const [[lap]] = await db.query(
    `
    SELECT l.*, u.username AS pelapor
    FROM laporan l
    JOIN users u ON u.id = l.user_id
    WHERE l.id = ?
    `,
    [laporan_id]
  );

  if (!lap) return res.status(404).json({ error: "laporan tidak ditemukan" });

  await notifTeknisi(lap);
  res.json({ success: true });
});

app.post("/notify-user", async (req, res) => {
  const { laporan_id } = req.body;
  if (!laporan_id) return res.status(400).json({ error: "laporan_id wajib" });

  const [[lap]] = await db.query(
    `
    SELECT l.*, u.telegram_chat_id
    FROM laporan l
    JOIN users u ON u.id = l.user_id
    WHERE l.id = ?
    `,
    [laporan_id]
  );

  if (!lap) return res.status(404).json({ error: "laporan tidak ditemukan" });

  await notifUser(lap);
  res.json({ success: true });
});

/* ================= /start ================= */
bot.onText(/\/start/, async (msg) => {
  await safeSend(
    msg.chat.id,
    `👋 *Helpdesk IT Bot*

Perintah:
• *daftar* → buat akun baru
• *reset* → reset password`,
    { parse_mode: "Markdown" }
  );
});

/* ================= MESSAGE HANDLER ================= */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  try {
    /* ===== DAFTAR ===== */
    if (text.toLowerCase() === "daftar") {
      sessions[chatId] = { step: "username" };
      return safeSend(chatId, "Masukkan *username baru*:", {
        parse_mode: "Markdown",
      });
    }

    /* ===== RESET (🔥 FIXED) ===== */
    if (text.toLowerCase() === "reset") {
      const [[user]] = await db.query(
        `
        SELECT id, reset_token, reset_expired
        FROM users
        WHERE telegram_chat_id=?
        `,
        [chatId]
      );

      if (!user || !user.reset_token) {
        return safeSend(chatId, "❌ Tidak ada permintaan reset.");
      }

      if (new Date(user.reset_expired) < new Date()) {
        return safeSend(chatId, "❌ Token reset sudah kadaluarsa.");
      }

      sessions[chatId] = {
        step: "reset_pass",
        userId: user.id,
      };

      return safeSend(chatId, "🔐 Masukkan password baru:");
    }

    const s = sessions[chatId];
    if (!s) return;

    /* ===== PROSES DAFTAR ===== */
    if (s.step === "username") {
      const [cek] = await db.query(
        "SELECT id FROM users WHERE username=?",
        [text]
      );

      if (cek.length) {
        delete sessions[chatId];
        return safeSend(chatId, "❌ Username sudah digunakan.");
      }

      sessions[chatId] = { step: "password", username: text };
      return safeSend(chatId, "Masukkan *password*:", {
        parse_mode: "Markdown",
      });
    }

    if (s.step === "password") {
      if (text.length < 4)
        return safeSend(chatId, "❌ Password minimal 4 karakter.");

      const hash = await bcrypt.hash(text, 10);

      await db.query(
        `
        INSERT INTO users (username, password, role, telegram_chat_id)
        VALUES (?, ?, 'user', ?)
        `,
        [s.username, hash, chatId]
      );

      delete sessions[chatId];
      return safeSend(chatId, "✅ Akun berhasil dibuat.\nSilakan login di web.");
    }

    /* ===== PROSES RESET PASSWORD (🔥 FIXED) ===== */
    if (s.step === "reset_pass") {
      if (text.length < 4)
        return safeSend(chatId, "❌ Minimal 4 karakter.");

      const hash = await bcrypt.hash(text, 10);

      await db.query(
        `
        UPDATE users
        SET password=?, reset_token=NULL, reset_expired=NULL
        WHERE id=?
        `,
        [hash, s.userId]
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
