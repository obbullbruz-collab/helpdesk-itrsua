import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password, telegram_id } = await req.json();

    if (!username || !password || !telegram_id) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    const [cek] = await db.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (cek.length > 0) {
      return NextResponse.json({ message: "Username sudah digunakan" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, password, role, telegram_id) VALUES (?, ?, ?, ?)",
      [username, hash, "user", telegram_id]
    );

    return NextResponse.json({ message: "Register berhasil" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
