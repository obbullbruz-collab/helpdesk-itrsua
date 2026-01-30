"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const BASE_IMG = "/uploads/";

export default function TeknisiPage() {
  const [laporan, setLaporan] = useState([]);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("harian");

  // ================= FETCH LAPORAN (AMAN) =================
  const fetchLaporan = async () => {
    try {
      const res = await fetch("/api/teknisi/laporan");
      if (!res.ok) {
        setLaporan([]);
        return;
      }

      const text = await res.text();
      if (!text) {
        setLaporan([]);
        return;
      }

      const data = JSON.parse(text);
      setLaporan(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch laporan error:", err);
      setLaporan([]);
    }
  };

  // ================= FETCH GRAFIK =================
  const fetchChart = async (m = mode) => {
    try {
      const res = await fetch(`/api/teknisi/statistik?mode=${m}`);
      const data = await res.json();
      setChart(Array.isArray(data) ? data : []);
    } catch {
      setChart([]);
    }
  };

  // ================= INIT (TANPA Promise.all) =================
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchLaporan(); // 🔥 WAJIB ditunggu
      await fetchChart();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    fetchChart(mode);
  }, [mode]);

  // ================= UPDATE =================
  const handleUpdate = async (id, status, pic, estimasi, komentar) => {
    try {
      const res = await fetch(`/api/laporan/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, pic, estimasi, komentar }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal update");

      alert("Berhasil update laporan");
      await fetchLaporan(); // 🔥 refresh ulang
    } catch (err) {
      alert("Gagal update laporan: " + err.message);
    }
  };

  if (loading) return <p className="p-6">Memuat...</p>;

  // ================= FILTER =================
  const baru = laporan.filter(
    (l) => l.status?.toLowerCase() === "baru"
  );
  const proses = laporan.filter(
    (l) => l.status?.toLowerCase() === "diproses"
  );
  const selesai = laporan.filter(
    (l) => l.status?.toLowerCase() === "selesai"
  );

  // ================= GRAFIK =================
  const labels = chart.map((c) =>
    new Date(c.label).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    })
  );
  const values = chart.map((c) => c.total);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Teknisi</h1>

      {/* ================= GRAFIK ================= */}
      <div className="bg-white p-5 rounded-xl shadow mb-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Grafik Laporan</h2>
          <div className="flex gap-2">
            {["harian", "mingguan", "bulanan"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded text-sm ${
                  mode === m ? "bg-green-600 text-white" : "bg-gray-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-[280px]">
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Jumlah Laporan",
                  data: values,
                  fill: true,
                  tension: 0.4,
                  borderColor: "#22c55e",
                  backgroundColor: "rgba(34,197,94,0.15)",
                  pointRadius: 4,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
              },
            }}
          />
        </div>
      </div>

      {/* ================= LIST ================= */}
      <Section title="Laporan Baru" items={baru} onUpdate={handleUpdate} />
      <Section title="Laporan Diproses" items={proses} onUpdate={handleUpdate} />
      <Section title="Laporan Selesai" items={selesai} onUpdate={handleUpdate} />
    </div>
  );
}

// ================= SECTION =================
function Section({ title, items, onUpdate }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-gray-400 text-sm">Tidak ada data</p>
        )}
        {items.map((item) => (
          <LaporanCard key={item.id} item={item} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}

// ================= CARD =================
function LaporanCard({ item, onUpdate }) {
  const [status, setStatus] = useState(item.status || "Baru");
  const [pic, setPic] = useState(item.pic || "");
  const [estimasi, setEstimasi] = useState(item.estimasi || "");
  const [komentar, setKomentar] = useState(item.komentar || "");

  const img = item.gambar
    ? `${BASE_IMG}${item.gambar.replace(/^\/?/, "")}`
    : null;

  return (
    <div className="border rounded p-4 flex gap-4 bg-yellow-50">
      <div className="w-40 h-32 bg-white border flex items-center justify-center">
        {img ? (
          <img src={img} className="object-cover w-full h-full" />
        ) : (
          <span className="text-gray-400 text-sm">Tidak ada gambar</span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-bold">{item.judul}</h3>

        <p className="text-sm text-gray-600">
          👤 {item.username} •{" "}
          {new Date(item.created_at).toLocaleString("id-ID")}
        </p>

        <p className="text-sm mt-1">
          <b>Kategori:</b> {item.kategori} |{" "}
          <b>Prioritas:</b> {item.prioritas} |{" "}
          <b>Status:</b> {item.status}
        </p>

        <p className="text-sm mt-2">
          <b>Deskripsi:</b> {item.deskripsi}
        </p>

        <div className="flex gap-2 mt-3 flex-wrap">
          <select
            className="border p-1 rounded"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Baru">Baru</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
          </select>

          <input
            className="border p-1 rounded"
            placeholder="PIC"
            value={pic}
            onChange={(e) => setPic(e.target.value)}
          />

          <input
            className="border p-1 rounded"
            placeholder="Estimasi (contoh: 2 hari)"
            value={estimasi}
            onChange={(e) => setEstimasi(e.target.value)}
          />

          <input
            className="border p-1 rounded flex-1"
            placeholder="Komentar"
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
          />

          <button
            onClick={() =>
              onUpdate(item.id, status, pic, estimasi, komentar)
            }
            className="bg-blue-600 text-white px-3 rounded"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
