"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts children in when scrolled into view. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Reveals text word by word from a mask. `play` forces it (hero), otherwise it plays on view. */
export function SplitWords({ text, className, delay = 0, play }: { text: string; className?: string; delay?: number; play?: boolean }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const anim = (i: number) => ({
    initial: reduce ? false : { y: "110%" },
    ...(play === undefined ? { whileInView: { y: "0%" }, viewport: { once: true, margin: "-40px" } } : { animate: play ? { y: "0%" } : undefined }),
    transition: { duration: 0.9, delay: delay + i * 0.045, ease: EASE },
  });
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span className="inline-block" {...anim(i)}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Pulls its child gently toward the pointer. */
export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  return (
    <motion.div
      ref={ref}
      className="inline-block"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fades a section's content in as it arrives and out as it leaves, so neighbouring sections never overlap.
 * `hero` skips the fade-in (the page opens on it); `last` skips the fade-out (nothing follows it).
 */
export function SectionFade({ children, className, hero, last }: { children: ReactNode; className?: string; hero?: boolean; last?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: arrive } = useScroll({ target: ref, offset: ["start 0.95", "start 0.55"] });
  const { scrollYProgress: leave } = useScroll({ target: ref, offset: ["end 0.55", "end 0.05"] });
  const opacity = useTransform([arrive, leave], ([a, l]: number[]) => Math.min(hero ? 1 : a, last ? 1 : 1 - l));
  const y = useTransform(leave, [0, 1], [0, last ? 0 : -48]);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}

/** Section label; `sky` names the object shown in the 3D scene behind the section. */
export function Eyebrow({ index, children, sky }: { index: string; children: ReactNode; sky?: string }) {
  return (
    <Reveal>
      <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.28em] text-muted">
        <span className="text-accent">{index}</span>
        <span className="h-px w-8 bg-line-strong" />
        {children}
        {sky && <span className="normal-case tracking-[0.08em] text-muted/60">· {sky}</span>}
      </p>
    </Reveal>
  );
}
