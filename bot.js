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
console.log("🤖 BOT WEBHOOK HIDUP");
console.log("🌐 WEBHOOK:", `${WEBHOOK_URL}/bot`);

app.post("/bot", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("🚀 Listening on port", PORT);
});

/* ================= DATABASE ================= */
const db = await mysql.createPool(process.env.DATABASE_URL);

/* ================= SESSION (MEMORY) ================= */
const sessions = {};

/* ================= NOTIFIKASI USER ================= */
async function kirimNotifikasiUser(chatId, data) {
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

  await bot.sendMessage(chatId, pesan, {
    parse_mode: "Markdown",
  });
}

/* ================= /start ================= */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  delete sessions[chatId];

  await bot.sendMessage(
    chatId,
    `👋 *Helpdesk IT Bot*

Perintah:
• *daftar* → buat akun
• *batal* → batalkan proses
• *testnotif* → tes notifikasi`,
    { parse_mode: "Markdown" }
  );
});

/* ================= MESSAGE HANDLER ================= */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const rawText = (msg.text || "").trim();
  const text = rawText.toLowerCase();

  try {
    /* ===== TEST NOTIFIKASI ===== */
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

    await kirimNotifikasiUser(laporan.telegram_chat_id, {
      judul: laporan.judul,
      deskripsi: laporan.deskripsi,
      pic: laporan.pic || "-",
      estimasi: laporan.estimasi || "-",
      komentar: laporan.komentar || "-",
      status: laporan.status || "Pending",
    });

    return bot.sendMessage(chatId, "✅ Notifikasi laporan terkirim ke user.");
  }



    /* ===== BATAL ===== */
    if (text === "batal") {
      delete sessions[chatId];
      return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
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

    /* ===== USERNAME ===== */
    if (session.step === "username") {
      const username = rawText;

      const [exist] = await db.query(
        "SELECT id FROM users WHERE username=? LIMIT 1",
        [username]
      );

      if (exist.length) {
        delete sessions[chatId];
        return bot.sendMessage(
          chatId,
          "❌ Username sudah digunakan.\nKetik *daftar* untuk ulangi.",
          { parse_mode: "Markdown" }
        );
      }

      sessions[chatId] = {
        step: "password",
        username,
      };

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

      await db.query(
        "INSERT INTO users (username, password, role) VALUES (?, ?, 'user')",
        [session.username, hash]
      );

      delete sessions[chatId];

      return bot.sendMessage(
        chatId,
        "✅ Akun berhasil dibuat.\nSilakan login di web."
      );
    }
  } catch (err) {
    console.error("BOT ERROR:", err);
    delete sessions[chatId];

    return bot.sendMessage(
      chatId,
      "⚠️ Terjadi kesalahan server.\nKetik *daftar* untuk ulangi."
    );
  }
});

/* ================= END OF FILE ================= */
