import Link from "next/link";

import { FilterOptionsStrip } from "@/components/filter-options-strip";
import { PromptCard } from "@/components/prompt-card";
import {
  ART_STYLES,
  FILTER_MODES,
  FilterMode,
  SYSTEM_STYLE_SLUG,
  SYSTEM_UTILITY_SLUG,
  UTILITY_FUNCTIONS,
} from "@/lib/catalog";
import { isAdminAuthed } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { buildImageProxyUrl } from "@/lib/r2";

type PageProps = {
  searchParams: Promise<{
    mode?: string;
    option?: string;
  }>;
};

function buildHref(params: { mode?: FilterMode; option?: string }) {
  const query = new URLSearchParams();
  if (params.mode) {
    query.set("mode", params.mode);
  }
  if (params.option) {
    query.set("option", params.option);
  }
  const queryString = query.toString();
  return queryString ? `/?${queryString}` : "/";
}

function orderByUtilityCatalog<T extends { slug: string }>(items: T[]) {
  const orderMap = new Map(UTILITY_FUNCTIONS.map((item, index) => [item.slug, index]));
  return items.sort((a, b) => (orderMap.get(a.slug) ?? 999) - (orderMap.get(b.slug) ?? 999));
}

const STYLE_OPTIONS = ART_STYLES.map((nameZh, index) => ({
  slug: `style-${index + 1}`,
  nameZh,
}));

export default async function Home({ searchParams }: PageProps) {
  const { mode, option } = await searchParams;
  const currentMode: FilterMode = mode === "style" ? "style" : "utility";
  const selectedOption = option ?? "all";

  const [images, authed] = await Promise.all([
    prisma.imageItem.findMany({
      where:
        currentMode === "utility"
          ? {
              artStyle: { slug: SYSTEM_STYLE_SLUG },
              utilityFunction:
                selectedOption === "all" ? { slug: { not: SYSTEM_UTILITY_SLUG } } : { slug: selectedOption },
            }
          : {
              utilityFunction: { slug: SYSTEM_UTILITY_SLUG },
              artStyle:
                selectedOption === "all" ? { slug: { not: SYSTEM_STYLE_SLUG } } : { slug: selectedOption },
            },
      include: {
        utilityFunction: true,
        artStyle: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    isAdminAuthed(),
  ]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-6 md:px-12">
          <p className="text-lg font-bold tracking-tight">GPT-Image-2 Prompt库</p>
          <Link
            href={authed ? "/admin/upload" : "/login"}
            className="rounded-[2px] bg-black px-6 py-2 text-[12px] font-semibold tracking-[0.08em] text-white transition-colors hover:bg-[#2d3133]"
          >
            {authed ? "上传作品" : "登录"}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-6 pb-16 pt-[104px] md:px-12">
        <section className="mb-12">
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTER_MODES.map((item) => (
              <Link
                key={item.value}
                href={buildHref({ mode: item.value })}
                className={`rounded-full px-5 py-2 text-[15px] transition ${
                  currentMode === item.value
                    ? "bg-black text-white hover:opacity-90"
                    : "bg-slate-200/70 text-slate-800 hover:bg-slate-300/70"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <FilterOptionsStrip
            label={currentMode === "utility" ? "实用功能选项:" : "绘图风格选项:"}
            allHref={buildHref({ mode: currentMode })}
            allActive={selectedOption === "all"}
            options={
              currentMode === "utility"
                ? orderByUtilityCatalog(UTILITY_FUNCTIONS).map((item) => ({
                    key: item.slug,
                    label: item.nameZh,
                    href: buildHref({ mode: currentMode, option: item.slug }),
                    active: selectedOption === item.slug,
                  }))
                : STYLE_OPTIONS.map((item) => ({
                    key: item.slug,
                    label: item.nameZh,
                    href: buildHref({ mode: currentMode, option: item.slug }),
                    active: selectedOption === item.slug,
                  }))
            }
          />
        </section>

        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            当前筛选条件下暂无图片，请先登录管理员后台上传内容。
          </div>
        ) : (
          <section className="mb-12 columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
            {images.map((item) => (
              <PromptCard
                key={item.id}
                id={item.id}
                title={item.title}
                imageUrl={item.r2Key ? buildImageProxyUrl(item.r2Key) : item.imageUrl}
                promptZh={item.promptZh}
                promptEn={item.promptEn}
                utilitySlug={item.utilityFunction.slug}
                artStyleSlug={item.artStyle.slug}
                isAdmin={authed}
              />
            ))}
          </section>
        )}

        <div className="mt-12 flex items-center justify-center gap-2">
          <button className="h-10 w-10 rounded-lg border border-slate-300/60 text-slate-500 transition hover:bg-slate-200/60">
            {"<"}
          </button>
          <button className="h-10 w-10 rounded-lg bg-black text-sm text-white">1</button>
          <button className="h-10 w-10 rounded-lg border border-slate-300/60 text-sm text-slate-700 transition hover:bg-slate-200/60">
            2
          </button>
          <button className="h-10 w-10 rounded-lg border border-slate-300/60 text-sm text-slate-700 transition hover:bg-slate-200/60">
            3
          </button>
          <span className="px-2 text-slate-500">...</span>
          <button className="h-10 w-10 rounded-lg border border-slate-300/60 text-sm text-slate-700 transition hover:bg-slate-200/60">
            12
          </button>
          <button className="h-10 w-10 rounded-lg border border-slate-300/60 text-slate-500 transition hover:bg-slate-200/60">
            {">"}
          </button>
        </div>
      </main>

      <footer className="mt-20 w-full border-t border-slate-100 bg-white py-12">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 md:flex-row md:px-12">
          <p className="text-sm tracking-wide text-slate-500">
            © 2026 GPT-Image-2 Prompt库
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a className="underline underline-offset-4 hover:text-slate-900" href="#">
              文档
            </a>
            <a className="underline underline-offset-4 hover:text-slate-900" href="#">
              隐私政策
            </a>
            <a className="underline underline-offset-4 hover:text-slate-900" href="#">
              服务条款
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
