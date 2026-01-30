import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json([], { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId || decoded.user_id;

    if (!userId) {
      return NextResponse.json([], { status: 401 });
    }

    const [rows] = await db.query(
      "SELECT * FROM laporan WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET USER LAPORAN ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
