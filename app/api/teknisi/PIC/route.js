import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pic = searchParams.get("pic");

    if (!pic) {
      return Response.json([]);
    }

    const [rows] = await db.query(`
      SELECT *
      FROM laporan
      WHERE status = 'Selesai'
      AND pic LIKE ?
      ORDER BY created_at DESC
    `, [`%${pic}%`]);

    const [total] = await db.query(`
      SELECT COUNT(*) as total
      FROM laporan
      WHERE status = 'Selesai'
      AND pic LIKE ?
    `, [`%${pic}%`]);

    return Response.json({
      data: rows,
      total: total[0].total,
    });

  } catch (err) {
    console.error(err);
    return Response.json({ data: [], total: 0 }, { status: 500 });
  }
}