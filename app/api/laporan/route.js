export const runtime = "nodejs";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { sendToTeknisi } from "@/lib/telegram";

export async function POST(req) {
  try {
    // ================= AUTH =================
    const token = req.cookies.get("token")?.value;
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

    // 🔥 FIX UTAMA
    const prioritas = formData.get("prioritas") || "Sedang";

    const gambar = formData.get("image");

    if (!judul || !deskripsi) {
      return Response.json(
        { message: "Judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    // ================= FILE =================
    let fileName = null;

    if (gambar && typeof gambar === "object" && gambar.size > 0) {
      const bytes = await gambar.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = gambar.name.split(".").pop();
      fileName = `${Date.now()}.${ext}`;

      const fs = await import("fs/promises");
      await fs.mkdir("./public/uploads", { recursive: true });
      await fs.writeFile(`./public/uploads/${fileName}`, buffer);
    }

    // ================= INSERT (WAJIB BERHASIL) =================
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
    console.error("ERROR LAPORAN USER:", err);
    return Response.json(
      { message: "Terjadi kesalahan saat mengirim laporan" },
      { status: 500 }
    );
  }
}
