import { NextResponse } from "next/server";

export async function POST(request) {
  const form = await request.formData();
  const password = form.get("password");

  if (password && password === process.env.APP_PASSWORD) {
    const res = NextResponse.redirect(new URL("/", request.url), { status: 303 });
    res.cookies.set("lifeos_auth", process.env.APP_SESSION_TOKEN || "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 60, // 60 days
    });
    return res;
  }

  return NextResponse.redirect(new URL("/login?error=1", request.url), { status: 303 });
}
