"use client";

import { useEffect, useState } from "react";

export default function DashboardUser() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/laporan/me");

        if (!r.ok) {
          throw new Error("Gagal ambil data");
        }

        const text = await r.text();
        if (!text) {
          setLaporan([]);
          return;
        }

        const d = JSON.parse(text);
        setLaporan(Array.isArray(d) ? d : []);
      } catch (e) {
        console.error("DASHBOARD USER ERROR:", e);
        setLaporan([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const hitungDurasi = (created, updated, status) => {
    const start = new Date(created);
    const end = status === "Selesai" && updated ? new Date(updated) : new Date();

    const diffMs = end - start;
    const menit = Math.floor(diffMs / 60000);
    const jam = Math.floor(menit / 60);
    const hari = Math.floor(jam / 24);

    if (hari > 0) return `${hari} hari ${jam % 24} jam`;
    if (jam > 0) return `${jam} jam ${menit % 60} menit`;
    return `${menit} menit`;
  };

  if (loading) return <p className="p-6">Memuat...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard User</h1>
      <p className="text-gray-600 mb-6">
        Riwayat laporan yang pernah kamu kirim
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {laporan.map((l) => {
          const img = l.gambar ? `/uploads/${l.gambar}` : null;

          let border = "border-gray-300";
          if (l.status === "Selesai") border = "border-green-500";
          if (l.status === "Diproses") border = "border-yellow-500";
          if (l.status === "Baru") border = "border-blue-500";

          return (
            <div
              key={l.id}
              className={`border-l-4 ${border} bg-white rounded shadow p-4 flex gap-4`}
            >
              <div className="w-28 h-28 bg-gray-100 flex items-center justify-center rounded overflow-hidden">
                {img ? (
                  <img
                    src={img}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/no-image.png";
                    }}
                  />
                ) : (
                  <span className="text-xs text-gray-400">No Image</span>
                )}
              </div>

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
                  <b>Kategori:</b> {l.kategori} <br />
                  <b>Prioritas:</b> {l.prioritas}
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
                  <p>
                    <b>Lama pengerjaan:</b>{" "}
                    {hitungDurasi(l.created_at, l.updated_at, l.status)}
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
