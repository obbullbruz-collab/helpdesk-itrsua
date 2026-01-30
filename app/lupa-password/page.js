"use client";

import { useState } from "react";
import Link from "next/link";

export default function LupaPasswordPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/auth/lupa-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        setMsg("Server tidak mengirim data yang valid.");
        setLoading(false);
        return;
      }

      if (data.success) {
        setMsg("Berhasil! Silakan cek Telegram kamu.");
      } else {
        setMsg(data.message || "Gagal mengirim ke Telegram.");
      }
    } catch (err) {
      setMsg("Terjadi kesalahan koneksi.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Lupa Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full border rounded px-4 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim"}
          </button>
        </form>

        {msg && (
          <p className="mt-4 text-center text-sm text-red-600">{msg}</p>
        )}

        <div className="mt-4 text-center">
          <Link href="/login" className="text-green-600 hover:underline">
            Kembali ke login
          </Link>
        </div>
      </div>
    </div>
  );
}
