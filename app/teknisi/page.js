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

export default function TeknisiPage() {
  const [laporan, setLaporan] = useState([]);
  const [chart, setChart] = useState([]);
  const [dataPic, setDataPic] = useState([]); // 🔥 NEW
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("harian");

  // ================= FETCH LAPORAN =================
  const fetchLaporan = async () => {
    try {
      const res = await fetch("/api/teknisi/laporan", {
        credentials: "include",
      });
      if (!res.ok) return setLaporan([]);
      const data = await res.json();
      setLaporan(Array.isArray(data) ? data : []);
    } catch {
      setLaporan([]);
    }
  };

  // ================= FETCH GRAFIK =================
  const fetchChart = async (m = mode) => {
    try {
      const res = await fetch(`/api/teknisi/statistik?mode=${m}`, {
        credentials: "include",
      });
      const data = await res.json();
      setChart(Array.isArray(data) ? data : []);
    } catch {
      setChart([]);
    }
  };

  // ================= FETCH PIC =================
  const fetchPic = async () => {
    try {
      const res = await fetch(`/api/teknisi/statistik?mode=pic`, {
        credentials: "include",
      });
      const data = await res.json();
      setDataPic(Array.isArray(data) ? data : []);
    } catch {
      setDataPic([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchLaporan();
      await fetchChart();
      await fetchPic(); // 🔥 NEW
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
      const res = await fetch("/api/laporan/update", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          laporan_id: id,
          status,
          pic,
          estimasi,
          komentar,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal update");

      alert("Berhasil update laporan");
      await fetchLaporan();
      await fetchPic(); // 🔥 UPDATE BIAR LANGSUNG REFRESH
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-6">Memuat...</p>;

  // ================= FILTER =================
  const baru = laporan.filter((l) => l.status === "Baru");
  const proses = laporan.filter((l) => l.status === "Diproses");
  const selesai = laporan.filter((l) => l.status === "Selesai");

  // ================= LABEL =================
  const labels = chart.map((c) => {
    if (mode === "mingguan") {
      const start = new Date(c.start_date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
      const end = new Date(c.end_date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
      return `${start} – ${end}`;
    }

    if (mode === "bulanan") {
      const date = new Date(c.year, c.month - 1, 1);
      return date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    }

    return new Date(c.label).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  });

  const values = chart.map((c) => c.total);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Teknisi</h1>

      {/* ================= GRAFIK ================= */}
      <div className="bg-white p-5 rounded-xl shadow mb-10">
        <div className="flex justify-between mb-3">
          <h2 className="font-semibold">Grafik Laporan</h2>
          <div className="flex gap-2">
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
        </div>

        <div className="h-[280px]">
          <Line
            data={{
              labels,
              datasets: [
                {
                  data: values,
                  borderColor: "#22c55e",
                  backgroundColor: "rgba(34,197,94,0.15)",
                  tension: 0.4,
                  fill: true,
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

      {/* ================= STATISTIK PIC ================= */}
      <div className="bg-white p-5 rounded-xl shadow mb-10">
        <h2 className="font-semibold mb-4">Kinerja Teknisi</h2>

        {dataPic.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada data</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dataPic.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg text-center ${
                  index === 0 ? "bg-yellow-100" : "bg-green-50"
                }`}
              >
                <p className="font-bold text-lg">
                  #{index + 1} {item.pic}
                </p>
                <p className="text-sm text-gray-600">
                  {item.total} laporan selesai
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

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
      {items.length === 0 && (
        <p className="text-gray-400 text-sm">Tidak ada data</p>
      )}
      <div className="space-y-4">
        {items.map((item) => (
          <LaporanCard key={item.id} item={item} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}

// ================= CARD =================
function LaporanCard({ item, onUpdate }) {
  const [status, setStatus] = useState(item.status);
  const [pic, setPic] = useState(item.pic || "");
  const [estimasi, setEstimasi] = useState(item.estimasi || "");
  const [komentar, setKomentar] = useState(item.komentar || "");

  const img =
    typeof item.gambar === "string" && item.gambar.startsWith("http")
      ? item.gambar
      : null;

  return (
    <div className="border rounded p-4 flex gap-4 bg-yellow-50">
      <div className="w-40 h-32 bg-white border flex items-center justify-center overflow-hidden">
        {img ? (
          <img src={img} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">Tidak ada gambar</span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-bold">{item.judul}</h3>
        <p className="text-sm text-gray-600">
          {item.username} •{" "}
          {new Date(item.created_at).toLocaleString("id-ID")}
        </p>

        <p className="text-sm mt-1">{item.deskripsi}</p>

        <div className="flex gap-2 mt-3 flex-wrap">
          <select
            className="border p-1 rounded"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Baru</option>
            <option>Diproses</option>
            <option>Selesai</option>
          </select>

          <input
            className="border p-1 rounded"
            placeholder="PIC"
            value={pic}
            onChange={(e) => setPic(e.target.value)}
          />

          <input
            className="border p-1 rounded"
            placeholder="Estimasi"
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