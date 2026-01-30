"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LaporanPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [priority, setPriority] = useState("sedang");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("judul", title);
      formData.append("deskripsi", description);
      formData.append("kategori", category);
      formData.append("lokasi", lokasi);
      formData.append("prioritas", priority);
      if (image) formData.append("image", image);

      const res = await fetch("/api/laporan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal mengirim laporan");
        return;
      }

      alert("Laporan berhasil dikirim!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengirim laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-800 p-6 text-white">
      <div className="max-w-xl mx-auto bg-green-900 p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Buat Laporan</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-2 rounded text-black"
            placeholder="Judul"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="w-full p-2 rounded text-black"
            placeholder="Deskripsi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />

          <input
            className="w-full p-2 rounded text-black"
            placeholder="Kategori"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <input
            className="w-full p-2 rounded text-black"
            placeholder="Lokasi"
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            required
          />

          <select
            className="w-full p-2 rounded text-black"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="rendah">Rendah</option>
            <option value="sedang">Sedang</option>
            <option value="tinggi">Tinggi</option>
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />

          <button
            disabled={loading}
            className="w-full bg-white text-green-700 py-2 rounded font-semibold"
          >
            {loading ? "Mengirim..." : "Kirim Laporan"}
          </button>
        </form>
      </div>
    </div>
  );
}
