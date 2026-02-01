import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const { filename } = params;

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      filename
    );

    const file = await fs.readFile(filePath);

    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : "application/octet-stream";

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response("Not Found", { status: 404 });
  }
}
