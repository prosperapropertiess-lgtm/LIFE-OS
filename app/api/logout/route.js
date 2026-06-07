import { NextResponse } from "next/server";

export async function POST(request) {
  const res = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  res.cookies.set("lifeos_auth", "", { path: "/", maxAge: 0 });
  return res;
}
