"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    nama: "",
    bagian: "",
    telegram_id: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.message || "Gagal register");
      return;
    }

    alert("Berhasil daftar, silakan login");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={submit}
        className="bg-white p-6 rounded-xl shadow w-full max-w-md space-y-3"
      >
        <h1 className="text-xl font-bold text-center">Register</h1>

        <input name="username" placeholder="Username" onChange={handleChange}
          className="w-full border p-2 rounded" required />

        <input name="password" type="password" placeholder="Password"
          onChange={handleChange}
          className="w-full border p-2 rounded" required />

        <input name="nama" placeholder="Nama"
          onChange={handleChange}
          className="w-full border p-2 rounded" />

        <input name="bagian" placeholder="Bagian"
          onChange={handleChange}
          className="w-full border p-2 rounded" />

        <input name="telegram_id" placeholder="Telegram ID"
          onChange={handleChange}
          className="w-full border p-2 rounded" required />

        <button className="w-full bg-green-600 text-white py-2 rounded">
          Daftar
        </button>
      </form>
    </div>
  );
}
