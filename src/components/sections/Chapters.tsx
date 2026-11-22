import { competencies, education, experience, languages, profile, stats, tools } from "@/content/site";
import { Reveal, SectionFade } from "../fx";
import { ChapterHead, RoleBlock } from "./ChapterParts";

// experience is newest first: [Associate PM, Team Lead, Senior Moderator, Moderator]
const [apm, teamLead, seniorMod, moderator] = experience;

const shell = "relative px-5 py-32 sm:px-10 md:py-40";
const column = "md:max-w-[56%]";

/** Chapter 1 · First light: where it started — education and who I am. */
export function FirstLight() {
  return (
    <section id="first-light" data-stage="1" className={shell}>
      <SectionFade className="mx-auto max-w-[1400px]">
        <div className={column}>
          <ChapterHead
            index={1}
            title="First light:"
            italic="where it started."
            sub="380,000 years in, the universe cooled enough for light to travel freely. My first light was a degree in information technology."
          />
          <Reveal delay={0.1}>
            <p className="mt-10 text-lg leading-relaxed text-text/80">{profile.summary}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="glass mt-10 rounded-3xl p-7">
              <p className="text-xs uppercase tracking-[0.28em] text-muted">Education</p>
              <h3 className="mt-4 font-serif text-3xl">{education.degree}</h3>
              <p className="mt-2 text-sm text-muted">
                {education.school} · {education.period}
              </p>
              <p className="mt-4 text-sm text-text/70">{languages.join("  ·  ")}</p>
            </div>
          </Reveal>
          <dl className="mt-12 grid grid-cols-2 border-t border-line">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06} className={`border-b border-line py-7 ${i % 2 ? "pl-6 sm:pl-10" : "border-r pr-6"}`}>
                <dt className="font-serif text-5xl text-text sm:text-6xl">{s.value}</dt>
                <dd className="mt-2 text-sm text-muted">{s.label}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </SectionFade>
    </section>
  );
}

/** Chapter 2 · First stars: the first role, the first spark. */
export function FirstStars() {
  return (
    <section id="first-stars" data-stage="2" className={shell}>
      <SectionFade className="mx-auto max-w-[1400px]">
        <div className={column}>
          <ChapterHead
            index={2}
            title="The first spark."
            italic="Gas becomes stars."
            sub="After the dark ages, gravity pulled the first clouds together until they ignited. In 2021 I joined araCreate Group on the front line."
          />
          <div className="mt-14">
            <RoleBlock role={moderator} />
          </div>
        </div>
      </SectionFade>
    </section>
  );
}

/** Chapter 3 · Cosmic web: growing into quality, teams and networks. */
export function CosmicWeb() {
  return (
    <section id="cosmic-web" data-stage="3" className={shell}>
      <SectionFade className="mx-auto max-w-[1400px]">
        <div className={column}>
          <ChapterHead
            index={3}
            title="Building the web:"
            italic="teams, quality, connections."
            sub="Stars gathered into galaxies along a web of filaments. My role grew from doing the work to connecting the people who do it."
          />
          <div className="mt-14">
            <RoleBlock role={teamLead} />
            <RoleBlock role={seniorMod} />
          </div>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-4">
          {tools.map((t, i) => (
            <Reveal key={t.group} delay={i * 0.06}>
              <p className="mb-4 text-xs uppercase tracking-[0.22em] text-muted">{t.group}</p>
              <ul className="space-y-1.5 text-text/85">
                {t.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </SectionFade>
    </section>
  );
}

/** Chapter 5 · Earth: the present role and what it takes. */
export function EarthChapter() {
  return (
    <section id="earth" data-stage="5" className={shell}>
      <SectionFade className="mx-auto max-w-[1400px]">
        <div className={column}>
          <ChapterHead
            index={5}
            title="A world takes shape:"
            italic="leading projects."
            sub="Molten rock cooled into oceans and continents. Everything before led here: coordinating projects end to end."
          />
          <div className="mt-14">
            <RoleBlock role={apm} current />
          </div>
        </div>
        <div className="mt-12">
          <Reveal>
            <p className="mb-6 text-xs uppercase tracking-[0.28em] text-muted">Core competencies</p>
          </Reveal>
          <ul className="grid border-t border-line md:grid-cols-2 md:gap-x-12">
            {competencies.map((c, i) => (
              <Reveal key={c.title} delay={(i % 2) * 0.06}>
                <li className="group border-b border-line py-6">
                  <h3 className="flex items-baseline gap-4 font-serif text-2xl transition-transform duration-500 group-hover:translate-x-1.5">
                    <span className="font-sans text-xs text-accent">0{i + 1}</span>
                    {c.title}
                  </h3>
                  <p className="mt-2 pl-8 text-sm leading-relaxed text-muted">{c.items.join("  ·  ")}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </SectionFade>
    </section>
  );
}
