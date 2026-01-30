export const runtime = "nodejs";

import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        l.id,
        l.user_id,
        l.judul,
        l.kategori,
        l.prioritas,
        l.deskripsi,
        l.lokasi,
        l.status,
        l.created_at,
        l.updated_at,
        l.komentar,
        l.pic,
        l.gambar,
        l.estimasi,
        u.username
      FROM laporan l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("TEKNISI LAPORAN ERROR:", err);

    return new Response(
      JSON.stringify({
        message: "Gagal mengambil data laporan",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
