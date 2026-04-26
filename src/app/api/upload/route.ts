import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminCookieName, verifyAdminSession } from "@/lib/auth";
import { SYSTEM_STYLE_SLUG, SYSTEM_UTILITY_SLUG } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getAdminCookieName())?.value;
  if (!(await verifyAdminSession(sessionToken))) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get("title");
  const promptZh = formData.get("promptZh");
  const promptEn = formData.get("promptEn");
  const filterMode = formData.get("filterMode");
  const optionSlug = formData.get("optionSlug");
  const utilitySlug = formData.get("utilitySlug");
  const styleSlug = formData.get("styleSlug");
  const image = formData.get("image");

  if (
    typeof promptZh !== "string" ||
    typeof promptEn !== "string" ||
    typeof filterMode !== "string" ||
    typeof optionSlug !== "string" ||
    !(image instanceof File)
  ) {
    return NextResponse.json({ message: "提交字段不完整" }, { status: 400 });
  }
  if (filterMode !== "utility" && filterMode !== "style") {
    return NextResponse.json({ message: "筛选方式不合法" }, { status: 400 });
  }

  if (!ACCEPTED_IMAGE_TYPES.has(image.type)) {
    return NextResponse.json({ message: "仅支持 png/jpg/webp/gif" }, { status: 400 });
  }
  if (image.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "图片大小不能超过 10MB" }, { status: 400 });
  }

  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const normalizedPromptZh = promptZh.trim();
  const normalizedPromptEn = promptEn.trim();
  if (!normalizedPromptEn || !normalizedPromptZh) {
    return NextResponse.json({ message: "中英文提示词都不能为空" }, { status: 400 });
  }

  const [systemUtility, systemStyle] = await Promise.all([
    prisma.utilityFunction.findUnique({ where: { slug: SYSTEM_UTILITY_SLUG } }),
    prisma.artStyle.findUnique({ where: { slug: SYSTEM_STYLE_SLUG } }),
  ]);
  if (!systemUtility || !systemStyle) {
    return NextResponse.json({ message: "系统分类未初始化，请先执行 db:seed" }, { status: 500 });
  }

  let utility =
    typeof utilitySlug === "string"
      ? await prisma.utilityFunction.findUnique({ where: { slug: utilitySlug } })
      : null;
  let style =
    typeof styleSlug === "string"
      ? await prisma.artStyle.findUnique({ where: { slug: styleSlug } })
      : null;
  if (!utility || !style) {
    if (filterMode === "utility") {
      utility = await prisma.utilityFunction.findUnique({ where: { slug: optionSlug } });
      style = systemStyle;
    } else {
      utility = systemUtility;
      style = await prisma.artStyle.findUnique({ where: { slug: optionSlug } });
    }
  }

  if (!utility || !style) {
    return NextResponse.json({ message: "筛选分类不存在" }, { status: 400 });
  }

  const fileExt = image.name.split(".").pop() ?? "png";
  const r2Key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${fileExt}`;
  const buffer = Buffer.from(await image.arrayBuffer());
  const imageUrl = await uploadToR2({
    key: r2Key,
    body: buffer,
    contentType: image.type,
  });

  await prisma.imageItem.create({
    data: {
      imageUrl,
      r2Key,
      promptZh: normalizedPromptZh,
      promptEn: normalizedPromptEn,
      title: normalizedTitle || normalizedPromptZh.slice(0, 24) || "未命名作品",
      utilityFunctionId: utility.id,
      artStyleId: style.id,
    },
  });

  return NextResponse.json({ ok: true });
}
