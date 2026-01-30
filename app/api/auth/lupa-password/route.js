import { db } from "@/lib/db";

function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
}

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      return Response.json({ success: false, message: "Username wajib diisi" });
    }

    const [rows] = await db.query(
      "SELECT id, telegram_chat_id FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Username tidak ditemukan" });
    }

    const user = rows[0];

    if (!user.telegram_chat_id) {
      return Response.json({
        success: false,
        message: "Akun belum terhubung dengan Telegram",
      });
    }

    const token = generateToken();
    const expired = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    await db.query(
      "UPDATE users SET reset_token = ?, reset_expired = ? WHERE id = ?",
      [token, expired, user.id]
    );

    const text = `🔐 *Reset Password Helpdesk IT*

Kode reset kamu:
*${token}*

Balas dengan format:
\`/reset KODE PASSWORD_BARU\`

Contoh:
\`/reset ${token} 123456\`

⏳ Berlaku 10 menit`;

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: user.telegram_chat_id,
          text,
          parse_mode: "Markdown",
        }),
      }
    );

    return Response.json({
      success: true,
      message: "Kode reset dikirim ke Telegram",
    });
  } catch (err) {
    console.error(err);
    return Response.json({
      success: false,
      message: "Server error",
    });
  }
}
