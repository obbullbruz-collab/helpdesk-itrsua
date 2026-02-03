export const runtime = "nodejs";

import { db } from "@/lib/db";

function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      return Response.json({ success: false, message: "Username wajib diisi" });
    }

    const [[user]] = await db.query(
      "SELECT id, telegram_chat_id FROM users WHERE username=? LIMIT 1",
      [username]
    );

    if (!user) {
      return Response.json({ success: false, message: "Username tidak ditemukan" });
    }

    if (!user.telegram_chat_id) {
      return Response.json({
        success: false,
        message: "Akun belum terhubung ke Telegram",
      });
    }

    const token = generateToken();
    const expired = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      "UPDATE users SET reset_token=?, reset_expired=? WHERE id=?",
      [token, expired, user.id]
    );

    // 🔥 KIRIM KE BOT (BUKAN KE TELEGRAM LANGSUNG)
    await fetch(`${process.env.BOT_BASE_URL}/notify-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_chat_id: user.telegram_chat_id,
        token,
      }),
    });

    return Response.json({
      success: true,
      message: "Kode reset dikirim ke Telegram",
    });
  } catch (err) {
    console.error("LUPA PASSWORD ERROR:", err);
    return Response.json({ success: false, message: "Server error" });
  }
}
