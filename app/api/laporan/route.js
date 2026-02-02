export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";

/*
  FLOW:
  1. Validasi JWT user
  2. Ambil form data
  3. Upload gambar ke Cloudinary (opsional)
  4. Insert laporan ke database
  5. Panggil BOT /notify-teknisi
*/

export async function POST(req) {
  try {
    /* ================= AUTH ================= */
    const cookie = req.headers.get("cookie") || "";
    const token = cookie
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return Response.json(
        { message: "Unauthorized" },
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

    /* ================= FORM DATA ================= */
    const formData = await req.formData();

    const judul = formData.get("judul");
    const deskripsi = formData.get("deskripsi");
    const kategori = formData.get("kategori") || "";
    const lokasi = formData.get("lokasi") || "";
    const prioritas = formData.get("prioritas") || "Sedang";
    const gambar = formData.get("image"); // File

    if (!judul || !deskripsi) {
      return Response.json(
        { message: "Judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    /* ================= UPLOAD GAMBAR ================= */
    let imageUrl = null;

    if (gambar && typeof gambar === "object" && gambar.size > 0) {
      const bytes = await gambar.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = gambar.name.split(".").pop();

      const uploadResult = await cloudinary.uploader.upload(
        `data:image/${ext};base64,${buffer.toString("base64")}`,
        { folder: "laporan" }
      );

      imageUrl = uploadResult.secure_url;
    }

    /* ================= INSERT DB ================= */
    const [result] = await db.query(
      `
      INSERT INTO laporan
      (user_id, judul, deskripsi, kategori, prioritas, lokasi, gambar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Baru')
      `,
      [
        userId,
        judul,
        deskripsi,
        kategori,
        prioritas,
        lokasi,
        imageUrl,
      ]
    );

    const laporanId = result.insertId;

    /* ================= TRIGGER BOT ================= */
    if (!process.env.BOT_BASE_URL) {
      console.error("BOT_BASE_URL belum diset");
    } else {
      try {
        await fetch(`${process.env.BOT_BASE_URL}/notify-teknisi`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            laporan_id: laporanId,
          }),
        });
      } catch (err) {
        console.error("Gagal panggil bot:", err);
        // tidak throw → laporan tetap sukses
      }
    }

    /* ================= RESPONSE ================= */
    return Response.json({
      success: true,
      laporan_id: laporanId,
    });
  } catch (err) {
    console.error("API LAPORAN ERROR:", err);
    return Response.json(
      { message: "Terjadi kesalahan saat mengirim laporan" },
      { status: 500 }
    );
  }
}
