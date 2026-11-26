"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@/content/site";
import { useUi } from "@/lib/store";
import { Magnetic } from "./fx";

const links = [
  { href: "#first-light", label: "About" },
  { href: "#first-stars", label: "Experience" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

function LocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = setInterval(update, 15000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time} IST</span>;
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const introDone = useUi((s) => s.introDone);
  const lenis = useUi((s) => s.lenis);

  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
  }, [open, lenis]);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={introDone ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 mix-blend-difference"
      >
        <nav className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 sm:px-10">
          <a href="#top" className="flex items-center gap-3 text-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 font-serif text-base italic">JV</span>
            <span className="hidden sm:inline">{profile.name}</span>
          </a>

          <div className="hidden items-center gap-10 text-sm lg:flex">
            {links.map((l, i) => (
              <a key={l.href} href={l.href} className="group relative text-white/70 transition-colors hover:text-white">
                <span className="mr-1.5 text-[10px] text-white/40">0{i + 1}</span>
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-6 text-sm lg:flex">
            <span className="hidden text-white/50 xl:inline">
              <LocalTime />
            </span>
            <Magnetic>
              <a href={profile.resume} download className="rounded-full border border-white/40 px-5 py-2 text-white transition-colors hover:bg-white hover:text-black">
                Resume ↓
              </a>
            </Magnetic>
          </div>

          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="relative z-[60] flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full border border-white/40 lg:hidden"
          >
            <span className={`h-px w-4 bg-white transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-4 bg-white transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-between bg-bg px-5 pb-10 pt-28 lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="space-y-2">
              {links.map((l, i) => (
                <li key={l.href} className="overflow-hidden">
                  <motion.a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-baseline gap-4 font-serif text-5xl"
                  >
                    <span className="font-sans text-xs text-accent">0{i + 1}</span>
                    {l.label}
                  </motion.a>
                </li>
              ))}
            </ul>
            <div className="flex items-end justify-between text-sm text-muted">
              <div className="space-y-1">
                <a href={`mailto:${profile.email}`} className="block text-text">{profile.email}</a>
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="block">LinkedIn ↗</a>
              </div>
              <a href={profile.resume} download className="rounded-full border border-line-strong px-4 py-2 text-text">Resume ↓</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
