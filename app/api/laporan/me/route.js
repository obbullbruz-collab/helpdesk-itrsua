export const runtime = "nodejs";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const token = cookies().get("token")?.value;

    // ❗ FIX 1: kalau tidak ada token → 401
    if (!token) {
      return new Response(JSON.stringify([]), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // ❗ FIX 2: token invalid → 401
      return new Response(JSON.stringify([]), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    // ✅ ini sudah benar, TIDAK diubah
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("API LAPORAN ME ERROR:", err);

    // ❗ server error beneran → 500
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
