import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const form = await req.formData();
    const judul = form.get("judul");
    const deskripsi = form.get("deskripsi");

    if (!judul || !deskripsi) {
      return Response.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO laporan (user_id, judul, deskripsi, status)
       VALUES (?, ?, ?, 'Baru')`,
      [decoded.id, judul, deskripsi]
    );

    // 🔔 NOTIF TEKNISI
    await fetch(`${process.env.BOT_BASE_URL}/notify-teknisi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ laporan_id: result.insertId }),
    });

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
