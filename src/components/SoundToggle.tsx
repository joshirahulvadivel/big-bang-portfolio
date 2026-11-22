"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ambient } from "@/lib/ambient";
import { scrollState, useUi } from "@/lib/store";

/** Bottom-right sound switch. Off by default; when on, the soundtrack follows the story. */
export default function SoundToggle() {
  const introDone = useUi((s) => s.introDone);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let lastChapter = Math.round(scrollState.stage);
    let lastSent = 0;
    const tick = (now: number) => {
      if (now - lastSent > 120) {
        ambient.setStory(scrollState.stage);
        lastSent = now;
      }
      const ch = Math.round(scrollState.stage);
      if (ch !== lastChapter) {
        lastChapter = ch;
        ambient.chime(ch);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onVis = () => (document.hidden ? ambient.pause() : ambient.resume());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [on]);

  const toggle = async () => {
    if (on) {
      ambient.stop();
      setOn(false);
    } else {
      await ambient.start();
      setOn(true);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={introDone ? { opacity: 1 } : {}}
      transition={{ duration: 1, delay: 2 }}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      data-cursor={on ? "Mute" : "Sound"}
      className="fixed bottom-6 right-5 z-40 flex items-center gap-3 rounded-full border border-line-strong bg-bg/50 px-4 py-2.5 text-[10px] uppercase tracking-[0.25em] text-muted backdrop-blur-md transition-colors hover:text-text sm:right-10"
    >
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-[2px] rounded-full bg-accent ${on ? "animate-[soundbar_1s_ease-in-out_infinite]" : ""}`}
            style={{ height: on ? "100%" : "30%", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      {on ? "Sound on" : "Sound off"}
    </motion.button>
  );
}
