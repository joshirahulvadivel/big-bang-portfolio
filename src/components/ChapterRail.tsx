"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { scrollState, scrollToY, useUi } from "@/lib/store";
import { CHAPTERS } from "@/lib/story";

const LABELS = CHAPTERS.map((c) => c.label);

/** Vertical rail on the right: the story's chapters, the current position, click to jump. */
export default function ChapterRail() {
  const introDone = useUi((s) => s.introDone);
  const fill = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const j = scrollState.stage;
      if (fill.current) fill.current.style.transform = `scaleY(${j / (LABELS.length - 1)})`;
      const next = Math.round(j);
      setActive((a) => (a === next ? a : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.nav
      aria-label="Chapters"
      initial={{ opacity: 0, x: 12 }}
      animate={introDone ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <div className="relative">
        <div className="absolute bottom-[7px] right-[3.5px] top-[7px] w-px bg-line-strong">
          <div ref={fill} className="h-full w-px origin-top bg-accent" style={{ transform: "scaleY(0)" }} />
        </div>
        <ol className="relative flex flex-col gap-6">
          {LABELS.map((label, i) => (
            <li key={label}>
              <button
                onClick={() => scrollToY(scrollState.anchors[i] ?? 0)}
                className="group flex items-center justify-end gap-3"
                aria-current={i === active ? "step" : undefined}
              >
                <span
                  className={`text-[10px] uppercase tracking-[0.22em] transition-all duration-500 ${
                    i === active ? "translate-x-0 text-text opacity-100" : "translate-x-1 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`h-2 w-2 rounded-full border transition-all duration-500 ${
                    i <= active ? "border-accent bg-accent" : "border-line-strong bg-bg"
                  } ${i === active ? "scale-125 shadow-[0_0_10px] shadow-accent/70" : ""}`}
                />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </motion.nav>
  );
}
