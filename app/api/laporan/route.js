export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    // ================= AMBIL TOKEN (COOKIE ATAU HEADER) =================
    let token = null;

    const auth = request.headers.get("authorization");
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.replace("Bearer ", "");
    } else {
      token = request.cookies.get("token")?.value;
    }

    if (!token) {
      return Response.json(
        { message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return Response.json(
        { message: "Token tidak valid" },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // ================= AMBIL BODY =================
    const {
      judul,
      deskripsi,
      kategori,
      prioritas,
      lokasi,
      gambar,
    } = await request.json();

    if (!judul || !deskripsi) {
      return Response.json(
        { message: "Judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    // ================= INSERT LAPORAN (🔥 FIX UTAMA) =================
    await db.query(
      `
      INSERT INTO laporan
      (user_id, judul, deskripsi, kategori, prioritas, lokasi, gambar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Baru')
      `,
      [
        userId,
        judul,
        deskripsi,
        kategori || "Umum",      // 🔥 BIAR GAK ERROR LAGI
        prioritas || "Sedang",
        lokasi || null,
        gambar || null,
      ]
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("CREATE LAPORAN ERROR:", err);
    return Response.json(
      { message: "Server error", error: String(err) },
      { status: 500 }
    );
  }
}
