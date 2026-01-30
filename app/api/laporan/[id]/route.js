import { db } from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { status, pic, estimasi, komentar } = await request.json();

    // ================== UPDATE LAPORAN ==================
    await db.query(
      `
      UPDATE laporan
      SET status = ?, pic = ?, komentar = ?, estimasi = ?
      WHERE id = ?
      `,
      [status, pic, komentar, estimasi, id]
    );

    // ================== AMBIL DATA UNTUK TELEGRAM ==================
    const [rows] = await db.query(
      `
      SELECT 
        l.judul,
        l.deskripsi,
        l.status,
        l.pic,
        l.estimasi,
        l.komentar,
        u.telegram_chat_id
      FROM laporan l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
      LIMIT 1
      `,
      [id]
    );

    // ================== KIRIM TELEGRAM ==================
    if (rows.length && rows[0].telegram_chat_id) {
      const l = rows[0];

      const message = `
📢 *Update Laporan Helpdesk*

📝 Judul: ${l.judul}
📄 Deskripsi: ${l.deskripsi}
👨🏻‍💻 PIC: ${l.pic || "-"}
🕛 Estimasi Penyelesaian: ${l.estimasi || "-"}
💬 Komentar Teknisi: ${l.komentar || "-"}
📌 Status: *${l.status}*

Terima kasih telah menunggu 🙏
      `;

      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: l.telegram_chat_id,
            text: message,
            parse_mode: "Markdown",
          }),
        }
      );
    }

    // ================== RESPONSE ==================
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("UPDATE LAPORAN ERROR:", err);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
