export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    // ================= AUTH =================
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

    // ================= FORM =================
    const formData = await req.formData();

    const judul = formData.get("judul");
    const deskripsi = formData.get("deskripsi");
    const kategori = formData.get("kategori") || "";
    const lokasi = formData.get("lokasi") || "";
    const prioritas = formData.get("prioritas") || "Sedang";
    const gambar = formData.get("image");

    if (!judul || !deskripsi) {
      return Response.json(
        { message: "Judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    // ================= UPLOAD CLOUDINARY =================
    let imageUrl = null;

    if (gambar && typeof gambar === "object" && gambar.size > 0) {
      const bytes = await gambar.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = gambar.name.split(".").pop();

      const uploadResult = await cloudinary.uploader.upload(
        `data:image/${ext};base64,${buffer.toString("base64")}`,
        {
          folder: "laporan",
        }
      );

      imageUrl = uploadResult.secure_url; // 🔥 URL FINAL
    }

    // ================= INSERT DB =================
    await db.query(
      `INSERT INTO laporan
        (user_id, judul, deskripsi, kategori, prioritas, lokasi, gambar, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Baru')`,
      [
        userId,
        judul,
        deskripsi,
        kategori,
        prioritas,
        lokasi,
        imageUrl, // URL Cloudinary
      ]
    );


        // ================= TELEGRAM (OPTIONAL) =================
    try {
      const [teknisi] = await db.query(
        "SELECT username, telegram_chat_id FROM users WHERE role = 'teknisi' AND telegram_chat_id IS NOT NULL"
      );

      if (teknisi.length) {
        const link = `http://localhost:3000/teknisi`;
        const text = `📢 *Laporan Baru Masuk*

👤 User: ${namaUser}
📝 Judul: ${judul}
📄 Deskripsi: ${deskripsi}
📍 Lokasi: ${lokasi}
⚠️ Prioritas: ${prioritas}

🔗 Cek: ${link}`;

        const imageUrl = fileName
          ? `http://localhost:3000/uploads/${fileName}`
          : null;

        await sendToTeknisi(teknisi, text, imageUrl);
      }
    } catch (tgErr) {
      console.error("TELEGRAM ERROR (DIABAIKAN):", tgErr);
    }

    // ================= DONE =================
    return Response.json({ success: true });
  } catch (err) {
    console.error("API LAPORAN ERROR:", err);
    return Response.json(
      { message: "Terjadi kesalahan saat mengirim laporan" },
      { status: 500 }
    );
  }
}
