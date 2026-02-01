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

      if (imageUrl && imageUrl.startsWith("http")) {
        await bot.sendPhoto(t.telegram_chat_id, imageUrl, {
          caption: text,
          parse_mode: "Markdown",
        });
      } else {
        await bot.sendMessage(t.telegram_chat_id, text, {
          parse_mode: "Markdown",
        });
      }
    }
  } catch (e) {
    console.error("ERROR TELEGRAM TEKNISI:", e);
  }
}

/* ============================
   🔔 NOTIFIKASI KE USER
   ============================ */
export async function sendToUser(chatId, text) {
  try {
    const { default: TelegramBot } = await import("node-telegram-bot-api");

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("TELEGRAM_BOT_TOKEN tidak terbaca");
      return;
    }

    const bot = new TelegramBot(token, { polling: false });

    await bot.sendMessage(chatId, text, {
      parse_mode: "Markdown",
    });
  } catch (e) {
    console.error("ERROR TELEGRAM USER:", e);
  }
}
