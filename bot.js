import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import express from "express";

/* ================= ENV ================= */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEB_BASE_URL = process.env.WEB_BASE_URL;
const PORT = process.env.PORT || 8080;

/* ================= BOT & SERVER ================= */
const bot = new TelegramBot(TOKEN);
const app = express();

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
  try {
    await bot.sendMessage(chatId, text, opt);
  } catch (e) {
    console.error("SEND ERROR:", e.message);
  }
}

/* ================= LINK TELEGRAM ↔ USER ================= */
async function linkTelegram(userId, chatId) {
  await db.query(
    `
    INSERT IGNORE INTO user_telegram (user_id, telegram_chat_id)
    VALUES (?, ?)
    `,
    [userId, chatId]
  );
}

/* ================= NOTIF TEKNISI ================= */
async function notifTeknisi(lap) {
  const [rows] = await db.query(
    `
    SELECT DISTINCT ut.telegram_chat_id
    FROM users u
    JOIN user_telegram ut ON ut.user_id = u.id
    WHERE u.role = 'teknisi'
    `
  );

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
      await bot.sendMessage(r.telegram_chat_id, msg, {
        parse_mode: "Markdown",
      });
    }
  }
}

/* ================= NOTIF USER ================= */
async function notifUser(lap) {
  const [rows] = await db.query(
    `
    SELECT telegram_chat_id
    FROM user_telegram
    WHERE user_id = ?
    `,
    [lap.user_id]
  );

  if (!rows.length) return;

  const msg = `
📢 *Update Laporan Helpdesk*

📝 *Judul:* ${lap.judul}
📄 *Deskripsi:* ${lap.deskripsi}
👤 *PIC:* ${lap.pic || "-"}
⏱️ *Estimasi:* ${lap.estimasi || "-"}
💬 *Komentar:* ${lap.komentar || "-"}
📌 *Status:* *${lap.status}*
`;

  for (const r of rows) {
    await safeSend(r.telegram_chat_id, msg, { parse_mode: "Markdown" });
  }
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
    `SELECT * FROM laporan WHERE id=?`,
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
• *daftar*
• *reset*`,
    { parse_mode: "Markdown" }
  );
});

/* ================= MESSAGE HANDLER ================= */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim().toLowerCase();

  try {
    /* ===== DAFTAR ===== */
    if (text === "daftar") {
      sessions[chatId] = { step: "username" };
      return safeSend(chatId, "Masukkan *username*:", {
        parse_mode: "Markdown",
      });
    }

    /* ===== RESET ===== */
    if (text === "reset") {
      const [[req]] = await db.query(
        `
        SELECT pr.id, pr.user_id
        FROM password_resets pr
        JOIN user_telegram ut ON ut.user_id = pr.user_id
        WHERE ut.telegram_chat_id=? AND pr.used=0
        ORDER BY pr.id DESC
        LIMIT 1
        `,
        [chatId]
      );

      if (!req) {
        return safeSend(chatId, "❌ Tidak ada permintaan reset.");
      }

      sessions[chatId] = {
        step: "reset_pass",
        userId: req.user_id,
        resetId: req.id,
      };

      return safeSend(chatId, "🔐 Masukkan password baru:");
    }

    const s = sessions[chatId];
    if (!s) return;

    /* ===== PROSES DAFTAR ===== */
    if (s.step === "username") {
      const [[user]] = await db.query(
        "SELECT id FROM users WHERE username=?",
        [msg.text.trim()]
      );

      if (!user) {
        delete sessions[chatId];
        return safeSend(chatId, "❌ Username tidak ditemukan.");
      }

      await linkTelegram(user.id, chatId);
      delete sessions[chatId];
      return safeSend(chatId, "✅ Telegram berhasil ditautkan ke akun.");
    }

    /* ===== PROSES RESET ===== */
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
    safeSend(chatId, "⚠️ Terjadi kesalahan.");
  }
});
