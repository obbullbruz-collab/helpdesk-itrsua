export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    // 🔥 AMBIL COOKIE MANUAL (PALING AMAN DI RAILWAY)
    const cookie = req.headers.get("cookie") || "";
    const token = cookie
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return Response.json({ message: "Invalid token" }, { status: 401 });
    }

    const [rows] = await db.query(
      "SELECT * FROM laporan WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return Response.json(rows);
  } catch (err) {
    console.error("GET USER LAPORAN ERROR:", err);
    return Response.json(
      { message: "Server error", error: String(err) },
      { status: 500 }
    );
  }
}
