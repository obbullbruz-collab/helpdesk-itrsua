export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs/promises";
import { sendToTeknisi } from "@/lib/telegram";

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

    // ================= USER =================
    const [[user]] = await db.query(
      "SELECT username FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    const namaUser = user?.username || `User ${userId}`;

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

    // ================= FILE UPLOAD (FIX 404) =================
    let fileName = null;

    if (gambar && typeof gambar === "object" && gambar.size > 0) {
      const bytes = await gambar.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = gambar.name.split(".").pop();
      fileName = `${Date.now()}.${ext}`;

      // 🔥 PATH PALING BENAR UNTUK NEXT + RAILWAY
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
    }

    // ================= INSERT DB =================
    await db.query(
      `INSERT INTO laporan
        (user_id, judul, deskripsi, kategori, prioritas, lokasi, gambar, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Baru')`,
      [userId, judul, deskripsi, kategori, prioritas, lokasi, fileName]
    );

    // ================= TELEGRAM (OPTIONAL) =================
    try {
      const [teknisi] = await db.query(
        "SELECT username, telegram_chat_id FROM users WHERE role = 'teknisi' AND telegram_chat_id IS NOT NULL"
      );

      if (teknisi.length) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const link = `${baseUrl}/teknisi`;
        const imageUrl = fileName ? `${baseUrl}/uploads/${fileName}` : null;

        const text = `📢 *Laporan Baru Masuk*

👤 User: ${namaUser}
📝 Judul: ${judul}
📄 Deskripsi: ${deskripsi}
📍 Lokasi: ${lokasi}
⚠️ Prioritas: ${prioritas}

🔗 Cek: ${link}`;

        await sendToTeknisi(teknisi, text, imageUrl);
      }
    } catch (tgErr) {
      console.error("TELEGRAM ERROR (DIABAIKAN):", tgErr);
    }

    // ================= DONE =================
    return Response.json({ success: true });
  } catch (err) {
    console.error("ERROR LAPORAN USER:", err);
    return Response.json(
      { message: "Terjadi kesalahan saat mengirim laporan" },
      { status: 500 }
    );
  }
}
