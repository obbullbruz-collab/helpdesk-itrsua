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
          throw new Error("Fetch gagal");
        }

        const data = await res.json();
        console.log("DATA DARI API:", data);

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
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  // ===== ERROR =====
  if (error) {
    return (
      <div style={{ padding: 20, color: "red" }}>
        Error: {error}
      </div>
    );
  }

  // ===== TIDAK ADA DATA =====
  if (!Array.isArray(laporan) || laporan.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Dashboard User</h2>
        <p>Tidak ada laporan.</p>
      </div>
    );
  }

  // ===== DATA ADA (PASTI RENDER) =====
  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard User</h1>

      {laporan.map((l) => (
        <div
          key={`laporan-${l.id}`}
          style={{
            border: "1px solid #ccc",
            marginBottom: 12,
            padding: 12,
          }}
        >
          <h3>{l.judul}</h3>
          <p><b>Status:</b> {l.status}</p>
          <p><b>Kategori:</b> {l.kategori}</p>
          <p><b>Prioritas:</b> {l.prioritas}</p>
          <p><b>Deskripsi:</b> {l.deskripsi}</p>

          {l.gambar && (
            <img
              src={`/uploads/${l.gambar}`}
              alt={l.judul}
              style={{
                width: 200,
                marginTop: 8,
                border: "1px solid #ddd",
              }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/no-image.png";
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
