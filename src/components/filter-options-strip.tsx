"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";

type OptionItem = {
  key: string;
  label: string;
  href: string;
  active: boolean;
};

export function FilterOptionsStrip(props: {
  label: string;
  allHref: string;
  allActive: boolean;
  options: OptionItem[];
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  const stopScrollAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  const animateTo = useCallback(
    (targetLeft: number) => {
      const node = scrollerRef.current;
      if (!node) {
        return;
      }

      stopScrollAnimation();

      const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
      const startLeft = node.scrollLeft;
      const nextLeft = Math.max(0, Math.min(targetLeft, maxScrollLeft));
      const distance = nextLeft - startLeft;

      if (Math.abs(distance) < 4) {
        node.scrollLeft = nextLeft;
        return;
      }

      const startTime = performance.now();
      const duration = 360;

      isAnimatingRef.current = true;

      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.scrollLeft = startLeft + distance * eased;

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        node.scrollLeft = nextLeft;
        animationFrameRef.current = null;
        isAnimatingRef.current = false;
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    },
    [stopScrollAnimation],
  );

  const scrollByStep = useCallback(
    (direction: "left" | "right") => {
      const node = scrollerRef.current;
      if (!node) {
        return;
      }

      const pageWidth = Math.max(320, Math.floor(node.clientWidth * 0.92));
      const amount = direction === "left" ? -pageWidth : pageWidth;
      animateTo(node.scrollLeft + amount);
    },
    [animateTo],
  );

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    const onNativeWheel = (event: WheelEvent) => {
      const distance = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (distance === 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if (isAnimatingRef.current) {
        return;
      }

      scrollByStep(distance < 0 ? "left" : "right");
    };

    node.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onNativeWheel);
      stopScrollAnimation();
    };
  }, [scrollByStep, stopScrollAnimation]);

  return (
    <div className="relative w-full">
      <div className="mb-2 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="向左查看更多选项"
          onClick={() => scrollByStep("left")}
          className="h-8 w-8 rounded border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
        >
          {"<"}
        </button>
        <button
          type="button"
          aria-label="向右查看更多选项"
          onClick={() => scrollByStep("right")}
          className="h-8 w-8 rounded border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
        >
          {">"}
        </button>
      </div>
      <div
        ref={scrollerRef}
        className="hide-scrollbar flex items-center gap-2 overflow-x-auto py-1 scroll-smooth [overscroll-behavior:contain]"
      >
        <span className="mr-2 shrink-0 text-[12px] font-semibold tracking-wide text-slate-500">{props.label}</span>
        <Link
          href={props.allHref}
          className={`shrink-0 rounded border px-4 py-1.5 text-[13px] transition ${
            props.allActive
              ? "border-slate-300 bg-slate-200 text-slate-800"
              : "border-slate-300/70 text-slate-500 hover:bg-slate-200/70"
          }`}
        >
          全部
        </Link>
        {props.options.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`shrink-0 rounded border px-4 py-1.5 text-[13px] transition ${
              item.active
                ? "border-slate-300 bg-slate-200 text-slate-800"
                : "border-slate-300/70 text-slate-500 hover:bg-slate-200/70"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-[#f7f9fb] to-transparent" />
    </div>
  );
}
