"use client";

import { useEffect, useState } from "react";

export default function DashboardUser() {
  const [laporan, setLaporan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/laporan/user", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Gagal mengambil data laporan");
        }

        const data = await res.json();
        console.log("DATA LAPORAN:", data);
        setLaporan(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    load();
  }, []);

  // ===== LOADING =====
  if (laporan === null && !error) {
    return <div className="p-6">Memuat dashboard...</div>;
  }

  // ===== ERROR =====
  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error: {error}
      </div>
    );
  }

  // ===== KOSONG =====
  if (!Array.isArray(laporan) || laporan.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Dashboard User</h1>
        <p className="text-gray-500 mt-2">Belum ada laporan.</p>
      </div>
    );
  }

  // ===== DATA ADA =====
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard User</h1>
      <p className="text-gray-600 mb-6">
        Riwayat laporan yang pernah kamu kirim
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {laporan.map((l) => {
         
          const img =
            typeof l.gambar === "string" &&
            l.gambar.startsWith("http")
              ? l.gambar
              : null;

          let border = "border-gray-300";
          if (l.status === "Selesai") border = "border-green-500";
          if (l.status === "Diproses") border = "border-yellow-500";
          if (l.status === "Baru") border = "border-blue-500";

          return (
            <div
              key={`laporan-${l.id}`}
              className={`border-l-4 ${border} bg-white rounded shadow p-4 flex gap-4`}
            >
              {/* ===== IMAGE ===== */}
              <div className="w-28 h-28 bg-gray-100 flex items-center justify-center rounded overflow-hidden">
                {img ? (
                  <img
                    src={img}
                    alt={l.judul}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No Image</span>
                )}
              </div>

              {/* ===== CONTENT ===== */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold text-lg">{l.judul}</h2>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">
                    {l.status}
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  {new Date(l.created_at).toLocaleString("id-ID")}
                </p>

                <p className="text-sm mt-1">
                  <b>Kategori:</b> {l.kategori || "-"} <br />
                  <b>Prioritas:</b> {l.prioritas || "-"}
                </p>

                <p className="text-sm mt-1 text-gray-700">
                  <b>Deskripsi:</b> {l.deskripsi || "-"}
                </p>

                <div className="text-sm mt-2">
                  <p>
                    <b>PIC:</b> {l.pic || "-"}
                  </p>
                  <p>
                    <b>Komentar Teknisi:</b> {l.komentar || "-"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
