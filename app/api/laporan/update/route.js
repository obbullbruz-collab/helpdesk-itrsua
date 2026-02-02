export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    // ================= AMBIL TOKEN (HEADER ATAU COOKIE) =================
    let token = null;

    const auth = req.headers.get("authorization");
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.replace("Bearer ", "");
    } else {
      token = req.cookies.get("token")?.value;
    }

    if (!token) {
      return Response.json(
        { message: "Token tidak ditemukan, silakan login ulang" },
        { status: 401 }
      );
    }

    // ================= VERIFY JWT =================
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return Response.json(
        { message: "Token tidak valid" },
        { status: 401 }
      );
    }

    if (decoded.role !== "teknisi") {
      return Response.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // ================= BODY =================
    const { laporan_id, status, pic, estimasi, komentar } = await req.json();

    if (!laporan_id) {
      return Response.json(
        { message: "laporan_id wajib" },
        { status: 400 }
      );
    }

    // ================= UPDATE LAPORAN =================
    await db.query(
      `
      UPDATE laporan
      SET status = ?, pic = ?, estimasi = ?, komentar = ?
      WHERE id = ?
      `,
      [status, pic, estimasi, komentar, laporan_id]
    );

    // ================= NOTIF USER (TELEGRAM) =================
    try {
      await fetch(`${process.env.BOT_BASE_URL}/notify-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ laporan_id }),
      });
    } catch (e) {
      console.error("NOTIF USER ERROR:", e.message);
      // ❗ sengaja tidak return error
    }

    // ================= RESPONSE =================
    return Response.json({ success: true });
  } catch (err) {
    console.error("UPDATE LAPORAN ERROR:", err);
    return Response.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
