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
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("harian");

  // 🔥 FILTER PIC
  const [searchPic, setSearchPic] = useState("");
  const [resultPic, setResultPic] = useState([]);
  const [totalPic, setTotalPic] = useState(0);

  // ================= FETCH LAPORAN =================
  const fetchLaporan = async () => {
    try {
      const res = await fetch("/api/teknisi/laporan", {
        credentials: "include",
      });
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

  // ================= FILTER PIC =================
  const handleSearchPic = async () => {
    try {
      const res = await fetch(`/api/teknisi/pic?pic=${searchPic}`);
      const data = await res.json();

      setResultPic(data.data || []);
      setTotalPic(data.total || 0);
    } catch {
      setResultPic([]);
      setTotalPic(0);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchLaporan();
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
      if (!res.ok) throw new Error(data.message);

      alert("Berhasil update");
      await fetchLaporan();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-6">Memuat...</p>;

  // ================= FILTER STATUS =================
  const baru = laporan.filter((l) => l.status === "Baru");
  const proses = laporan.filter((l) => l.status === "Diproses");
  const selesai = laporan.filter((l) => l.status === "Selesai");

  // ================= LABEL GRAFIK =================
  const labels = chart.map((c) => {
    if (mode === "mingguan") {
      return `${c.start_date} - ${c.end_date}`;
    }
    if (mode === "bulanan") {
      return `${c.month}/${c.year}`;
    }
    return c.label;
  });

  const values = chart.map((c) => c.total);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Teknisi</h1>

      {/* ================= FILTER PIC ================= */}
      <div className="bg-white p-5 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-3">Filter PIC</h2>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Masukkan nama PIC..."
            value={searchPic}
            onChange={(e) => setSearchPic(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <button
            onClick={handleSearchPic}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Cari
          </button>
        </div>

        {searchPic && (
          <p className="font-bold mb-2">
            Total selesai: {totalPic}
          </p>
        )}

        <div className="space-y-2 max-h-60 overflow-auto">
          {resultPic.map((item) => (
            <div key={item.id} className="border p-2 rounded bg-gray-50">
              <p className="font-semibold">{item.judul}</p>
              <p className="text-sm text-gray-500">
                {new Date(item.created_at).toLocaleString("id-ID")}
              </p>
            </div>
          ))}

          {resultPic.length === 0 && searchPic && (
            <p className="text-gray-400 text-sm">Tidak ada data</p>
          )}
        </div>
      </div>

      {/* ================= GRAFIK ================= */}
      <div className="bg-white p-5 rounded-xl shadow mb-10">
        <h2 className="font-semibold mb-3">Grafik Laporan</h2>

        <Line
          data={{
            labels,
            datasets: [
              {
                data: values,
                borderColor: "#22c55e",
              },
            ],
          }}
        />
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

      {items.map((item) => (
        <LaporanCard key={item.id} item={item} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

// ================= CARD =================
function LaporanCard({ item, onUpdate }) {
  const [status, setStatus] = useState(item.status);
  const [pic, setPic] = useState(item.pic || "");
  const [estimasi, setEstimasi] = useState(item.estimasi || "");
  const [komentar, setKomentar] = useState(item.komentar || "");

  return (
    <div className="border p-4 mb-3 bg-yellow-50">
      <h3 className="font-bold">{item.judul}</h3>

      <div className="flex gap-2 mt-2">
        <input value={pic} onChange={(e) => setPic(e.target.value)} />
        <button
          onClick={() =>
            onUpdate(item.id, status, pic, estimasi, komentar)
          }
        >
          Update
        </button>
      </div>
    </div>
  );
}