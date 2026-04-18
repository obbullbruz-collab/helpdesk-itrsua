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
  const [dataPic, setDataPic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("harian");
  const [searchPic, setSearchPic] = useState("");

  // ================= FETCH =================
  const fetchLaporan = async () => {
    const res = await fetch("/api/teknisi/laporan", { credentials: "include" });
    const data = await res.json();
    setLaporan(Array.isArray(data) ? data : []);
  };

  const fetchChart = async (m = mode) => {
    const res = await fetch(`/api/teknisi/statistik?mode=${m}`, {
      credentials: "include",
    });
    const data = await res.json();
    setChart(Array.isArray(data) ? data : []);
  };

  const fetchPic = async () => {
    const res = await fetch(`/api/teknisi/statistik?mode=pic`, {
      credentials: "include",
    });
    const data = await res.json();
    setDataPic(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchLaporan();
      await fetchChart();
      await fetchPic();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    fetchChart(mode);
  }, [mode]);

  // ================= UPDATE =================
  const handleUpdate = async (id, status, pic, estimasi, komentar) => {
    const res = await fetch("/api/laporan/update", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        laporan_id: id,
        status,
        pic,
        estimasi,
        komentar,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    await fetchLaporan();
    await fetchPic();
  };

  if (loading) return <p className="p-6">Memuat...</p>;

  // ================= FILTER =================
  const baru = laporan.filter((l) => l.status === "Baru");
  const proses = laporan.filter((l) => l.status === "Diproses");
  const selesai = laporan.filter((l) => l.status === "Selesai");

  const filteredPic = dataPic.filter((d) =>
    d.pic?.toLowerCase().includes(searchPic.toLowerCase())
  );

  const laporanByPic = laporan.filter(
    (l) =>
      l.status === "Selesai" &&
      l.pic?.toLowerCase().includes(searchPic.toLowerCase())
  );

  // ================= CHART =================
  const labels = chart.map((c) =>
    mode === "bulanan"
      ? new Date(c.year, c.month - 1).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        })
      : new Date(c.label || c.start_date).toLocaleDateString("id-ID")
  );

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
                  label: "Jumlah Laporan",
                  data: values,
                  borderColor: "#22c55e",
                  backgroundColor: "rgba(34,197,94,0.15)",
                  fill: true,
                },
              ],
            }}
          />
        </div>
      </div>

      {/* ================= FILTER PIC ================= */}
      <div className="bg-white p-5 rounded-xl shadow mb-10">
        <h2 className="font-semibold mb-3">Filter PIC</h2>

        <input
          type="text"
          placeholder="Ketik nama PIC..."
          className="border p-2 rounded w-full mb-3"
          value={searchPic}
          onChange={(e) => setSearchPic(e.target.value)}
        />

        {/* SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredPic.map((item, i) => (
            <div key={i} className="p-4 bg-green-50 rounded text-center">
              <p className="font-bold">{item.pic}</p>
              <p className="text-sm">{item.total} laporan selesai</p>
            </div>
          ))}
        </div>

        {/* HISTORI */}
        {searchPic && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">
              Histori PIC: {searchPic}
            </h3>

            {laporanByPic.length === 0 ? (
              <p className="text-gray-400">Tidak ada laporan</p>
            ) : (
              laporanByPic.map((item) => (
                <div
                  key={item.id}
                  className="border p-3 rounded mb-2 bg-gray-50"
                >
                  <p className="font-bold">{item.judul}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Section title="Laporan Baru" items={baru} onUpdate={handleUpdate} />
      <Section title="Diproses" items={proses} onUpdate={handleUpdate} />
      <Section title="Selesai" items={selesai} onUpdate={handleUpdate} />
    </div>
  );
}

// ================= SECTION =================
function Section({ title, items, onUpdate }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-3">{title}</h2>
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

  return (
    <div className="border rounded p-4 flex gap-4 bg-yellow-50">
      <div className="w-40 h-32 bg-white border overflow-hidden">
        {item.gambar ? (
          <img src={item.gambar} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">Tidak ada gambar</span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-bold">{item.judul}</h3>
        <p className="text-sm text-gray-600">{item.username}</p>

        <div className="flex gap-2 mt-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Baru</option>
            <option>Diproses</option>
            <option>Selesai</option>
          </select>

          <input
            value={pic}
            onChange={(e) => setPic(e.target.value)}
            placeholder="PIC"
          />

          <button
            onClick={() => onUpdate(item.id, status, pic)}
            className="bg-blue-600 text-white px-3 rounded"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}