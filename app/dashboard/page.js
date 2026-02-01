"use client";

import { useEffect, useState } from "react";

export default function DashboardUser() {
  const [laporan, setLaporan] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/laporan/user", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();
      console.log("DATA LAPORAN:", data);
      setLaporan(data);
    };

    load();
  }, []);

  if (laporan === null) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard User</h1>

      {laporan.map((l) => {
        const img = l.gambar ? `/api/uploads/${l.gambar}` : null;

        return (
          <div
            key={l.id}
            className="border-l-4 border-blue-500 bg-white rounded shadow p-4 mb-4 flex gap-4"
          >
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

            <div>
              <h2 className="font-semibold">{l.judul}</h2>
              <p>Status: {l.status}</p>
              <p>Kategori: {l.kategori}</p>
              <p>Prioritas: {l.prioritas}</p>
              <p>Deskripsi: {l.deskripsi}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
