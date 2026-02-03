export const runtime = "nodejs";

import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  const token = cookies().get("token")?.value;

  if (!token) {
    return Response.json({ user: null }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [[user]] = await db.query(
      "SELECT id, username, role FROM users WHERE id=?",
      [decoded.id]
    );

    return Response.json({ user });
  } catch {
    return Response.json({ user: null }, { status: 401 });
  }
}
