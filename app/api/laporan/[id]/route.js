export const runtime = "nodejs";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function PUT(req) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const token = cookie
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "teknisi") {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id, status, pic, komentar } = await req.json();

    await db.query(
      `UPDATE laporan
       SET status = ?, pic = ?, komentar = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, pic || null, komentar || null, id]
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("UPDATE LAPORAN ERROR:", err);
    return Response.json({ message: "Update gagal" }, { status: 500 });
  }
}
