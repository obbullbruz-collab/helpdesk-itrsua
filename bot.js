import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

console.log("🤖 BOT TEST HIDUP");

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "✅ BOT HIDUP & BISA RESPON");
});
