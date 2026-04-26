import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminCookieName, verifyAdminSession } from "@/lib/auth";
import { SYSTEM_STYLE_SLUG, SYSTEM_UTILITY_SLUG } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function requireAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getAdminCookieName())?.value;
  return await verifyAdminSession(sessionToken);
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "缺少图片 ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        promptZh?: unknown;
        promptEn?: unknown;
        filterMode?: unknown;
        optionSlug?: unknown;
      }
    | null;

  const promptZh = typeof body?.promptZh === "string" ? body.promptZh.trim() : "";
  const promptEn = typeof body?.promptEn === "string" ? body.promptEn.trim() : "";
  const filterMode = body?.filterMode;
  const optionSlug = typeof body?.optionSlug === "string" ? body.optionSlug : "";

  if (!promptZh || !promptEn) {
    return NextResponse.json({ message: "中英文提示词都不能为空" }, { status: 400 });
  }
  if (filterMode !== "utility" && filterMode !== "style") {
    return NextResponse.json({ message: "筛选方式不合法" }, { status: 400 });
  }
  if (!optionSlug) {
    return NextResponse.json({ message: "缺少分类选项" }, { status: 400 });
  }

  const [image, systemUtility, systemStyle] = await Promise.all([
    prisma.imageItem.findUnique({ where: { id } }),
    prisma.utilityFunction.findUnique({ where: { slug: SYSTEM_UTILITY_SLUG } }),
    prisma.artStyle.findUnique({ where: { slug: SYSTEM_STYLE_SLUG } }),
  ]);

  if (!image) {
    return NextResponse.json({ message: "图片不存在" }, { status: 404 });
  }
  if (!systemUtility || !systemStyle) {
    return NextResponse.json({ message: "系统分类未初始化，请先执行 db:seed" }, { status: 500 });
  }

  let utilityFunctionId = systemUtility.id;
  let artStyleId = systemStyle.id;

  if (filterMode === "utility") {
    const utility = await prisma.utilityFunction.findUnique({ where: { slug: optionSlug } });
    if (!utility) {
      return NextResponse.json({ message: "实用功能选项不存在" }, { status: 400 });
    }
    utilityFunctionId = utility.id;
  } else {
    const artStyle = await prisma.artStyle.findUnique({ where: { slug: optionSlug } });
    if (!artStyle) {
      return NextResponse.json({ message: "绘图风格选项不存在" }, { status: 400 });
    }
    artStyleId = artStyle.id;
  }

  const updated = await prisma.imageItem.update({
    where: { id },
    data: {
      promptZh,
      promptEn,
      title: promptZh.slice(0, 24) || image.title,
      utilityFunctionId,
      artStyleId,
    },
    include: {
      utilityFunction: true,
      artStyle: true,
    },
  });

  return NextResponse.json({ ok: true, image: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "缺少图片 ID" }, { status: 400 });
  }

  const image = await prisma.imageItem.findUnique({ where: { id } });
  if (!image) {
    return NextResponse.json({ message: "图片不存在" }, { status: 404 });
  }

  await prisma.imageItem.delete({ where: { id } });

  if (image.r2Key) {
    await deleteFromR2(image.r2Key).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
