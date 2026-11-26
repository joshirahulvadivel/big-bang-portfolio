import { award, certifications, profile } from "@/content/site";
import { Magnetic, Reveal, SectionFade, SplitWords } from "../fx";
import ContactForm from "../ContactForm";
import { ChapterHead } from "./ChapterParts";
import credits from "@/data/space-credits.json";

export default function Contact() {
  return (
    <section id="now" data-stage="6" className="relative flex min-h-svh flex-col justify-between px-5 pt-32 sm:px-10">
      <SectionFade className="mx-auto w-full max-w-[1400px]">
        <div className="md:max-w-[56%]">
          <ChapterHead
            index={6}
            title="Now:"
            italic="13.8 billion years later."
            sub="Earth's night side, lit by the cities where the work happens. The story so far, recognised and certified."
          />
        </div>
        <div className="mt-14 grid gap-4 md:max-w-[52%] md:grid-cols-3">
          <Reveal className="md:col-span-3">
            <div className="glass relative overflow-hidden rounded-3xl p-7">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Award</p>
              <h3 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">{award.name}</h3>
              <p className="mt-3 max-w-lg text-sm text-muted">{award.detail}</p>
            </div>
          </Reveal>
          {certifications.map((c, i) => (
            <Reveal key={c.name} delay={0.05 + i * 0.05}>
              <div className="glass h-full rounded-3xl p-6">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted">Certification · 0{i + 1}</p>
                <h3 className="mt-4 font-serif text-xl leading-tight">{c.name}</h3>
                <p className="mt-2 text-xs text-muted">{c.issuer}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionFade>
      <div id="contact" className="h-24" />
      <SectionFade last className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-center justify-center text-center">
        <Reveal>
          <p className="mb-8 text-xs uppercase tracking-[0.28em] text-muted">
            <span className="text-accent">What&apos;s next</span> · Contact
          </p>
        </Reveal>
        <h2 className="max-w-5xl font-serif text-[clamp(3rem,8vw,7.5rem)] leading-[0.95] tracking-[-0.02em]">
          <SplitWords text="Let’s write the next" /> <span className="italic text-accent"><SplitWords text="chapter." delay={0.25} /></span>
        </h2>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-8 max-w-lg text-text/70">{profile.contactNote}</p>
        </Reveal>
        <Reveal delay={0.3} className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Magnetic strength={0.2}>
            <a href={`mailto:${profile.email}`} className="block rounded-full bg-text px-8 py-5 text-sm font-medium text-bg sm:text-base">
              {profile.email}
            </a>
          </Magnetic>
          <Magnetic>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="block rounded-full border border-line-strong px-7 py-5 text-sm hover:border-text">
              LinkedIn ↗
            </a>
          </Magnetic>
          <Magnetic>
            <a href={profile.resume} download className="block rounded-full border border-line-strong px-7 py-5 text-sm hover:border-text">
              Resume ↓
            </a>
          </Magnetic>
        </Reveal>
        <Reveal delay={0.35} className="mt-16 w-full max-w-3xl">
          <ContactForm />
        </Reveal>
      </SectionFade>

      <footer className="mx-auto mt-24 flex w-full max-w-[1400px] flex-col gap-3 border-t border-line py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{profile.location}</span>
        <a href="#top" className="hover:text-text">Back to top ↑</a>
      </footer>
      <details className="group mx-auto mb-8 w-full max-w-[1400px] text-[11px] leading-relaxed text-muted/70">
        <summary className="cursor-pointer list-none hover:text-muted">
          Imagery: NASA, ESA, CSA, STScI · NASA Earth Observatory · NASA SVS. Used under NASA media guidelines; no endorsement implied.{" "}
          <span className="underline underline-offset-2 group-open:hidden">Full credits</span>
        </summary>
        <ul className="mt-3 space-y-1">
          {credits.map((c) => (
            <li key={c.id}>
              <a href={c.source} target="_blank" rel="noopener noreferrer" className="hover:text-text">
                {c.title}
              </a>{" "}
              · {c.credit}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
