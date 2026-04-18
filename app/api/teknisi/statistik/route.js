import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "harian";

    let rows = [];

    // ================= HARIAN =================
    if (mode === "harian") {
      const [r] = await db.query(`
        SELECT
          DATE(created_at) AS label,
          COUNT(*) AS total
        FROM laporan
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `);
      rows = r;
    }

    // ================= MINGGUAN =================
    else if (mode === "mingguan") {
      const [r] = await db.query(`
        SELECT
          YEARWEEK(created_at, 1) AS week,
          MIN(DATE(created_at)) AS start_date,
          MAX(DATE(created_at)) AS end_date,
          COUNT(*) AS total
        FROM laporan
        GROUP BY YEARWEEK(created_at, 1)
        ORDER BY week
      `);
      rows = r;
    }

    // ================= BULANAN =================
    else if (mode === "bulanan") {
      const [r] = await db.query(`
        SELECT
          YEAR(created_at) AS year,
          MONTH(created_at) AS month,
          COUNT(*) AS total
        FROM laporan
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY YEAR(created_at), MONTH(created_at)
      `);
      rows = r;
    }

    // ================= PER PIC =================
    else if (mode === "pic") {
      const [r] = await db.query(`
        SELECT 
          pic,
          COUNT(*) AS total
        FROM laporan
        WHERE status = 'selesai'
        GROUP BY pic
      `);

      rows = r;
    }
    
    return Response.json(rows);
  } catch (err) {
    console.error("STATISTIK ERROR:", err);
    return Response.json([], { status: 500 });
  }
}
