export const runtime = "nodejs";

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

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "harian";

    let query = "";

    if (mode === "harian") {
      query = `
        SELECT DATE(created_at) label, COUNT(*) total
        FROM laporan
        GROUP BY DATE(created_at)
        ORDER BY label
      `;
    } else if (mode === "mingguan") {
      query = `
        SELECT YEARWEEK(created_at) label, COUNT(*) total
        FROM laporan
        GROUP BY YEARWEEK(created_at)
        ORDER BY label
      `;
    } else {
      query = `
        SELECT DATE_FORMAT(created_at, '%Y-%m') label, COUNT(*) total
        FROM laporan
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY label
      `;
    }

    const [rows] = await db.query(query);
    return Response.json(rows);
  } catch (err) {
    console.error("GRAFIK ERROR:", err);
    return Response.json([], { status: 500 });
  }
}
