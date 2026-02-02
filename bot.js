import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import express from "express";

/* ================= ENV ================= */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEB_BASE_URL = process.env.WEB_BASE_URL; // https://helpdesk.domain.com
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

/* ================= HELPER ================= */
async function safeSend(chatId, text, options = {}) {
  if (!chatId) return;
  try {
    await bot.sendMessage(chatId, text, options);
  } catch (e) {
    console.error("SEND ERROR:", e.message);
  }
}

/* ================= NOTIF USER ================= */
async function notifUser(chatId, data) {
  const msg = `
📢 *Update Laporan Helpdesk*

📝 *Judul:* ${data.judul}
📄 *Deskripsi:* ${data.deskripsi}
👤 *PIC:* ${data.pic || "-"}
⏱️ *Estimasi:* ${data.estimasi || "-"}
💬 *Komentar Teknisi:* ${data.komentar || "-"}
📌 *Status:* *${data.status}*

Terima kasih telah menunggu 🙏
  `;
  await safeSend(chatId, msg, { parse_mode: "Markdown" });
}

/* ================= NOTIF TEKNISI (DENGAN GAMBAR) ================= */
async function notifTeknisi(data) {
  const [teknisi] = await db.query(
    "SELECT telegram_chat_id FROM users WHERE role='teknisi' AND telegram_chat_id IS NOT NULL"
  );
  if (!teknisi.length) return;

  const caption = `
🛠️ *Laporan Helpdesk Baru*

🆔 *ID:* ${data.id}
👤 *Pelapor:* ${data.pelapor}
📝 *Judul:* ${data.judul}
📄 *Deskripsi:* ${data.deskripsi}
📍 *Lokasi:* ${data.lokasi || "-"}
⚠️ *Prioritas:* ${data.prioritas || "-"}
📌 *Status:* *${data.status}*

🔗 ${WEB_BASE_URL}/laporan/${data.id}
  `;

  for (const t of teknisi) {
    try {
      if (data.gambar) {
        await bot.sendPhoto(t.telegram_chat_id, data.gambar, {
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

  delete sessions[chatId];

  await safeSend(
    chatId,
    `👋 *Helpdesk IT Bot*

Akun Telegram terhubung ✅

Perintah:
• *daftar*
• *reset*
• *testnotif*
• *notiftek*`,
    { parse_mode: "Markdown" }
  );
});

/* ================= MESSAGE HANDLER ================= */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const raw = (msg.text || "").trim();
  const text = raw.toLowerCase();

  try {
    /* ===== TEST USER ===== */
    if (text === "testnotif") {
      return notifUser(chatId, {
        judul: "Tes",
        deskripsi: "Contoh",
        pic: "Oci",
        estimasi: "10 menit",
        komentar: "Dicek",
        status: "Diproses",
      });
    }

    /* ===== NOTIF TEKNISI ===== */
    if (text === "notiftek") {
      const [[lap]] = await db.query(`
        SELECT l.*, u.username AS pelapor
        FROM laporan l
        JOIN users u ON u.id=l.user_id
        ORDER BY l.id DESC LIMIT 1
      `);
      if (!lap) return safeSend(chatId, "❌ Tidak ada laporan.");
      await notifTeknisi(lap);
      return safeSend(chatId, "✅ Notifikasi teknisi terkirim.");
    }

    /* ===== RESET PASSWORD ===== */
    if (text === "reset") {
      const [[req]] = await db.query(`
        SELECT pr.id, u.id user_id
        FROM password_resets pr
        JOIN users u ON u.telegram_chat_id=?
        WHERE pr.used=0
        ORDER BY pr.id DESC LIMIT 1
      `, [chatId]);

      if (!req) return safeSend(chatId, "❌ Tidak ada permintaan reset.");

      sessions[chatId] = {
        step: "reset_pass",
        userId: req.user_id,
        resetId: req.id,
      };

      return safeSend(chatId, "🔐 Masukkan password baru:");
    }

    const s = sessions[chatId];
    if (!s) return;

    if (s.step === "reset_pass") {
      if (raw.length < 4) return safeSend(chatId, "❌ Min 4 karakter.");
      const hash = await bcrypt.hash(raw, 10);
      await db.query("UPDATE users SET password=? WHERE id=?", [
        hash,
        s.userId,
      ]);
      await db.query("UPDATE password_resets SET used=1 WHERE id=?", [
        s.resetId,
      ]);
      delete sessions[chatId];
      return safeSend(chatId, "✅ Password berhasil direset.");
    }

    /* ===== DAFTAR ===== */
    if (text === "daftar") {
      sessions[chatId] = { step: "username" };
      return safeSend(chatId, "Masukkan username:");
    }

    if (s.step === "username") {
      const [ex] = await db.query(
        "SELECT id FROM users WHERE username=?",
        [raw]
      );
      if (ex.length) {
        delete sessions[chatId];
        return safeSend(chatId, "❌ Username sudah dipakai.");
      }
      sessions[chatId] = { step: "password", username: raw };
      return safeSend(chatId, "Masukkan password:");
    }

    if (s.step === "password") {
      const hash = await bcrypt.hash(raw, 10);
      await db.query(
        "INSERT INTO users (username,password,role,telegram_chat_id) VALUES (?,?, 'user',?)",
        [s.username, hash, chatId]
      );
      delete sessions[chatId];
      return safeSend(chatId, "✅ Akun berhasil dibuat.");
    }
  } catch (e) {
    console.error("BOT ERROR:", e);
    delete sessions[chatId];
    safeSend(chatId, "⚠️ Terjadi kesalahan server.");
  }
});
