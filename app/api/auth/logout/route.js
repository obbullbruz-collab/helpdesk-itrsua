import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "OK" });
  res.cookies.set("token", "", {
    path: "/",
    expires: new Date(0),
  });
  return res;
}
