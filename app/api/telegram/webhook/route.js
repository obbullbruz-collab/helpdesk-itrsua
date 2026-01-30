import { db } from "@/lib/db";

export async function POST(req) {
  const body = await req.json();
  const message = body.message;

  if (!message || !message.text) {
    return Response.json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  // /start
  if (text === "/start") {
    await db.query(
      `UPDATE users SET telegram_chat_id = ? WHERE telegram_id = ?`,
      [chatId, message.from.username]
    );

    return Response.json({
      method: "sendMessage",
      chat_id: chatId,
      text: "Akun kamu berhasil terhubung dengan sistem Helpdesk IT.",
    });
  }

  // /reset TOKEN PASSWORD
  if (text.startsWith("/reset")) {
    const [, token, newPass] = text.split(" ");

    const [rows] = await db.query(
      `SELECT * FROM users 
       WHERE reset_token = ? 
       AND reset_expired > NOW()`,
      [token]
    );

    if (!rows.length) {
      return Response.json({
        method: "sendMessage",
        chat_id: chatId,
        text: "Token tidak valid atau sudah kadaluarsa.",
      });
    }

    const bcrypt = (await import("bcryptjs")).default;
    const hashed = await bcrypt.hash(newPass, 10);

    await db.query(
      `UPDATE users 
       SET password = ?, reset_token = NULL, reset_expired = NULL
       WHERE id = ?`,
      [hashed, rows[0].id]
    );

    return Response.json({
      method: "sendMessage",
      chat_id: chatId,
      text: "Password berhasil diubah.",
    });
  }

  return Response.json({ ok: true });
}
