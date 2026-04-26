import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/components/admin-logout-button";
import { UploadForm } from "@/components/upload-form";
import { isAdminAuthed } from "@/lib/admin";
import { ART_STYLES, UTILITY_FUNCTIONS } from "@/lib/catalog";

export default async function AdminUploadPage() {
  const authed = await isAdminAuthed();
  if (!authed) {
    redirect("/login");
  }

  const utilityFunctions = UTILITY_FUNCTIONS.map((item) => ({
    id: item.slug,
    slug: item.slug,
    nameZh: item.nameZh,
  }));
  const artStyles = ART_STYLES.map((nameZh, index) => ({
    id: `style-${index + 1}`,
    slug: `style-${index + 1}`,
    nameZh,
  }));

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-12">
          <div className="flex items-center gap-4">
            <span className="font-[var(--font-manrope)] text-lg font-bold tracking-tight text-slate-900">
              GPT-Image-2 Prompt库
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-[2px] border border-slate-300 px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-slate-700 transition hover:bg-slate-100"
              title="返回首页"
            >
              返回首页
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-grow px-12 pb-12 pt-[104px]">
        <div className="mb-12">
          <h1 className="font-[var(--font-manrope)] text-[40px] font-bold leading-[1.2] tracking-[-0.02em] text-[#191c1e]">
            上传新灵感
          </h1>
          <p className="mt-2 max-w-2xl text-[18px] leading-[1.6] text-[#45464d]">
            为画廊添加新的提示词资产。请保持图像质量与元数据的精确性。
          </p>
        </div>

        <UploadForm utilityFunctions={utilityFunctions} artStyles={artStyles} />
      </main>

      <footer className="mt-24 w-full border-t border-slate-100 bg-white py-12 text-sm tracking-wide text-slate-500">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-12 md:flex-row">
          <div>© 2026 GPT-Image-2 Prompt库</div>
          <div className="flex gap-4">
            <a className="underline underline-offset-4 transition hover:opacity-80" href="#">
              文档
            </a>
            <a className="underline underline-offset-4 transition hover:opacity-80" href="#">
              隐私政策
            </a>
            <a className="underline underline-offset-4 transition hover:opacity-80" href="#">
              服务条款
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
