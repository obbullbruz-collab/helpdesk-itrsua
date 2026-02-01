"use client";

import { useEffect, useState } from "react";

const STATUS_COLOR = {
  Baru: "border-blue-400 bg-blue-50",
  Diproses: "border-yellow-400 bg-yellow-50",
  Selesai: "border-green-400 bg-green-50",
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

    await fetch("/api/teknisi/laporan/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: l.id,
        status: l._status || l.status,
        pic: l._pic || l.pic,
        komentar: l._komentar || l.komentar,
        estimasi: l._estimasi || l.estimasi,
      }),
    });

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
            className={`border-l-4 rounded p-4 flex gap-4 ${STATUS_COLOR[l.status]}`}
          >
            {/* IMAGE */}
            <div className="w-28 h-28 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {img ? (
                <img src={img} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">No Image</span>
              )}
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{l.judul}</h2>
              <p className="text-xs text-gray-500">
                👤 {l.username} •{" "}
                {new Date(l.created_at).toLocaleString("id-ID")}
              </p>

              <p className="text-sm mt-1">
                {l.kategori} | {l.prioritas} | {l.status}
              </p>

              <p className="text-sm text-gray-700">{l.deskripsi}</p>

              {/* FORM */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-3">
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
                  placeholder="PIC"
                  defaultValue={l.pic || ""}
                  className="border rounded px-2 py-1"
                  onChange={(e) => (l._pic = e.target.value)}
                />

                <input
                  placeholder="Estimasi (contoh: 2 hari)"
                  defaultValue={l.estimasi || ""}
                  className="border rounded px-2 py-1"
                  onChange={(e) => (l._estimasi = e.target.value)}
                />

                <input
                  placeholder="Komentar teknisi"
                  defaultValue={l.komentar || ""}
                  className="border rounded px-2 py-1 col-span-2"
                  onChange={(e) => (l._komentar = e.target.value)}
                />

                <button
                  disabled={loadingId === l.id}
                  onClick={() => handleUpdate(l)}
                  className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 disabled:opacity-50 md:col-span-5"
                >
                  {loadingId === l.id ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
