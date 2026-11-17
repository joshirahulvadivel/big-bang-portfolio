"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { projects } from "@/content/site";
import { scrollState, scrollToY, useUi } from "@/lib/store";

const SANS = "/fonts/inter-latin-400-normal.woff";
const SANS_MED = "/fonts/inter-latin-500-normal.woff";
const SERIF = "/fonts/instrument-serif-latin-400-normal.woff";

const W = 2.5;
const H = 1.56;
const RADIUS = 4.2;
const STEP = 0.72; // radians between panels

function Panel({ index }: { index: number }) {
  const project = projects[index];
  const ref = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const edge = useRef<THREE.MeshBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const openProject = useUi((s) => s.openProject);
  const setCursorLabel = useUi((s) => s.setCursorLabel);

  const angle = () => index * STEP - scrollState.work * (projects.length - 1) * STEP;
  const isFront = () => Math.abs(angle()) < STEP / 2;

  useFrame((_, delta) => {
    if (!ref.current || !inner.current) return;
    const a = angle();
    ref.current.position.set(Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS - RADIUS);
    ref.current.rotation.y = a;
    const lift = hovered ? 1 : 0;
    inner.current.position.z = THREE.MathUtils.damp(inner.current.position.z, lift * 0.18, 6, delta);
    inner.current.scale.setScalar(THREE.MathUtils.damp(inner.current.scale.x, 1 + lift * 0.03, 6, delta));
    if (edge.current) {
      const focus = 1 - Math.min(Math.abs(a) / STEP, 1);
      edge.current.opacity = THREE.MathUtils.damp(edge.current.opacity, 0.25 + focus * 0.75 + lift * 0.3, 6, delta);
    }
  });

  return (
    <group ref={ref}>
      <group
        ref={inner}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setCursorLabel(isFront() ? "Open" : "View");
        }}
        onPointerOut={() => {
          setHovered(false);
          setCursorLabel(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setCursorLabel(null);
          if (isFront()) openProject(index);
          else scrollToY(scrollState.workTargets[index]);
        }}
      >
        <RoundedBox args={[W, H, 0.04]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial color="#0c0f16" roughness={0.35} metalness={0.15} clearcoat={0.35} clearcoatRoughness={0.35} envMapIntensity={0.35} transparent opacity={0.88} />
        </RoundedBox>
        {/* accent rule */}
        <mesh position={[-W / 2 + 0.34, H / 2 - 0.2, 0.025]}>
          <planeGeometry args={[0.44, 0.006]} />
          <meshBasicMaterial ref={edge} color={[2.2, 1.6, 0.9]} toneMapped={false} transparent />
        </mesh>
        <group position={[-W / 2 + 0.12, H / 2 - 0.12, 0.026]}>
          <Text font={SANS_MED} fontSize={0.07} color="#f2c27a" anchorX="left" anchorY="top" position={[0.5, 0.045, 0]}>
            {String(index + 1).padStart(2, "0")}
          </Text>
          <Text font={SANS_MED} fontSize={0.058} letterSpacing={0.18} color="#8a8f9c" anchorX="left" anchorY="top" position={[0, -0.22, 0]}>
            {project.client.toUpperCase()}
          </Text>
          <Text font={SERIF} fontSize={0.17} color="#f1ede6" anchorX="left" anchorY="top" maxWidth={W - 0.3} lineHeight={1.05} position={[0, -0.32, 0]}>
            {project.name}
          </Text>
          <Text font={SANS} fontSize={0.07} color="#a3a8b4" anchorX="left" anchorY="top" maxWidth={W - 0.35} lineHeight={1.45} position={[0, -0.76, 0]}>
            {project.summary}
          </Text>
          <Text font={SANS_MED} fontSize={0.058} color="#f1ede6" anchorX="left" anchorY="bottom" position={[0, -H + 0.24, 0]}>
            {project.role}
          </Text>
          <Text font={SANS_MED} fontSize={0.058} color="#f2c27a" anchorX="right" anchorY="bottom" position={[W - 0.24, -H + 0.24, 0]}>
            {"Open case  →"}
          </Text>
        </group>
      </group>
    </group>
  );
}

/**
 * Curved carousel of project panels, carried in front of the camera while the work section is pinned.
 * Scroll turns it; the front panel opens the case study.
 */
export default function WorkGallery() {
  const { camera } = useThree();
  const rig = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  const active = useUi((s) => s.activeProject);

  useFrame((_, delta) => {
    const r = rig.current;
    const g = group.current;
    if (!r || !g) return;
    r.position.copy(camera.position);
    r.quaternion.copy(camera.quaternion);
    const vis = scrollState.workVis;
    const e = vis * vis * (3 - 2 * vis);
    r.visible = e > 0.01;
    // arrive from below, leave upward with the page
    g.position.y = (1 - e) * (scrollState.work >= 1 ? 2.4 : -2.4);
    g.position.z = THREE.MathUtils.damp(g.position.z, active !== null ? -7.2 : -5.6, 4, delta);
    g.scale.setScalar(0.85 + e * 0.15);
  });

  return (
    <group ref={rig}>
      <group ref={group} position={[0, -2.4, -5.6]}>
        {projects.map((p, i) => (
          <Panel key={p.name} index={i} />
        ))}
      </group>
    </group>
  );
}
