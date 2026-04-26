import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminSession, getAdminCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数不正确" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });

  if (!admin) {
    return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
  }

  const pass = await compare(parsed.data.password, admin.passwordHash);
  if (!pass) {
    return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
  }

  const session = await createAdminSession(admin.email);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminCookieName(), session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
