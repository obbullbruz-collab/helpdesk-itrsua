"use client";

import { useEffect, useState } from "react";

const STATUS_BADGE = {
  Baru: "bg-blue-100 text-blue-700",
  Diproses: "bg-yellow-100 text-yellow-700",
  Selesai: "bg-green-100 text-green-700",
};

export default function TeknisiPage() {
  const [laporan, setLaporan] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  const fetchLaporan = async () => {
    const r = await fetch("/api/teknisi/laporan", {
      credentials: "include",
      cache: "no-store",
    });
    setLaporan(await r.json());
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  const handleUpdate = async (l) => {
    setLoadingId(l.id);

    const res = await fetch("/api/teknisi/laporan/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: l.id,
        status: l._status || l.status,
        pic: l._pic || l.pic,
        estimasi: l._estimasi || l.estimasi,
        komentar: l._komentar || l.komentar,
      }),
    });

    if (res.ok) {
      alert("✅ Laporan berhasil diupdate & notifikasi dikirim ke user");
    } else {
      alert("❌ Gagal update laporan");
    }

    await fetchLaporan();
    setLoadingId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Teknisi</h1>

      {laporan.map((l) => {
        const img =
          typeof l.gambar === "string" && l.gambar.startsWith("http")
            ? l.gambar
            : null;

        return (
          <div
            key={l.id}
            className="bg-white border rounded shadow p-4 space-y-3"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start">
              <h2 className="font-semibold text-lg">{l.judul}</h2>
              <span
                className={`text-xs px-2 py-1 rounded ${STATUS_BADGE[l.status]}`}
              >
                {l.status}
              </span>
            </div>

            <p className="text-xs text-gray-500">
              👤 {l.username} •{" "}
              {new Date(l.created_at).toLocaleString("id-ID")}
            </p>

            <p className="text-sm">
              <b>Kategori:</b> {l.kategori} |{" "}
              <b>Prioritas:</b> {l.prioritas} |{" "}
              <b>Estimasi:</b> {l.estimasi || "-"}
            </p>

            {/* IMAGE */}
            {img && (
              <img
                src={img}
                alt={l.judul}
                className="w-full max-w-sm rounded border"
              />
            )}

            <p className="text-sm text-gray-700">
              <b>Deskripsi:</b> {l.deskripsi}
            </p>

            {/* FORM UPDATE */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select
                defaultValue={l.status}
                className="border rounded px-2 py-1"
                onChange={(e) => (l._status = e.target.value)}
              >
                <option>Baru</option>
                <option>Diproses</option>
                <option>Selesai</option>
              </select>

              <input
                defaultValue={l.pic || ""}
                placeholder="PIC"
                className="border rounded px-2 py-1"
                onChange={(e) => (l._pic = e.target.value)}
              />

              <input
                defaultValue={l.estimasi || ""}
                placeholder="Estimasi (contoh: 2 hari)"
                className="border rounded px-2 py-1"
                onChange={(e) => (l._estimasi = e.target.value)}
              />

              <input
                defaultValue={l.komentar || ""}
                placeholder="Komentar teknisi"
                className="border rounded px-2 py-1 md:col-span-4"
                onChange={(e) => (l._komentar = e.target.value)}
              />

              <button
                disabled={loadingId === l.id}
                onClick={() => handleUpdate(l)}
                className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50 md:col-span-4"
              >
                {loadingId === l.id ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
