export const runtime = "nodejs";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { sendToUser } from "@/lib/telegram"; // ⬅️ bot ke USER

export async function PUT(req) {
  try {
    // ===== AUTH =====
    const cookie = req.headers.get("cookie") || "";
    const token = cookie
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "teknisi") {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    // ===== BODY =====
    const { id, status, pic, komentar, estimasi } = await req.json();

    // ===== UPDATE DB =====
    await db.query(
      `UPDATE laporan
       SET status = ?, pic = ?, komentar = ?, estimasi = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, pic || null, komentar || null, estimasi || null, id]
    );

    // ===== AMBIL DATA USER =====
    const [[laporan]] = await db.query(
      `SELECT l.judul, l.status, u.telegram_chat_id
       FROM laporan l
       JOIN users u ON u.id = l.user_id
       WHERE l.id = ?`,
      [id]
    );

    // ===== TELEGRAM USER =====
    if (laporan?.telegram_chat_id) {
      const text = `🔔 *Update Laporan*

📝 Judul: ${laporan.judul}
📌 Status: ${status}
⏳ Estimasi: ${estimasi || "-"}
👨‍🔧 PIC: ${pic || "-"}

💬 Catatan:
${komentar || "-"}`;

      await sendToUser(laporan.telegram_chat_id, text);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("UPDATE TEKNISI ERROR:", err);
    return Response.json(
      { message: "Gagal update laporan" },
      { status: 500 }
    );
  }
}
