export const runtime = "nodejs";

import { db } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "harian";

    let group = "DATE(created_at)";
    if (mode === "bulanan") group = "DATE_FORMAT(created_at, '%Y-%m')";
    if (mode === "mingguan") group = "YEARWEEK(created_at)";

    const [rows] = await db.query(`
      SELECT ${group} AS label, COUNT(*) AS total
      FROM laporan
      GROUP BY label
      ORDER BY label ASC
    `);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("STATISTIK ERROR:", err);
    // WAJIB tetap kirim JSON meskipun error
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
