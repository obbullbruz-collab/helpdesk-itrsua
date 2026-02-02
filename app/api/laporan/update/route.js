import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "teknisi") {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const { laporan_id, status, pic, estimasi, komentar } = await req.json();

    await db.query(
      `UPDATE laporan
       SET status=?, pic=?, estimasi=?, komentar=?
       WHERE id=?`,
      [status, pic, estimasi, komentar, laporan_id]
    );

    // 🔔 NOTIF USER
    await fetch(`${process.env.BOT_BASE_URL}/notify-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ laporan_id }),
    });

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
