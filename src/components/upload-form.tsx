"use client";

import {
  type ChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { FILTER_MODES, FilterMode } from "@/lib/catalog";

type Option = {
  id: string;
  slug: string;
  nameZh: string;
};

export function UploadForm(props: {
  utilityFunctions: Option[];
  artStyles: Option[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const promptEnRef = useRef<HTMLTextAreaElement | null>(null);
  const promptZhRef = useRef<HTMLTextAreaElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("utility");
  const [styleSearch, setStyleSearch] = useState("");
  const [utilitySlug, setUtilitySlug] = useState(props.utilityFunctions[0]?.slug ?? "");
  const [styleSlug, setStyleSlug] = useState(props.artStyles[0]?.slug ?? "");
  const [promptEn, setPromptEn] = useState("");
  const [promptZh, setPromptZh] = useState("");

  const filteredStyles = useMemo(() => {
    const keyword = styleSearch.trim();
    if (!keyword) {
      return props.artStyles;
    }
    return props.artStyles.filter((item) => item.nameZh.includes(keyword));
  }, [props.artStyles, styleSearch]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function resizeTextarea(element: HTMLTextAreaElement | null) {
    if (!element) {
      return;
    }

    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }

  useEffect(() => {
    resizeTextarea(promptEnRef.current);
  }, [promptEn]);

  useEffect(() => {
    resizeTextarea(promptZhRef.current);
  }, [promptZh]);

  function updateSelectedFile(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedFile(file);

    if (!file) {
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
  }

  function getImageFileFromClipboard(items: DataTransferItemList | null) {
    if (!items) {
      return null;
    }

    for (const item of Array.from(items)) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        return item.getAsFile();
      }
    }

    return null;
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    updateSelectedFile(file ?? null);
  }

  function onPasteImage(event: ReactClipboardEvent<HTMLElement>) {
    const file = getImageFileFromClipboard(event.clipboardData?.items ?? null);
    if (!file) {
      return;
    }

    event.preventDefault();
    updateSelectedFile(file);
    toast.success("已识别剪贴板图片");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setPending(true);

    const optionSlug = filterMode === "utility" ? utilitySlug : styleSlug;
    const normalizedPromptEn = promptEn.trim();
    const normalizedPromptZh = promptZh.trim();
    if (!selectedFile) {
      toast.error("请先上传图片或直接粘贴剪贴板图片");
      setPending(false);
      return;
    }
    if (!normalizedPromptEn || !normalizedPromptZh) {
      toast.error("中英文提示词都必须填写");
      setPending(false);
      return;
    }

    formData.set("filterMode", filterMode);
    formData.set("optionSlug", optionSlug);
    formData.set("promptEn", normalizedPromptEn);
    formData.set("promptZh", normalizedPromptZh);
    formData.set("title", "");
    formData.set("image", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(json.message ?? "上传失败");
        return;
      }

      toast.success("上传成功");
      form.reset();
      updateSelectedFile(null);
      setStyleSearch("");
      setFilterMode("utility");
      setUtilitySlug(props.utilityFunctions[0]?.slug ?? "");
      setStyleSlug(props.artStyles[0]?.slug ?? "");
      setPromptEn("");
      setPromptZh("");
      router.refresh();
    } catch {
      toast.error("上传请求失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    const onWindowPaste = (event: globalThis.ClipboardEvent) => {
      const file = getImageFileFromClipboard(event.clipboardData?.items ?? null);
      if (!file) {
        return;
      }

      event.preventDefault();
      updateSelectedFile(file);
      toast.success("已识别剪贴板图片");
    };

    window.addEventListener("paste", onWindowPaste);
    return () => {
      window.removeEventListener("paste", onWindowPaste);
    };
  }, []);

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
      <input type="hidden" name="title" value="" readOnly />

      <div className="flex flex-col gap-4 md:col-span-5">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onPaste={onPasteImage}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className="group relative flex aspect-[3/4] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#c6c6cd] bg-[#f2f4f6] transition-colors hover:bg-[#eceef0]"
        >
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-40"
              />
              <div className="relative z-10 flex flex-col items-center gap-2 rounded-lg border border-[#e0e3e5] bg-white/80 p-4 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <span className="text-[13px] font-semibold tracking-[0.05em] text-[#191c1e]">
                  点击或拖拽更换图片
                </span>
              </div>
            </>
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-2 rounded-lg border border-[#e0e3e5] bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <span className="text-[13px] font-semibold tracking-[0.05em] text-[#191c1e]">
                点击或拖拽上传图片
              </span>
            </div>
          )}
        </div>
        <p className="text-center text-[12px] font-semibold tracking-[0.05em] text-[#45464d]">
          支持常见图片格式，最大 10MB，也支持直接按 Ctrl+V 粘贴剪贴板图片
        </p>
        <input
          ref={fileInputRef}
          name="image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          type="file"
          onChange={onFileChange}
          className="sr-only"
        />
      </div>

      <div className="flex flex-col gap-8 rounded-xl border border-[#e0e3e5] bg-white p-6 shadow-sm md:col-span-7">
        <div className="flex flex-col gap-4">
          <label
            className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#191c1e]"
            htmlFor="prompt_en"
          >
            英文提示词
          </label>
          <textarea
            ref={promptEnRef}
            id="prompt_en"
            name="promptEn"
            required
            rows={4}
            value={promptEn}
            onChange={(event) => setPromptEn(event.target.value)}
            onInput={(event) => resizeTextarea(event.currentTarget)}
            className="w-full overflow-hidden resize-none border-0 border-b border-[#c6c6cd] bg-white p-2 font-[var(--font-space-grotesk)] text-[14px] leading-[1.5] text-[#191c1e] outline-none transition-colors placeholder:text-[#76777d] focus:border-[#0058be]"
            placeholder="请输入英文提示词（必填）"
          />
          <label
            className="mt-2 text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#191c1e]"
            htmlFor="prompt_zh"
          >
            中文提示词
          </label>
          <textarea
            ref={promptZhRef}
            id="prompt_zh"
            name="promptZh"
            required
            rows={3}
            value={promptZh}
            onChange={(event) => setPromptZh(event.target.value)}
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
                const active = filterMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setFilterMode(mode.value)}
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
              {filterMode === "utility" ? "实用功能选项" : "绘图风格选项"}
            </label>
            <p className="text-sm text-[#45464d]">
              {filterMode === "utility" ? "当前按实用功能分类，请选择具体选项。" : "当前按绘图风格分类，请选择具体选项。"}
            </p>
            {filterMode === "style" ? (
              <div className="rounded-t-[2px] border-b border-[#c6c6cd] bg-[#f2f4f6]">
                <input
                  className="w-full border-0 bg-transparent px-4 py-3 text-[15px] leading-[1.6] text-[#191c1e] outline-none placeholder:text-[#76777d]"
                  placeholder="搜索风格..."
                  type="text"
                  value={styleSearch}
                  onChange={(event) => setStyleSearch(event.target.value)}
                />
              </div>
            ) : null}
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-[2px] border border-[#e0e3e5] bg-white p-3">
              {(filterMode === "utility" ? props.utilityFunctions : filteredStyles).map((item) => {
                const active = filterMode === "utility" ? item.slug === utilitySlug : item.slug === styleSlug;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (filterMode === "utility") {
                        setUtilitySlug(item.slug);
                      } else {
                        setStyleSlug(item.slug);
                      }
                    }}
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
              {filterMode === "style" && filteredStyles.length === 0 ? (
                <p className="text-sm text-[#76777d]">未找到匹配风格，请修改搜索词。</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end gap-4 border-t border-[#e0e3e5] pt-4">
          <button
            type="button"
            className="rounded-[2px] bg-transparent px-6 py-3 text-[12px] font-semibold tracking-[0.05em] text-[#191c1e] transition-colors hover:bg-[#eceef0]"
          >
            存为草稿
          </button>
          <button
            type="submit"
            disabled={pending || !utilitySlug || !styleSlug}
            className="flex items-center gap-2 rounded-[2px] bg-black px-8 py-3 text-[12px] font-semibold tracking-[0.08em] text-white transition-colors hover:bg-[#2d3133] disabled:opacity-60"
          >
            {pending ? "上传中..." : "发布作品"}
          </button>
        </div>
      </div>
    </form>
  );
}
