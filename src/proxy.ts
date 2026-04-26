import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAdminCookieName, verifyAdminSession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  const session = await verifyAdminSession(token);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
