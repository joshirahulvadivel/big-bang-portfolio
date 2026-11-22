"use client";

import { motion } from "framer-motion";
import { profile } from "@/content/site";
import { useUi } from "@/lib/store";
import { Magnetic, SectionFade, SplitWords } from "../fx";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Seconds after the loader lifts before the name forms out of the Big Bang light. */
const AFTER_BANG = 1.5;

export default function Hero() {
  const play = useUi((s) => s.introDone);
  const [first, ...rest] = profile.name.split(" ");
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: play ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.9, delay: delay + AFTER_BANG, ease: EASE },
  });

  return (
    <section id="top" data-stage="0" className="relative flex min-h-svh flex-col px-5 pb-8 pt-28 sm:px-10">
      <SectionFade hero className="flex flex-1 flex-col justify-between">
      <div className="mx-auto w-full max-w-[1400px] flex-1 content-center">
        <div className="max-w-3xl">
          <motion.p {...fade(0.1)} className="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            Chapter 00 · Origin · {profile.headline}
          </motion.p>

          <h1 className="font-serif text-[clamp(3.6rem,11vw,10rem)] leading-[0.9] tracking-[-0.02em]">
            <SplitWords text={first} play={play} delay={AFTER_BANG + 0.15} />
            <br />
            <span className="italic text-accent">
              <SplitWords text={rest.join(" ")} play={play} delay={AFTER_BANG + 0.3} />
            </span>
          </h1>

          <motion.p {...fade(0.55)} className="mt-8 max-w-md text-base leading-relaxed text-text/75 sm:text-lg">
            {profile.tagline}
          </motion.p>

          <motion.div {...fade(0.7)} className="mt-10 flex flex-wrap items-center gap-4">
            <Magnetic>
              <a href="#work" className="group flex items-center gap-3 rounded-full bg-text px-7 py-4 text-sm font-medium text-bg">
                View selected work
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a href="#contact" className="rounded-full border border-line-strong px-7 py-4 text-sm text-text transition-colors hover:border-text">
                Get in touch
              </a>
            </Magnetic>
          </motion.div>
        </div>
      </div>

      <motion.div {...fade(0.9)} className="mx-auto mt-16 flex w-full max-w-[1400px] justify-center pt-6 text-xs text-muted">
        <a href="#first-light" className="flex flex-col items-center gap-3" aria-label="Scroll to the first chapter">
          <span className="uppercase tracking-[0.25em]">Scroll through 13.8 billion years</span>
          <span className="relative h-10 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2s_ease-in-out_infinite] bg-accent" />
          </span>
        </a>
      </motion.div>
      </SectionFade>
    </section>
  );
}
