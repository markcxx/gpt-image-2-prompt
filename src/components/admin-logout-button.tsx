"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      title="退出登录"
      className="rounded-[2px] border border-slate-300 px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-slate-700 transition hover:bg-slate-100"
    >
      退出登录
    </button>
  );
}
