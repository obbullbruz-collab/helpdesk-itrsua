"use client";

import { useEffect, useState } from "react";

export default function TeknisiPage() {
  const [laporan, setLaporan] = useState([]);
  const [grafik, setGrafik] = useState([]);
  const [mode, setMode] = useState("harian");

  const fetchLaporan = async () => {
    const r = await fetch("/api/teknisi/laporan", {
      credentials: "include",
      cache: "no-store",
    });
    setLaporan(await r.json());
  };

  const fetchGrafik = async (m) => {
    const r = await fetch(`/api/teknisi/grafik?mode=${m}`, {
      credentials: "include",
    });
    setGrafik(await r.json());
  };

  useEffect(() => {
    fetchLaporan();
    fetchGrafik(mode);
  }, [mode]);

  const updateLaporan = async (id, status, pic, komentar) => {
    await fetch("/api/teknisi/laporan/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, status, pic, komentar }),
    });
    fetchLaporan();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Teknisi</h1>

      {/* GRAFIK */}
      <div className="bg-white rounded shadow p-4">
        <div className="flex gap-2 mb-3">
          {["harian", "mingguan", "bulanan"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded ${
                mode === m ? "bg-green-600 text-white" : "bg-gray-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <ul className="text-sm text-gray-600">
          {grafik.map((g) => (
            <li key={g.label}>
              {g.label} : {g.total}
            </li>
          ))}
        </ul>
      </div>

      {/* LAPORAN */}
      {laporan.map((l) => {
        const img =
          typeof l.gambar === "string" && l.gambar.startsWith("http")
            ? l.gambar
            : null;

        return (
          <div
            key={l.id}
            className="bg-yellow-50 border border-yellow-200 rounded p-4 flex gap-4"
          >
            <div className="w-28 h-28 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {img ? (
                <img src={img} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">No Image</span>
              )}
            </div>

            <div className="flex-1">
              <h2 className="font-semibold">{l.judul}</h2>
              <p className="text-xs text-gray-500">
                👤 {l.username} •{" "}
                {new Date(l.created_at).toLocaleString("id-ID")}
              </p>
              <p className="text-sm">
                {l.kategori} | {l.prioritas} | {l.status}
              </p>
              <p className="text-sm text-gray-700">{l.deskripsi}</p>

              <div className="grid grid-cols-4 gap-2 mt-3">
                <select
                  defaultValue={l.status}
                  onChange={(e) =>
                    updateLaporan(
                      l.id,
                      e.target.value,
                      l.pic,
                      l.komentar
                    )
                  }
                  className="border rounded px-2 py-1"
                >
                  <option>Baru</option>
                  <option>Diproses</option>
                  <option>Selesai</option>
                </select>

                <input
                  placeholder="PIC"
                  defaultValue={l.pic || ""}
                  className="border rounded px-2 py-1"
                />

                <input
                  placeholder="Komentar"
                  defaultValue={l.komentar || ""}
                  className="border rounded px-2 py-1 col-span-2"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
