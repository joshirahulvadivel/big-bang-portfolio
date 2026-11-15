// The story: seven chapters of the universe, each one a chapter of the career.
// Chapter index = the section's data-stage. Scroll position becomes a continuous time t (0..6).

export type Chapter = {
  id: string;
  label: string;
  /** Years since the Big Bang at this chapter (13.8 billion = today). */
  age: number;
  /** Career year shown beside the cosmic clock; null hides it. */
  year: number | null;
};

export const UNIVERSE_AGE = 13.8e9;

export const CHAPTERS: Chapter[] = [
  { id: "top", label: "Origin", age: 1 / 31_557_600, year: null }, // one second after the Big Bang
  { id: "first-light", label: "First light", age: 380_000, year: 2018 },
  { id: "first-stars", label: "First stars", age: 200e6, year: 2021 },
  { id: "cosmic-web", label: "Cosmic web", age: 1e9, year: 2022 },
  { id: "work", label: "The Sun", age: 9.2e9, year: 2024 },
  { id: "earth", label: "Earth", age: 9.26e9, year: 2024 },
  { id: "now", label: "Now", age: UNIVERSE_AGE, year: 2026 },
];

/** Shared per-frame values the 3D story publishes for the page. */
export const storyFx = {
  /** How fast story time is moving, used by the warp streaks. */
  speed: 0,
};

/** Smoothly rises from 0 to 1 between a and b. */
export function ramp(t: number, a: number, b: number) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/** 0 before `inA`, 1 between `inB` and `outA`, 0 after `outB`. */
export function window4(t: number, inA: number, inB: number, outA: number, outB: number) {
  return Math.min(ramp(t, inA, inB), 1 - ramp(t, outA, outB));
}

/** Cosmic age at story time t, interpolated on a log scale between chapters. */
export function ageAt(t: number) {
  const c = Math.min(Math.max(t, 0), CHAPTERS.length - 1);
  const i = Math.min(Math.floor(c), CHAPTERS.length - 2);
  const f = c - i;
  const a = Math.log10(CHAPTERS[i].age);
  const b = Math.log10(CHAPTERS[i + 1].age);
  return Math.pow(10, a + (b - a) * f);
}

export function yearAt(t: number) {
  const c = Math.min(Math.max(t, 0), CHAPTERS.length - 1);
  const i = Math.round(c);
  return CHAPTERS[i].year;
}

/** "1 second", "380,000 years", "200 million years", "9.2 billion years". */
export function formatAge(years: number) {
  const seconds = years * 31_557_600;
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} second${Math.round(seconds) === 1 ? "" : "s"}`;
  if (years < 1) return `${Math.round(seconds / 86400)} days`;
  if (years < 1e6) return `${Math.round(years).toLocaleString("en-US")} years`;
  if (years < 1e9) return `${Math.round(years / 1e6)} million years`;
  return `${(years / 1e9).toFixed(years >= 1e10 ? 1 : 2).replace(/\.?0+$/, "")} billion years`;
}
