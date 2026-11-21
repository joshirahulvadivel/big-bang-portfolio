"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { flashEl, labelEls } from "@/lib/labels";
import { globe } from "@/content/site";
import Story from "./Story";
import Warp from "./Warp";
import Backdrop from "./Backdrop";
import { SUN } from "./Earth";
import WorkGallery from "./WorkGallery";

// Label placement around each marker (home, then globe.links in order), so the Europe tags don't overlap.
const LABEL_OFFSETS = [
  { dx: 14, dy: 0, side: "right" },
  { dx: 16, dy: -26, side: "right" },
  { dx: -16, dy: -10, side: "left" },
  { dx: 16, dy: 22, side: "right" },
];

export default function Scene({ eventSource }: { eventSource: React.RefObject<HTMLElement | null> }) {
  const [dpr, setDpr] = useState(1.5);
  // Client-only component (loaded with ssr: false), so window is available on first render.
  const [animate, setAnimate] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [phone] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Canvas
        eventSource={eventSource as React.RefObject<HTMLElement>}
        eventPrefix="client"
        dpr={dpr}
        camera={{ position: [0, 0, 6], fov: 40, near: 0.1, far: 200 }}
        gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      >
        <color attach="background" args={["#07080b"]} />
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(window.devicePixelRatio, 1.75))} />
        <directionalLight position={SUN.clone().multiplyScalar(10)} intensity={2.6} />
        <ambientLight intensity={0.03} />

        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2} position={[0, 4, 3]} scale={[8, 1, 1]} color="#ffffff" />
          <Lightformer intensity={1.2} position={[-5, 0, 2]} scale={[1, 6, 1]} color="#f2c27a" />
          <Lightformer intensity={0.8} position={[5, -1, 2]} scale={[1, 6, 1]} color="#9db4e0" />
        </Environment>


        <Suspense fallback={null}>
          <Backdrop animate={animate} phone={phone} />
          <Story animate={animate} phone={phone} />
        </Suspense>
        <Warp animate={animate} />
        {!phone && <WorkGallery />}

        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.95} luminanceSmoothing={0.3} radius={0.7} />
          <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.18} />
          <Vignette offset={0.28} darkness={0.75} />
        </EffectComposer>
      </Canvas>
      {[{ name: globe.home.name, note: "Home base" }, ...globe.links].map((l, i) => (
        <div
          key={l.name}
          ref={(el) => {
            labelEls[i] = el;
          }}
          data-dx={LABEL_OFFSETS[i]?.dx}
          data-dy={LABEL_OFFSETS[i]?.dy}
          data-side={LABEL_OFFSETS[i]?.side}
          className="globe-tag absolute left-0 top-0"
          style={{ opacity: 0 }}
        >
          <span className="globe-tag-name">{l.name}</span>
          <span className="globe-tag-note">{l.note}</span>
        </div>
      ))}
      <div
        ref={(el) => {
          flashEl.current = el;
        }}
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0, background: "radial-gradient(circle at 60% 50%, #fff 0%, #fff6e0 30%, rgba(255,240,210,0.6) 60%, rgba(255,230,200,0) 100%)" }}
      />
    </div>
  );
}
