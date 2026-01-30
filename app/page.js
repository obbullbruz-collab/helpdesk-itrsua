"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  function handleBuatLaporan() {
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="bg-unand py-20 text-center px-6">
        <h1 className="text-4xl font-extrabold mb-6 text-white">
          Sistem Helpdesk IT Rumah Sakit Universitas Andalas
        </h1>

        <p className="max-w-2xl mx-auto text-lg mb-10 text-white/90 font-medium leading-relaxed">
          Layanan pelaporan kendala teknologi informasi untuk mendukung
          kegiatan akademik dan administrasi secara cepat, terstruktur,
          dan terintegrasi.
        </p>

        <button
          onClick={handleBuatLaporan}
          className="bg-white text-unand px-8 py-3 rounded font-semibold hover:bg-gray-100 shadow"
        >
          Buat Laporan Sekarang
        </button>
      </section>

      {/* PANDUAN */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-bold text-center text-unand mb-12">
          Panduan Penggunaan Sistem
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            ["1", "Login / Register", "Masuk atau daftar akun terlebih dahulu."],
            ["2", "Isi Laporan", "Lengkapi form sesuai kendala IT."],
            ["3", "Diproses IT", "Tim IT menerima dan memproses laporan."],
            ["4", "Selesai", "Pantau status hingga laporan ditangani."],
          ].map(([step, title, desc]) => (
            <div
              key={step}
              className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-unand text-white flex items-center justify-center font-bold text-lg">
                {step}
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                {title}
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* JENIS LAPORAN */}
      <section className="bg-white py-16 px-6">
        <h2 className="text-3xl font-bold text-center text-unand mb-10">
          Jenis Kendala yang Dapat Dilaporkan
        </h2>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <ul className="list-disc ml-6 space-y-2">
            <li>Komputer / Laptop bermasalah</li>
            <li>Printer dan perangkat pendukung</li>
            <li>Jaringan dan internet</li>
            <li>Masalah login sistem</li>
          </ul>
          <ul className="list-disc ml-6 space-y-2">
            <li>Aplikasi Transmedic eror</li>
            <li>Perangkat laboratorium</li>
            <li>Sistem administrasi</li>
            <li>Kendala IT lainnya</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-unand py-16 text-center px-6">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Siap Melaporkan Kendala?
        </h2>
        <p className="mb-6 text-unand-soft font-medium">
          Klik tombol di bawah untuk membuat laporan sekarang.
        </p>
        <button
          onClick={handleBuatLaporan}
          className="bg-white text-unand px-8 py-3 rounded hover:bg-gray-100 font-semibold"
        >
          Buat Laporan
        </button>
      </section>
    </div>
  );
}
