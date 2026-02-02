import TelegramBot from "node-telegram-bot-api";

/* ================= BOT INSTANCE (SATU KALI) ================= */
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN tidak terbaca");
}

const bot = token
  ? new TelegramBot(token, { polling: false }) // SEND ONLY
  : null;

/* ================= KIRIM KE TEKNISI ================= */
export async function sendToTeknisi(teknisi = [], text, imageUrl = null) {
  if (!bot) return;

  try {
    for (const t of teknisi) {
      if (!t.telegram_chat_id) continue;

      // ===== KIRIM GAMBAR (URL LANGSUNG) =====
      if (imageUrl && imageUrl.startsWith("http")) {
        await bot.sendPhoto(t.telegram_chat_id, imageUrl, {
          caption: text,
          parse_mode: "Markdown",
        });
      } 
      // ===== KIRIM TEKS =====
      else {
        await bot.sendMessage(t.telegram_chat_id, text, {
          parse_mode: "Markdown",
        });
      }
    }
  } catch (e) {
    console.error("❌ ERROR TELEGRAM SEND:", e.message);
  }
}
