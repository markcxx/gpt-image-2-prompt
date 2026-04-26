"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import {
  ART_STYLES,
  FILTER_MODES,
  type FilterMode,
  SYSTEM_UTILITY_SLUG,
  UTILITY_FUNCTIONS,
} from "@/lib/catalog";

const STYLE_OPTIONS = ART_STYLES.map((nameZh, index) => ({
  slug: `style-${index + 1}`,
  nameZh,
}));

const EDIT_DRAWER_TRANSITION_MS = 320;

type PromptCardProps = {
  id: string;
  title: string;
  imageUrl: string;
  promptZh: string;
  promptEn?: string | null;
  utilitySlug: string;
  artStyleSlug: string;
  isAdmin: boolean;
};

export function PromptCard({
  id,
  title,
  imageUrl,
  promptZh,
  promptEn,
  utilitySlug,
  artStyleSlug,
  isAdmin,
}: PromptCardProps) {
  const router = useRouter();
  const editPromptEnRef = useRef<HTMLTextAreaElement | null>(null);
  const editPromptZhRef = useRef<HTMLTextAreaElement | null>(null);
  const editDrawerCloseTimerRef = useRef<number | null>(null);
  const editDrawerOpenFrameRef = useRef<number | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [editDrawerMounted, setEditDrawerMounted] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPromptZh, setCurrentPromptZh] = useState(promptZh);
  const [currentPromptEn, setCurrentPromptEn] = useState(promptEn ?? "");
  const [currentUtilitySlug, setCurrentUtilitySlug] = useState(utilitySlug);
  const [currentArtStyleSlug, setCurrentArtStyleSlug] = useState(artStyleSlug);
  const [editPromptZh, setEditPromptZh] = useState(promptZh);
  const [editPromptEn, setEditPromptEn] = useState(promptEn ?? "");
  const initialFilterMode: FilterMode = utilitySlug === SYSTEM_UTILITY_SLUG ? "style" : "utility";
  const initialOptionSlug = initialFilterMode === "utility" ? utilitySlug : artStyleSlug;
  const [editFilterMode, setEditFilterMode] = useState<FilterMode>(initialFilterMode);
  const [editOptionSlug, setEditOptionSlug] = useState(initialOptionSlug);
  const [editStyleSearch, setEditStyleSearch] = useState("");
  const utilityNameMap = useMemo(() => new Map(UTILITY_FUNCTIONS.map((item) => [item.slug, item.nameZh])), []);
  const styleNameMap = useMemo(() => new Map(STYLE_OPTIONS.map((item) => [item.slug, item.nameZh])), []);
  const filteredEditStyles = useMemo(() => {
    const keyword = editStyleSearch.trim();
    if (!keyword) {
      return STYLE_OPTIONS;
    }
    return STYLE_OPTIONS.filter((item) => item.nameZh.includes(keyword));
  }, [editStyleSearch]);
  const currentFilterMode: FilterMode = currentUtilitySlug === SYSTEM_UTILITY_SLUG ? "style" : "utility";
  const currentOptionName =
    currentFilterMode === "utility"
      ? (utilityNameMap.get(currentUtilitySlug) ?? "未分类")
      : (styleNameMap.get(currentArtStyleSlug) ?? "未分类");
  const currentModeLabel = currentFilterMode === "utility" ? "实用功能" : "绘图风格";
  const mergedPrompt = `${currentPromptEn}\n\n${currentPromptZh}`.trim();
  const displayTitleZh = currentPromptZh || title;
  const displaySubtitleEn = currentPromptEn;
  const selectableOptions = editFilterMode === "utility" ? UTILITY_FUNCTIONS : filteredEditStyles;
  const menuPosition = contextMenu
    ? {
        left: `${Math.max(12, Math.min(contextMenu.x, window.innerWidth - 220))}px`,
        top: `${Math.max(12, Math.min(contextMenu.y, window.innerHeight - (isAdmin ? 228 : 140)))}px`,
      }
    : null;

  function closeContextMenu() {
    setContextMenu(null);
  }

  function resizeTextarea(element: HTMLTextAreaElement | null) {
    if (!element) {
      return;
    }

    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }

  const clearEditDrawerTimers = useCallback(() => {
    if (editDrawerCloseTimerRef.current !== null) {
      window.clearTimeout(editDrawerCloseTimerRef.current);
      editDrawerCloseTimerRef.current = null;
    }

    if (editDrawerOpenFrameRef.current !== null) {
      window.cancelAnimationFrame(editDrawerOpenFrameRef.current);
      editDrawerOpenFrameRef.current = null;
    }
  }, []);

  function resetEditForm() {
    const nextFilterMode: FilterMode = currentUtilitySlug === SYSTEM_UTILITY_SLUG ? "style" : "utility";
    setEditFilterMode(nextFilterMode);
    setEditOptionSlug(nextFilterMode === "utility" ? currentUtilitySlug : currentArtStyleSlug);
    setEditPromptZh(currentPromptZh);
    setEditPromptEn(currentPromptEn);
    setEditStyleSearch("");
  }

  function openEditDialog() {
    resetEditForm();
    closeContextMenu();
    clearEditDrawerTimers();
    setEditDrawerMounted(true);
    setEditDrawerOpen(false);
    editDrawerOpenFrameRef.current = window.requestAnimationFrame(() => {
      setEditDrawerOpen(true);
      editDrawerOpenFrameRef.current = null;
    });
  }

  const closeEditDialog = useCallback(() => {
    clearEditDrawerTimers();
    setEditDrawerOpen(false);
    editDrawerCloseTimerRef.current = window.setTimeout(() => {
      setEditDrawerMounted(false);
      editDrawerCloseTimerRef.current = null;
    }, EDIT_DRAWER_TRANSITION_MS);
  }, [clearEditDrawerTimers]);

  useEffect(() => {
    const hasModalOpen = promptDialogOpen || editDrawerMounted;
    if (!hasModalOpen) {
      document.body.style.overflow = "";
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeContextMenu();
        setIsZoomed(false);
        setPromptDialogOpen(false);
        closeEditDialog();
      }
    };

    if (hasModalOpen) {
      document.body.style.overflow = "hidden";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeEditDialog, editDrawerMounted, promptDialogOpen]);

  useEffect(() => {
    resizeTextarea(editPromptEnRef.current);
  }, [editPromptEn]);

  useEffect(() => {
    resizeTextarea(editPromptZhRef.current);
  }, [editPromptZh]);

  useEffect(() => {
    return () => {
      clearEditDrawerTimers();
    };
  }, [clearEditDrawerTimers]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const close = () => closeContextMenu();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  async function handleCopy(text: string, successText: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successText);
    } catch {
      toast.error("复制失败，请重试");
    }
  }

  async function handleUpdate() {
    const normalizedPromptZh = editPromptZh.trim();
    const normalizedPromptEn = editPromptEn.trim();

    if (!normalizedPromptZh || !normalizedPromptEn) {
      toast.error("中英文提示词都不能为空");
      return;
    }
    if (!editOptionSlug) {
      toast.error("请选择分类选项");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptZh: normalizedPromptZh,
          promptEn: normalizedPromptEn,
          filterMode: editFilterMode,
          optionSlug: editOptionSlug,
        }),
      });

      const json = (await response.json()) as {
        message?: string;
        image?: {
          promptZh: string;
          promptEn?: string | null;
          utilityFunction: { slug: string };
          artStyle: { slug: string };
        };
      };

      if (!response.ok || !json.image) {
        toast.error(json.message ?? "更新失败");
        return;
      }

      setCurrentPromptZh(json.image.promptZh);
      setCurrentPromptEn(json.image.promptEn ?? "");
      setCurrentUtilitySlug(json.image.utilityFunction.slug);
      setCurrentArtStyleSlug(json.image.artStyle.slug);
      closeEditDialog();
      toast.success("信息已更新");
      router.refresh();
    } catch {
      toast.error("更新失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    closeContextMenu();

    if (!window.confirm("确认删除这张卡片吗？删除后不可恢复。")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });
      const json = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        toast.error(json?.message ?? "删除失败");
        return;
      }

      setDeleted(true);
      toast.success("已删除");
      router.refresh();
    } catch {
      toast.error("删除失败，请稍后重试");
    } finally {
      setDeleting(false);
    }
  }

  if (deleted) {
    return null;
  }

  return (
    <>
      <article
        className="group relative mb-6 break-inside-avoid overflow-hidden rounded-xl border border-slate-300/40 bg-white shadow-sm transition-all duration-300 hover:border-sky-400/40 hover:shadow-md"
        onContextMenu={(event) => {
          event.preventDefault();
          setContextMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <div className="relative">
          <ControlledZoom
            a11yNameButtonZoom="预览图片"
            a11yNameButtonUnzoom="关闭图片预览"
            isZoomed={isZoomed}
            onZoomChange={(value) => setIsZoomed(value)}
            zoomMargin={24}
            wrapElement="div"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="block h-auto w-full cursor-zoom-in rounded-t-xl object-contain"
            />
          </ControlledZoom>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="rounded border border-white/70 bg-black/40 px-3 py-1 text-[12px] font-semibold tracking-[0.05em] text-white">
              预览图片
            </span>
          </div>
        </div>
        <div className="border-t border-slate-200/60 bg-white p-4 transition-colors group-hover:bg-slate-50/70">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <span className="rounded bg-slate-100 px-2 py-1 text-[12px] text-slate-600">
                {currentModeLabel} / {currentOptionName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(mergedPrompt, "完整提示词已复制")}
              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title="复制提示词"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="10" height="10" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
            </button>
          </div>
          <h2 className="line-clamp-2 text-[15px] font-semibold leading-6 text-slate-900">{displayTitleZh}</h2>
          <p className="mt-1 line-clamp-2 font-[var(--font-space-grotesk)] text-[14px] leading-6 text-slate-500">
            {displaySubtitleEn}
          </p>
          <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:mt-3 group-hover:max-h-20 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setPromptDialogOpen(true)}
              className="w-full rounded-[2px] bg-black px-4 py-2 text-[12px] font-semibold tracking-[0.08em] text-white transition-colors hover:bg-[#2d3133]"
            >
              查看完整提示词
            </button>
          </div>
        </div>
      </article>

      {contextMenu && menuPosition ? (
        <div className="fixed inset-0 z-[135]" onClick={closeContextMenu} onContextMenu={(event) => event.preventDefault()}>
          <div
            className="fixed w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-2xl"
            style={menuPosition}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                closeContextMenu();
                setIsZoomed(true);
              }}
              className="flex w-full items-center px-4 py-2 text-left text-[14px] text-slate-700 transition hover:bg-slate-100"
            >
              查看大图
            </button>
            <button
              type="button"
              onClick={() => {
                closeContextMenu();
                setPromptDialogOpen(true);
              }}
              className="flex w-full items-center px-4 py-2 text-left text-[14px] text-slate-700 transition hover:bg-slate-100"
            >
              查看完整提示词
            </button>
            {isAdmin ? (
              <>
                <div className="my-1 h-px bg-slate-200" />
                <button
                  type="button"
                  onClick={openEditDialog}
                  className="flex w-full items-center px-4 py-2 text-left text-[14px] text-slate-700 transition hover:bg-slate-100"
                >
                  更改信息
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex w-full items-center px-4 py-2 text-left text-[14px] text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  {deleting ? "删除中..." : "删除"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {promptDialogOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-[2px]"
          onClick={() => setPromptDialogOpen(false)}
        >
          <div
            className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-[#f7f9fb] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="hide-scrollbar max-h-[84vh] overflow-y-auto p-6 md:p-7">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#f2f4f6] lg:col-span-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={title} className="h-full w-full object-contain" />
                </div>
                <div className="space-y-5 lg:col-span-2">
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[12px] font-semibold tracking-[0.05em] text-slate-500">{currentModeLabel}</p>
                    <p className="mt-1 text-[15px] font-semibold text-slate-900">{currentOptionName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(mergedPrompt, "完整提示词已复制")}
                    className="w-full rounded-[2px] bg-black px-5 py-3 text-[12px] font-semibold tracking-[0.08em] text-white transition-colors hover:bg-[#2d3133]"
                  >
                    复制完整提示词
                  </button>
                  <section className="rounded-lg border border-slate-200 bg-[#f2f4f6] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[12px] font-semibold tracking-[0.05em] text-slate-500">英文提示词</h3>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentPromptEn, "英文提示词已复制")}
                        className="rounded p-1 text-slate-500 transition hover:bg-white hover:text-slate-900"
                        title="复制英文提示词"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="10" height="10" rx="2" />
                          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                        </svg>
                      </button>
                    </div>
                    <p className="font-[var(--font-space-grotesk)] text-[14px] leading-6 text-slate-800">{currentPromptEn}</p>
                  </section>
                  <section className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[12px] font-semibold tracking-[0.05em] text-slate-500">中文提示词</h3>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentPromptZh, "中文提示词已复制")}
                        className="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        title="复制中文提示词"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="10" height="10" rx="2" />
                          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[15px] leading-7 text-slate-900">{currentPromptZh}</p>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editDrawerMounted ? (
        <div
          className={`fixed inset-0 z-[140] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            editDrawerOpen ? "bg-slate-950/40 backdrop-blur-[2px] opacity-100" : "bg-slate-950/0 opacity-0"
          }`}
        >
          <div
            className={`absolute inset-0 bg-[#f7f9fb] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              editDrawerOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="flex h-full flex-col">
              <div className="sticky top-0 z-10 border-b border-[#e0e3e5] bg-[#f7f9fb]/95 backdrop-blur">
                <div className="flex items-start justify-between gap-4 px-6 py-5 md:px-8">
                  <div>
                    <h3 className="font-[var(--font-manrope)] text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-[#191c1e] md:text-[40px]">
                      更改作品信息
                    </h3>
                    <p className="mt-2 max-w-2xl text-[16px] leading-[1.6] text-[#45464d] md:text-[18px]">
                      调整提示词与筛选分类，修正上传时遗漏或误选的分类信息。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditDialog}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d7dbe0] bg-white text-[#191c1e] transition-colors hover:bg-[#eceef0]"
                    aria-label="关闭抽屉"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="hide-scrollbar flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
                <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
                  <div className="flex flex-col gap-4 md:col-span-5">
                    <div className="group relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#c6c6cd] bg-[#f2f4f6]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={title}
                        className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-40"
                      />
                      <div className="relative z-10 flex flex-col items-center gap-2 rounded-lg border border-[#e0e3e5] bg-white/80 p-4 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                        <span className="text-[13px] font-semibold tracking-[0.05em] text-[#191c1e]">当前图片预览</span>
                      </div>
                    </div>
                    <p className="text-center text-[12px] font-semibold tracking-[0.05em] text-[#45464d]">
                      图片本体保持不变，这里仅修改提示词与分类信息
                    </p>
                  </div>

                  <div className="flex flex-col gap-8 rounded-xl border border-[#e0e3e5] bg-white p-6 shadow-sm md:col-span-7">
                    <div className="flex flex-col gap-4">
                      <label
                        className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#191c1e]"
                        htmlFor={`prompt-en-${id}`}
                      >
                        英文提示词
                      </label>
                      <textarea
                        ref={editPromptEnRef}
                        id={`prompt-en-${id}`}
                        required
                        rows={4}
                        value={editPromptEn}
                        onChange={(event) => setEditPromptEn(event.target.value)}
                        onInput={(event) => resizeTextarea(event.currentTarget)}
                        className="w-full overflow-hidden resize-none border-0 border-b border-[#c6c6cd] bg-white p-2 font-[var(--font-space-grotesk)] text-[14px] leading-[1.5] text-[#191c1e] outline-none transition-colors placeholder:text-[#76777d] focus:border-[#0058be]"
                        placeholder="请输入英文提示词（必填）"
                      />
                      <label
                        className="mt-2 text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#191c1e]"
                        htmlFor={`prompt-zh-${id}`}
                      >
                        中文提示词
                      </label>
                      <textarea
                        ref={editPromptZhRef}
                        id={`prompt-zh-${id}`}
                        required
                        rows={3}
                        value={editPromptZh}
                        onChange={(event) => setEditPromptZh(event.target.value)}
                        onInput={(event) => resizeTextarea(event.currentTarget)}
                        className="w-full overflow-hidden resize-none border-0 border-b border-[#c6c6cd] bg-white p-2 text-[15px] leading-[1.6] text-[#191c1e] outline-none transition-colors placeholder:text-[#76777d] focus:border-[#0058be]"
                        placeholder="请输入中文提示词（必填）"
                      />
                    </div>

                    <div className="h-px w-full bg-[#e0e3e5]" />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#191c1e]">
                          筛选方式
                        </label>
                        <p className="text-sm text-[#45464d]">先选择这一张图的分类方式。</p>
                        <div className="flex flex-wrap gap-2">
                          {FILTER_MODES.map((mode) => {
                            const active = editFilterMode === mode.value;
                            return (
                              <button
                                key={mode.value}
                                type="button"
                                onClick={() => {
                                  setEditFilterMode(mode.value);
                                  setEditStyleSearch("");
                                  setEditOptionSlug(
                                    mode.value === "utility"
                                      ? UTILITY_FUNCTIONS[0]?.slug ?? ""
                                      : STYLE_OPTIONS[0]?.slug ?? "",
                                  );
                                }}
                                className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold tracking-[0.05em] transition-colors ${
                                  active
                                    ? "border-black bg-black text-white"
                                    : "border-[#c6c6cd] bg-white text-[#45464d] hover:bg-[#f2f4f6]"
                                }`}
                              >
                                {mode.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#191c1e]">
                          {editFilterMode === "utility" ? "实用功能选项" : "绘图风格选项"}
                        </label>
                        <p className="text-sm text-[#45464d]">
                          {editFilterMode === "utility"
                            ? "当前按实用功能分类，请选择具体选项。"
                            : "当前按绘图风格分类，请选择具体选项。"}
                        </p>
                        {editFilterMode === "style" ? (
                          <div className="rounded-t-[2px] border-b border-[#c6c6cd] bg-[#f2f4f6]">
                            <input
                              className="w-full border-0 bg-transparent px-4 py-3 text-[15px] leading-[1.6] text-[#191c1e] outline-none placeholder:text-[#76777d]"
                              placeholder="搜索风格..."
                              type="text"
                              value={editStyleSearch}
                              onChange={(event) => setEditStyleSearch(event.target.value)}
                            />
                          </div>
                        ) : null}
                        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-[2px] border border-[#e0e3e5] bg-white p-3">
                          {selectableOptions.map((item) => {
                            const active = item.slug === editOptionSlug;
                            return (
                              <button
                                key={item.slug}
                                type="button"
                                onClick={() => setEditOptionSlug(item.slug)}
                                className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold tracking-[0.05em] transition-colors ${
                                  active
                                    ? "border-black bg-black text-white"
                                    : "border-transparent bg-[#eceef0] text-[#45464d] hover:border-[#c6c6cd]"
                                }`}
                              >
                                {item.nameZh}
                              </button>
                            );
                          })}
                          {editFilterMode === "style" && selectableOptions.length === 0 ? (
                            <p className="text-sm text-[#76777d]">未找到匹配风格，请修改搜索词。</p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-4 border-t border-[#e0e3e5] pt-4">
                      <button
                        type="button"
                        onClick={closeEditDialog}
                        className="rounded-[2px] bg-transparent px-6 py-3 text-[12px] font-semibold tracking-[0.05em] text-[#191c1e] transition-colors hover:bg-[#eceef0]"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        disabled={saving || !editOptionSlug}
                        onClick={handleUpdate}
                        className="flex items-center gap-2 rounded-[2px] bg-black px-8 py-3 text-[12px] font-semibold tracking-[0.08em] text-white transition-colors hover:bg-[#2d3133] disabled:opacity-60"
                      >
                        {saving ? "保存中..." : "保存修改"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
