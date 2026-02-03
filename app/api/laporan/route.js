export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

/* ================= CLOUDINARY ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================= POST LAPORAN ================= */
export async function POST(request) {
  try {
    /* ========== AUTH (COOKIE) ========== */
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return Response.json({ message: "Token invalid" }, { status: 401 });
    }

    const userId = decoded.id;

    /* ========== FORM DATA (WAJIB) ========== */
    const form = await request.formData();

    const judul = form.get("judul");
    const deskripsi = form.get("deskripsi");
    const kategori = form.get("kategori");
    const lokasi = form.get("lokasi");
    const prioritas = form.get("prioritas");
    const gambar = form.get("gambar"); // File

    if (!judul || !deskripsi) {
      return Response.json(
        { message: "Judul dan deskripsi wajib" },
        { status: 400 }
      );
    }

    /* ========== UPLOAD CLOUDINARY ========== */
    let gambarUrl = null;

    if (gambar && typeof gambar === "object") {
      const buffer = Buffer.from(await gambar.arrayBuffer());

      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "helpdesk" }, (err, res) => {
            if (err) reject(err);
            else resolve(res);
          })
          .end(buffer);
      });

      gambarUrl = upload.secure_url;
    }

    /* ========== INSERT LAPORAN ========== */
    const [result] = await db.query(
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
        gambarUrl,
      ]
    );

    const laporanId = result.insertId;

    /* ========== NOTIF TEKNISI (🔥 FIX) ========== */
    try {
      await fetch(`${process.env.BOT_BASE_URL}/notify-teknisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ laporan_id: laporanId }),
      });
    } catch (e) {
      console.error("NOTIF TEKNISI ERROR:", e.message);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("CREATE LAPORAN ERROR:", err);
    return Response.json(
      { message: "Server error", error: String(err) },
      { status: 500 }
    );
  }
}
