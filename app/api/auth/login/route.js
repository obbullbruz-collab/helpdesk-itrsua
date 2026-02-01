export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json(
        { message: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    // ===== CEK USER =====
    const [rows] = await db.query(
      "SELECT id, username, password, role FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      return Response.json(
        { message: "Username tidak ditemukan" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // ===== CEK PASSWORD =====
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return Response.json(
        { message: "Password salah" },
        { status: 401 }
      );
    }

    // ===== BUAT JWT =====
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ===== RESPONSE =====
    const res = Response.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    // 🔥🔥🔥 INI KUNCI UTAMA 🔥🔥🔥
    // TANPA Path=/  -> GET /api/laporan/user = []
    res.headers.append(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; SameSite=Lax`
    );

    return res;
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return Response.json(
      { message: "Server error", error: String(err) },
      { status: 500 }
    );
  }
}
