import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@prisma/client";
import {
  ART_STYLES,
  SYSTEM_STYLE_SLUG,
  SYSTEM_UTILITY_SLUG,
  UTILITY_FUNCTIONS,
} from "../src/lib/catalog";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL in environment variables.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const item of UTILITY_FUNCTIONS) {
    await prisma.utilityFunction.upsert({
      where: { slug: item.slug },
      update: {
        nameZh: item.nameZh,
      },
      create: {
        slug: item.slug,
        nameZh: item.nameZh,
      },
    });
  }
  await prisma.utilityFunction.upsert({
    where: { slug: SYSTEM_UTILITY_SLUG },
    update: { nameZh: "__系统占位_风格模式" },
    create: { slug: SYSTEM_UTILITY_SLUG, nameZh: "__系统占位_风格模式" },
  });

  for (const [index, style] of ART_STYLES.entries()) {
    await prisma.artStyle.upsert({
      where: { slug: `style-${index + 1}` },
      update: {
        nameZh: style,
      },
      create: {
        slug: `style-${index + 1}`,
        nameZh: style,
      },
    });
  }
  await prisma.artStyle.upsert({
    where: { slug: SYSTEM_STYLE_SLUG },
    update: { nameZh: "__系统占位_实用模式" },
    create: { slug: SYSTEM_STYLE_SLUG, nameZh: "__系统占位_实用模式" },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash: await hash(adminPassword, 10),
      },
      create: {
        email: adminEmail,
        passwordHash: await hash(adminPassword, 10),
        displayName: "管理员",
      },
    });
  }

  const existingCount = await prisma.imageItem.count();
  if (existingCount === 0) {
    const firstUtility = await prisma.utilityFunction.findFirst({
      where: { slug: "ui-design" },
    });
    const firstStyle = await prisma.artStyle.findFirst({
      where: { nameZh: "3D 渲染" },
    });
    const secondStyle = await prisma.artStyle.findFirst({
      where: { nameZh: "技术剖面图" },
    });
    const systemUtility = await prisma.utilityFunction.findFirst({
      where: { slug: SYSTEM_UTILITY_SLUG },
    });
    const systemStyle = await prisma.artStyle.findFirst({
      where: { slug: SYSTEM_STYLE_SLUG },
    });

    if (
      firstUtility &&
      firstStyle &&
      secondStyle &&
      systemUtility &&
      systemStyle
    ) {
      await prisma.imageItem.createMany({
        data: [
          {
            title: "未来感 UI 界面",
            imageUrl: "https://picsum.photos/seed/gptimage2-1/900/1200",
            promptZh:
              "未来感智能家居 UI 设计，玻璃拟态，蓝白配色，移动端界面展示，高质量细节",
            promptEn:
              "Futuristic smart home UI design, glassmorphism, blue and white palette, mobile screen showcase, high detail",
            utilityFunctionId: firstUtility.id,
            artStyleId: systemStyle.id,
            width: 900,
            height: 1200,
          },
          {
            title: "科研风格示例",
            imageUrl: "https://picsum.photos/seed/gptimage2-2/900/1400",
            promptZh:
              "植物细胞技术剖面图，结构标注清晰，深色背景，高分辨率，教学用途",
            promptEn:
              "Technical plant cell cross-section with clear annotations, dark background, high resolution, educational use",
            utilityFunctionId: systemUtility.id,
            artStyleId: secondStyle.id,
            width: 900,
            height: 1400,
          },
        ],
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
