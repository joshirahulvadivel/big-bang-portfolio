"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ageAt, formatAge, yearAt } from "@/lib/story";
import { scrollState, useUi } from "@/lib/store";

/** Bottom-left clock: time since the Big Bang for the current scroll position, and the career year beside it. */
export default function CosmicClock() {
  const introDone = useUi((s) => s.introDone);
  const age = useRef<HTMLSpanElement>(null);
  const year = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastAge = "";
    let lastYear = "";
    const tick = () => {
      // during the opening, count up through the first second
      const a = scrollState.bang < 1 && scrollState.stage < 0.05 ? "0" : formatAge(ageAt(scrollState.stage));
      if (a !== lastAge && age.current) age.current.textContent = lastAge = a;
      const y = yearAt(scrollState.stage);
      const ys = y ? String(y) : "—";
      if (ys !== lastYear && year.current) year.current.textContent = lastYear = ys;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={introDone ? { opacity: 1 } : {}}
      transition={{ duration: 1, delay: 1.8 }}
      className="pointer-events-none fixed bottom-6 left-5 z-40 hidden select-none sm:left-10 md:block"
      aria-hidden
    >
      <p className="text-[10px] uppercase tracking-[0.28em] text-muted">Time since the Big Bang</p>
      <p className="mt-1 font-serif text-2xl text-text tabular-nums">
        <span ref={age}>0</span>
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-muted">
        Career · <span ref={year} className="text-accent">—</span>
      </p>
    </motion.div>
  );
}
