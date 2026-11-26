import { CHAPTERS, formatAge } from "@/lib/story";
import type { experience } from "@/content/site";
import { Reveal, SplitWords } from "../fx";

/** Chapter heading: number, era and cosmic time, then a two-tone serif title. */
export function ChapterHead({ index, title, italic, sub }: { index: number; title: string; italic?: string; sub?: string }) {
  const ch = CHAPTERS[index];
  return (
    <>
      <Reveal>
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.28em] text-muted">
          <span className="text-accent">Chapter {String(index).padStart(2, "0")}</span>
          <span className="h-px w-8 bg-line-strong" />
          {ch.label}
          <span className="normal-case tracking-[0.08em] text-muted/60">· {formatAge(ch.age)} after the Big Bang</span>
        </p>
      </Reveal>
      <h2 className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] leading-[1.02] tracking-[-0.01em]">
        <SplitWords text={title} />
        {italic && (
          <>
            {" "}
            <span className="italic text-muted">
              <SplitWords text={italic} delay={0.2} />
            </span>
          </>
        )}
      </h2>
      {sub && (
        <Reveal delay={0.15}>
          <p className="mt-6 max-w-xl text-text/60">{sub}</p>
        </Reveal>
      )}
    </>
  );
}

type Role = (typeof experience)[number];

/** One role: period, title, focus and what was done. */
export function RoleBlock({ role, current }: { role: Role; current?: boolean }) {
  return (
    <Reveal>
      <div className="grid gap-4 border-t border-line py-10 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-10">
        <div className="text-sm">
          <p className={current ? "text-accent" : "text-muted"}>{role.period}</p>
          {current && (
            <span className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-text/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Current
            </span>
          )}
        </div>
        <div>
          <h3 className="font-serif text-3xl sm:text-4xl">{role.role}</h3>
          <p className="mt-1 text-sm text-muted">{role.focus}</p>
          <ul className="mt-6 space-y-3">
            {role.points.map((p) => (
              <li key={p} className="flex gap-4 text-[15px] leading-relaxed text-text/75">
                <span className="mt-[11px] h-px w-3 shrink-0 bg-accent/70" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
