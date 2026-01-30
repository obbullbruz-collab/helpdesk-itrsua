"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.id) setIsLogin(true);
        else setIsLogin(false);
      })
      .catch(() => setIsLogin(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLogin(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="bg-green-800 text-white px-6 py-3 flex justify-between items-center">
      <Link href="/" className="font-bold text-lg">
        Helpdesk IT
      </Link>

      <div className="flex gap-3 items-center">
        {/* ================= HOME PAGE ================= */}
        {pathname === "/" && !isLogin && (
          <Link
            href="/login"
            className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold"
          >
            Login
          </Link>
        )}

        {/* ================= LOGIN PAGE ================= */}
        {pathname === "/login" && (
          <Link
            href="/"
            className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold"
          >
            Home
          </Link>
        )}

        {/* ================= DASHBOARD USER ================= */}
        {pathname.startsWith("/dashboard") && (
          <>
            <Link
              href="/laporan"
              className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold"
            >
              + Buat Laporan
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-2 rounded-lg text-white"
            >
              Logout
            </button>
          </>
        )}

        {/* ================= DASHBOARD TEKNISI ================= */}
        {pathname.startsWith("/teknisi") && (
          <>
            {/* Jika di halaman kelola-user, tampilkan tombol Dashboard */}
            {pathname !== "/teknisi" && (
              <Link
                href="/teknisi"
                className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold"
              >
                Dashboard
              </Link>
            )}

            {/* Jika di dashboard teknisi, tampilkan tombol Kelola User */}
            {pathname === "/teknisi" && (
              <Link
                href="/teknisi/kelola-user"
                className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold"
              >
                Kelola User
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-2 rounded-lg text-white"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
