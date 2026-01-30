"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok) {
        alert(data.message || "Login gagal");
        setLoading(false);
        return;
      }

      // role ada di dalam data.user.role
      const role = data.user?.role;

      if (role === "teknisi") {
        router.push("/teknisi");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full border rounded px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-4 space-y-2">
          <button
            onClick={() => router.push("/lupa-password")}
            className="text-green-600 text-sm hover:underline"
          >
            Lupa password?
          </button>

          <div className="text-sm">
            Belum punya akun?{" "}
            <a
              href="https://t.me/Helpdesk_IT_RS_Unand_bot"
              target="_blank"
              className="text-green-600 font-semibold hover:underline"
            >
              Daftar via Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
