"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Cursor from "./Cursor";
import Loader from "./Loader";
import Nav from "./Nav";
import SmoothScroll from "./SmoothScroll";
import ChapterRail from "./ChapterRail";
import CosmicClock from "./CosmicClock";
import SoundToggle from "./SoundToggle";

const Scene = dynamic(() => import("./three/Scene"), { ssr: false });

/** Fixed 3D canvas behind the page; pointer events reach it through the page via the shared root. */
export default function Shell({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div ref={root} className="relative">
      <Scene eventSource={root} />
      <SmoothScroll />
      <Loader />
      <Cursor />
      <Nav />
      <ChapterRail />
      <CosmicClock />
      <SoundToggle />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
