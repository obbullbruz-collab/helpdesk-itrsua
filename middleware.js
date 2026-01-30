import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // BIARKAN SEMUA API LEWAT TANPA REDIRECT
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const protectedRoutes = ["/dashboard", "/laporan", "/teknisi"];

  if (protectedRoutes.some((p) => pathname.startsWith(p))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}
