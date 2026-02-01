export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(req) {
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

    const [rows] = await db.query(`
      SELECT l.*, u.username
      FROM laporan l
      JOIN users u ON u.id = l.user_id
      ORDER BY
        CASE l.status
          WHEN 'Baru' THEN 1
          WHEN 'Diproses' THEN 2
          WHEN 'Selesai' THEN 3
        END,
        CASE l.prioritas
          WHEN 'Tinggi' THEN 1
          WHEN 'Sedang' THEN 2
          WHEN 'Rendah' THEN 3
        END,
        l.created_at DESC
    `);

    return Response.json(rows);
  } catch (err) {
    console.error("GET TEKNISI LAPORAN ERROR:", err);
    return Response.json([], { status: 500 });
  }
}
