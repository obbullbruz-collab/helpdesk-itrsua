import fs from "fs";
import path from "path";

export async function sendToTeknisi(teknisi, text, imageUrl = null) {
  try {
    const { default: TelegramBot } = await import("node-telegram-bot-api");

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TELEGRAM_BOT_TOKEN tidak terbaca");
      return;
    }

    const bot = new TelegramBot(token, { polling: false });

    for (const t of teknisi) {
      if (!t.telegram_chat_id) continue;

      if (imageUrl) {
        // Ambil nama file dari URL
        const fileName = path.basename(imageUrl);
        const filePath = path.join(process.cwd(), "public", "uploads", fileName);

        if (fs.existsSync(filePath)) {
          await bot.sendPhoto(t.telegram_chat_id, fs.createReadStream(filePath), {
            caption: text,
            parse_mode: "Markdown",
          });
        } else {
          // Kalau file tidak ada, kirim teks saja
          await bot.sendMessage(t.telegram_chat_id, text, {
            parse_mode: "Markdown",
          });
        }
      } else {
        await bot.sendMessage(t.telegram_chat_id, text, {
          parse_mode: "Markdown",
        });
      }
    }
  } catch (e) {
    console.error("ERROR TELEGRAM:", e);
  }
}
