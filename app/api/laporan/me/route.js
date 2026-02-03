import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

export default async function handler(req, res) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ user: null });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [[user]] = await db.query(
      "SELECT id, username, role FROM users WHERE id=?",
      [decoded.id]
    );

    return res.json({ user });
  } catch {
    return res.status(401).json({ user: null });
  }
}
