import { NextResponse } from "next/server";

// Password removed at the user's request — the dashboard is open at its URL.
// (Re-enable later by restoring the cookie check if desired.)
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
