"use client";

import { useEffect, useState } from "react";

const PRIORITY_ORDER = {
  Tinggi: 1,
  Sedang: 2,
  Rendah: 3,
};

export default function TeknisiPage() {
  const [laporan, setLaporan] = useState([]);
  const [grafik, setGrafik] = useState([]);
  const [mode, setMode] = useState("harian");
  const [loading, setLoading] = useState(false);

  // ===== FETCH LAPORAN =====
  const fetchLaporan = async () => {
    const r = await fetch("/api/teknisi/laporan", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await r.json();

    // sort by priority
    data.sort(
      (a, b) =>
        PRIORITY_ORDER[a.prioritas] - PRIORITY_ORDER[b.prioritas]
    );

    setLaporan(data);
  };

  // ===== FETCH GRAFIK =====
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

  // ===== UPDATE LAPORAN =====
  const updateLaporan = async (id, status, pic, komentar) => {
    setLoading(true);
    await fetch("/api/teknisi/laporan/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, status, pic, komentar }),
    });
    await fetchLaporan();
    setLoading(false);
  };

  const renderSection = (title, status) => {
    const list = laporan.filter((l) => l.status === status);

    if (!list.length) return null;

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>

        {list.map((l) => {
          const img =
            typeof l.gambar === "string" &&
            l.gambar.startsWith("http")
              ? l.gambar
              : null;

          return (
            <div
              key={l.id}
              className="bg-yellow-50 border border-yellow-200 rounded p-4 flex gap-4"
            >
              {/* IMAGE */}
              <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                {img ? (
                  <img
                    src={img}
                    alt={l.judul}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">
                    No Image
                  </span>
                )}
              </div>

              {/* CONTENT */}
              <div className="flex-1">
                <h3 className="font-semibold">{l.judul}</h3>
                <p className="text-xs text-gray-500">
                  👤 {l.username} •{" "}
                  {new Date(l.created_at).toLocaleString("id-ID")}
                </p>

                <p className="text-sm mt-1">
                  {l.kategori} | {l.prioritas} | {l.status}
                </p>

                <p className="text-sm text-gray-700 mt-1">
                  {l.deskripsi}
                </p>

                {/* FORM UPDATE */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
                  <select
                    defaultValue={l.status}
                    className="border rounded px-2 py-1"
                    onChange={(e) =>
                      (l._status = e.target.value)
                    }
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
                    defaultValue={l.komentar || ""}
                    placeholder="Komentar"
                    className="border rounded px-2 py-1"
                    onChange={(e) =>
                      (l._komentar = e.target.value)
                    }
                  />

                  <button
                    disabled={loading}
                    onClick={() =>
                      updateLaporan(
                        l.id,
                        l._status || l.status,
                        l._pic || l.pic,
                        l._komentar || l.komentar
                      )
                    }
                    className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard Teknisi</h1>

      {/* ===== GRAFIK ===== */}
      <div className="bg-white rounded shadow p-4">
        <div className="flex gap-2 mb-3">
          {["harian", "mingguan", "bulanan"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded ${
                mode === m
                  ? "bg-green-600 text-white"
                  : "bg-gray-200"
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

      {/* ===== SECTIONS ===== */}
      {renderSection("Laporan Baru", "Baru")}
      {renderSection("Laporan Diproses", "Diproses")}
      {renderSection("Laporan Selesai", "Selesai")}
    </div>
  );
}
