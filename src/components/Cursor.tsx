"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useUi } from "@/lib/store";

/** Dot plus trailing ring; the ring grows and shows a label over interactive things. Fine pointers only. */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const sceneLabel = useUi((s) => s.cursorLabel);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor]");
      setHover(el ? el.dataset.cursor ?? "" : null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [x, y]);

  if (!enabled) return null;
  const label = sceneLabel ?? (hover || null);
  const big = label !== null || hover !== null;

  return (
    <>
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[90] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text" style={{ x, y }} />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[90] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-text/40 text-[10px] font-medium uppercase tracking-[0.2em] text-bg"
        style={{ x: rx, y: ry }}
        animate={{
          width: label ? 72 : big ? 44 : 30,
          height: label ? 72 : big ? 44 : 30,
          backgroundColor: label ? "rgba(242,194,122,1)" : "rgba(242,194,122,0)",
          borderColor: label ? "rgba(242,194,122,0)" : "rgba(241,237,230,0.35)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        {label}
      </motion.div>
    </>
  );
}
