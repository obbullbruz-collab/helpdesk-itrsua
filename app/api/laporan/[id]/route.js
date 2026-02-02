import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const {
      laporan_id,
      status,
      pic,
      estimasi,
      komentar,
    } = await req.json();

    if (!laporan_id || !status) {
      return Response.json(
        { message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    await db.query(
      `
      UPDATE laporan
      SET status=?, pic=?, komentar=?, estimasi=?
      WHERE id=?
      `,
      [status, pic, komentar, estimasi, laporan_id]
    );

    // 🔥 TRIGGER BOT → NOTIF USER
    await fetch(`${process.env.BOT_BASE_URL}/notify-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ laporan_id }),
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("UPDATE LAPORAN ERROR:", err);
    return Response.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const {
      laporan_id,
      status,
      pic,
      estimasi,
      komentar,
    } = await req.json();

    if (!laporan_id || !status) {
      return Response.json(
        { message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    await db.query(
      `
      UPDATE laporan
      SET status=?, pic=?, komentar=?, estimasi=?
      WHERE id=?
      `,
      [status, pic, komentar, estimasi, laporan_id]
    );

    // 🔥 TRIGGER BOT → NOTIF USER
    await fetch(`${process.env.BOT_BASE_URL}/notify-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ laporan_id }),
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("UPDATE LAPORAN ERROR:", err);
    return Response.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
