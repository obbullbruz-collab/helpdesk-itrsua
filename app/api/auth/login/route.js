export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// cek ENV
console.log("DB URL:", process.env.DATABASE_URL);

export async function POST(request) {
  try {
    // 🔥 TEST DB PALING PENTING
    await db.query("SELECT 1");
    console.log("DB CONNECT OK");

    const { username, password } = await request.json();

    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return Response.json(
        { message: "Username tidak ditemukan" },
        { status: 401 }
      );
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return Response.json(
        { message: "Password salah" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const res = Response.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
      { status: 200 }
    );

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
