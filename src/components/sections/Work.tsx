"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { projects } from "@/content/site";
import { scrollState, scrollToY, useUi } from "@/lib/store";
import { Eyebrow, Reveal, SectionFade, SplitWords } from "../fx";

function useActiveIndex() {
  const [i, setI] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const next = Math.round(scrollState.work * (projects.length - 1));
      setI((cur) => (cur === next ? cur : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return i;
}

/** The pinned work stage fades with the 3D gallery, so it never overlaps the sections around it. */
function PinnedFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) ref.current.style.opacity = String(scrollState.workVis);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

function ProjectModal() {
  const active = useUi((s) => s.activeProject);
  const openProject = useUi((s) => s.openProject);
  const lenis = useUi((s) => s.lenis);
  const project = active === null ? null : projects[active];

  useEffect(() => {
    if (active === null) return;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openProject(null);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
  }, [active, lenis, openProject]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[80] flex justify-end bg-black/50 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => openProject(null)}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-title"
            data-lenis-prevent
            className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-bg/95 px-6 py-10 backdrop-blur-xl sm:px-12"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => openProject(null)}
              className="self-end rounded-full border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-text"
            >
              Close ✕
            </button>
            <p className="mt-12 text-xs uppercase tracking-[0.28em] text-accent">
              {String(active! + 1).padStart(2, "0")} · {project.client}
            </p>
            <h3 id="case-title" className="mt-4 font-serif text-5xl leading-[1.02]">
              {project.name}
            </h3>
            <p className="mt-3 text-sm text-muted">{project.role}</p>
            <p className="mt-10 text-lg leading-relaxed text-text/85">{project.summary}</p>
            <p className="mt-12 text-xs uppercase tracking-[0.28em] text-muted">What I did</p>
            <ul className="mt-4 border-t border-line">
              {project.points.map((p) => (
                <li key={p} className="border-b border-line py-4 text-text/80">
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {project.tags.map((t) => (
                <span key={t} className="rounded-full border border-line-strong px-3 py-1 text-xs text-muted">
                  {t}
                </span>
              ))}
            </div>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="mt-10 self-start rounded-full bg-text px-6 py-3 text-sm text-bg">
                Visit project ↗
              </a>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default function Work() {
  const active = useActiveIndex();
  const openProject = useUi((s) => s.openProject);

  return (
    <section id="work" data-stage="4" className="relative">
      {/* Desktop: pinned stage, the 3D gallery turns with scroll */}
      <div data-work={projects.length} className="relative hidden h-[260vh] md:block">
        <PinnedFade className="sticky top-0 flex h-svh flex-col justify-between px-10 pb-10 pt-28 lg:pb-32">
          <div className="mx-auto w-full max-w-[1400px]">
            <Eyebrow index="Chapter 04" sky="9.2 billion years after the Big Bang">The Sun · Selected work</Eyebrow>
            <h2 className="max-w-2xl font-serif text-[clamp(2.2rem,4vw,3.75rem)] leading-[1.02]">
              <SplitWords text="From a cloud of ideas," />{" "}
              <span className="italic text-muted">
                <SplitWords text="projects take shape." delay={0.2} />
              </span>
            </h2>
          </div>

          <div className="mx-auto flex w-full max-w-[1400px] items-end justify-between gap-10">
            <ol className="space-y-1.5 text-sm">
              {projects.map((p, i) => (
                <li key={p.name}>
                  <button
                    onClick={() => scrollToY(scrollState.workTargets[i])}
                    className={`flex items-center gap-3 transition-colors ${i === active ? "text-text" : "text-muted/60 hover:text-muted"}`}
                  >
                    <span className={`h-px transition-all duration-500 ${i === active ? "w-10 bg-accent" : "w-4 bg-line-strong"}`} />
                    <span className="text-[10px] tabular-nums">0{i + 1}</span>
                    {p.client}
                  </button>
                </li>
              ))}
            </ol>
            <p className="max-w-[220px] text-right text-xs uppercase leading-relaxed tracking-[0.22em] text-muted">
              Scroll to browse
              <br />
              Click the front panel to open
            </p>
          </div>
        </PinnedFade>
      </div>

      {/* Phones: stacked cards */}
      <SectionFade className="px-5 py-32 md:hidden">
        <Eyebrow index="Chapter 04" sky="9.2 billion years after the Big Bang">The Sun · Selected work</Eyebrow>
        <h2 className="font-serif text-[2.6rem] leading-[1.02]">
          From a cloud of ideas, <span className="italic text-muted">projects take shape.</span>
        </h2>
        <div className="mt-12 space-y-4">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.04}>
              <button onClick={() => openProject(i)} className="glass w-full rounded-2xl p-6 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-accent">0{i + 1}</span>
                  <span className="text-muted">Open →</span>
                </div>
                <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted">{p.client}</p>
                <h3 className="mt-2 font-serif text-3xl leading-tight">{p.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.summary}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </SectionFade>

      {/* Screen readers: the 3D panels are decorative, the list carries the content */}
      <ul className="sr-only">
        {projects.map((p, i) => (
          <li key={p.name}>
            <button onClick={() => openProject(i)}>
              {p.name}, {p.client}: {p.summary}
            </button>
          </li>
        ))}
      </ul>

      <ProjectModal />
    </section>
  );
}
