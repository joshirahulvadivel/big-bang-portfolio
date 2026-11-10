"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { scrollState, useUi } from "@/lib/store";

/**
 * Runs Lenis and turns the scroll position into the flight position.
 * Each section's stop is reached as its top passes 15% down the screen; between stops the
 * flight moves in proportion to scroll, so there is no stretch where the scene stands still.
 * The pinned work section is the exception: the camera only drifts while its panels are up,
 * then flies on once the pin releases.
 */
export default function SmoothScroll() {
  const setLenis = useUi((s) => s.setLenis);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduce ? null : new Lenis({ autoRaf: true, lerp: 0.085, anchors: { offset: 0 } });
    setLenis(lenis);

    let anchors: number[] = [];
    let work = { top: 0, span: 1, h: 1 };
    let workStage = -1;
    const HOLD_DRIFT = 0.12;

    const measure = () => {
      const vh = window.innerHeight;
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-stage]")).sort(
        (a, b) => Number(a.dataset.stage) - Number(b.dataset.stage),
      );
      anchors = els.map((el, i) => (i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY - vh * 0.15));
      workStage = els.findIndex((el) => el.querySelector("[data-work]") && (el.querySelector("[data-work]") as HTMLElement).offsetHeight > 0);
      scrollState.anchors = anchors;
      const w = document.querySelector<HTMLElement>("[data-work]");
      if (w) {
        const top = w.getBoundingClientRect().top + window.scrollY;
        work = { top, span: Math.max(1, w.offsetHeight - vh), h: w.offsetHeight };
        const n = Number(w.dataset.work);
        scrollState.workTargets = Array.from({ length: n }, (_, i) => top + (i / (n - 1)) * work.span);
      }
    };

    const journeyAt = (y: number) => {
      for (let i = 0; i < anchors.length - 1; i++) {
        if (y >= anchors[i + 1]) continue;
        if (i === workStage) {
          const holdEnd = work.top + work.span;
          if (y < holdEnd) return i + HOLD_DRIFT * Math.max(0, (y - anchors[i]) / (holdEnd - anchors[i]));
          return i + HOLD_DRIFT + (1 - HOLD_DRIFT) * ((y - holdEnd) / Math.max(1, anchors[i + 1] - holdEnd));
        }
        return i + Math.max(0, (y - anchors[i]) / (anchors[i + 1] - anchors[i]));
      }
      return anchors.length - 1;
    };

    let raf = 0;
    const tick = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (anchors.length) {
        scrollState.stage = journeyAt(y);
        const last = anchors[anchors.length - 1];
        const max = document.documentElement.scrollHeight - vh;
        scrollState.tail = Math.min(1, Math.max(0, (y - last) / Math.max(1, max - last)));
      }
      scrollState.work = Math.min(1, Math.max(0, (y - work.top) / work.span));
      // pinned stage fades in as it arrives and out as it leaves
      const fadeIn = Math.min(1, Math.max(0, (y - (work.top - vh * 0.45)) / (vh * 0.4)));
      const fadeOut = Math.min(1, Math.max(0, (work.top + work.span + vh * 0.2 - y) / (vh * 0.3)));
      scrollState.workVis = Math.min(fadeIn, fadeOut);
      raf = requestAnimationFrame(tick);
    };

    measure();
    tick();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      lenis?.destroy();
      setLenis(null);
    };
  }, [setLenis]);

  return null;
}
