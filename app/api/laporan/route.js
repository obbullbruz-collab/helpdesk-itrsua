export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    // ================= TOKEN =================
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return Response.json({ message: "Token tidak ditemukan" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return Response.json({ message: "Token tidak valid" }, { status: 401 });
    }

    const userId = decoded.id;

    // ================= FORM DATA (🔥 FIX UTAMA) =================
    const form = await request.formData();

    const judul = form.get("judul");
    const deskripsi = form.get("deskripsi");
    const kategori = form.get("kategori");
    const lokasi = form.get("lokasi");
    const prioritas = form.get("prioritas");
    const gambar = form.get("gambar"); // File atau null

    if (!judul || !deskripsi) {
      return Response.json(
        { message: "Judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    // ================= SIMPAN FILE (OPTIONAL) =================
    let gambarPath = null;

    if (gambar && typeof gambar === "object") {
      // NOTE: demo mode → simpan nama file saja
      gambarPath = `/uploads/${gambar.name}`;
    }

    // ================= INSERT LAPORAN =================
    await db.query(
      `
      INSERT INTO laporan
      (user_id, judul, deskripsi, kategori, lokasi, prioritas, gambar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Baru')
      `,
      [
        userId,
        judul,
        deskripsi,
        kategori || "Umum",
        lokasi || null,
        prioritas || "Sedang",
        gambarPath,
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
