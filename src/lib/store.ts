import { create } from "zustand";
import type Lenis from "lenis";

/** Per-frame values written by the scroll loop and read inside useFrame. Mutable on purpose: no re-renders. */
export const scrollState = {
  /** Story time from the scroll position: chapter index plus progress (0 Origin … 6 Now). */
  stage: 0,
  /** Story time as the 3D scene shows it (smoothed); written by the story each frame. */
  story: 0,
  /** 0 before the Big Bang, rising to 1 as the opening explosion finishes. */
  bang: 0,
  /** 0..1 progress through the pinned work section. */
  work: 0,
  /** 0..1 how much the work section's pinned stage is on screen. */
  workVis: 0,
  /** Scroll position that brings project i to the front of the gallery. */
  workTargets: [] as number[],
  /** 0..1 progress through the final stretch of the page, from the last chapter's start to the bottom. */
  tail: 0,
  /** Scroll position at which each chapter is reached. */
  anchors: [] as number[],
};

type UiState = {
  ready: boolean;
  introDone: boolean;
  activeProject: number | null;
  cursorLabel: string | null;
  lenis: Lenis | null;
  setReady: () => void;
  setIntroDone: () => void;
  openProject: (i: number | null) => void;
  setCursorLabel: (l: string | null) => void;
  setLenis: (l: Lenis | null) => void;
};

export const useUi = create<UiState>((set) => ({
  ready: false,
  introDone: false,
  activeProject: null,
  cursorLabel: null,
  lenis: null,
  setReady: () => set({ ready: true }),
  setIntroDone: () => set({ introDone: true }),
  openProject: (i) => set({ activeProject: i }),
  setCursorLabel: (l) => set({ cursorLabel: l }),
  setLenis: (l) => set({ lenis: l }),
}));

export function scrollToY(y: number) {
  const { lenis } = useUi.getState();
  if (lenis) lenis.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}
