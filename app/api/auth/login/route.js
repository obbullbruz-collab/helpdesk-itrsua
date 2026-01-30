export const runtime = "nodejs";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "Username tidak ditemukan" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return new Response(
        JSON.stringify({ message: "Password salah" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const res = new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

    // set cookie manual
    res.headers.append(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; SameSite=Lax`
    );

    return res;
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return new Response(
      JSON.stringify({ message: "Server error", error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
