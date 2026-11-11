"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@/content/site";
import { useUi } from "@/lib/store";

const MIN_MS = 1400;
const FALLBACK_MS = 6000; // never trap the page if WebGL fails to start

export default function Loader() {
  const ready = useUi((s) => s.ready);
  const lenis = useUi((s) => s.lenis);
  const setIntroDone = useUi((s) => s.setIntroDone);
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const step = () => {
      const elapsed = performance.now() - start;
      const ok = useUi.getState().ready || elapsed > FALLBACK_MS;
      const cap = ok ? 100 : 86;
      setCount((c) => {
        const target = Math.ceil(Math.min(cap, (elapsed / MIN_MS) * 100));
        if (target <= c) return c;
        return Math.min(target, Math.max(c + 1, Math.round(c + (target - c) * 0.18)));
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (count >= 100 && !gone) {
      const t = setTimeout(() => setGone(true), 250);
      return () => clearTimeout(t);
    }
  }, [count, gone, ready]);

  useEffect(() => {
    if (!lenis) return;
    if (gone) lenis.start();
    else lenis.stop();
  }, [gone, lenis]);

  return (
    <AnimatePresence onExitComplete={setIntroDone}>
      {!gone && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-bg px-6 py-8 sm:px-10"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="flex justify-between text-xs uppercase tracking-[0.25em] text-muted">
            <span>{profile.name}</span>
            <span>13.8 billion years ago</span>
          </div>
          <div>
            <div className="overflow-hidden">
              <motion.p
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-5xl italic text-text sm:text-7xl"
              >
                Before time.
              </motion.p>
            </div>
            <div className="mt-8 h-px w-full bg-line">
              <div className="h-px bg-accent transition-[width] duration-150" style={{ width: `${count}%` }} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-xs uppercase tracking-[0.25em] text-muted">Loading the scene</span>
            <span className="font-serif text-6xl tabular-nums text-text sm:text-8xl">{String(count).padStart(3, "0")}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
