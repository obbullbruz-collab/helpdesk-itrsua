export const runtime = "nodejs";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const token = cookies().get("token")?.value;

    if (!token) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [rows] = await db.query(
      `
      SELECT 
        id,
        judul,
        kategori,
        prioritas,
        deskripsi,
        status,
        pic,
        komentar,
        gambar,
        created_at,
        updated_at
      FROM laporan
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("API LAPORAN ME ERROR:", err);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
