"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { globe } from "@/content/site";
import { latLngToXYZ } from "@/lib/shapes";
import { scrollState } from "@/lib/store";
import { labelEls } from "@/lib/labels";

const WARM = "#f2c27a";
const COOL = "#9db4e0";

const v3 = (lat: number, lng: number, r = 1.004) => new THREE.Vector3(...latLngToXYZ(lat, lng, r));

/** The client arcs and tags belong to the final chapter, "Now", and clear away for the closing call to action. */
const globeVisibility = () => THREE.MathUtils.smoothstep(scrollState.story, 5.75, 6.0) * (1 - THREE.MathUtils.smoothstep(scrollState.tail, 0.05, 0.35));

type LineHandle = { material: THREE.Material & { opacity: number; dashOffset: number } };

function Arc({ from, to, delay, animate }: { from: THREE.Vector3; to: THREE.Vector3; delay: number; animate: boolean }) {
  const base = useRef<LineHandle>(null);
  const dash = useRef<LineHandle>(null);
  const pulse = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const lift = 1 + from.distanceTo(to) * 0.5;
    const c1 = from.clone().lerp(to, 0.25).normalize().multiplyScalar(lift);
    const c2 = from.clone().lerp(to, 0.75).normalize().multiplyScalar(lift);
    return new THREE.CubicBezierCurve3(from, c1, c2, to);
  }, [from, to]);
  const points = useMemo(() => curve.getPoints(90), [curve]);

  useFrame(({ clock }, delta) => {
    const vis = globeVisibility();
    if (base.current) base.current.material.opacity = 0.18 * vis;
    if (dash.current) {
      dash.current.material.opacity = 0.95 * vis;
      if (animate) dash.current.material.dashOffset -= delta * 0.3;
    }
    if (pulse.current) {
      pulse.current.visible = vis > 0.01;
      const t = animate ? (((clock.elapsedTime * 0.22 + delay) % 1) + 1) % 1 : 0.6;
      pulse.current.position.copy(curve.getPoint(t));
      pulse.current.scale.setScalar(vis);
    }
  });

  return (
    <group>
      <Line ref={base as never} points={points} color={WARM} lineWidth={1} transparent opacity={0.18} depthWrite={false} />
      <Line ref={dash as never} points={points} color={WARM} lineWidth={1.4} dashed dashSize={0.05} gapSize={0.06} transparent depthWrite={false} />
      <mesh ref={pulse}>
        <sphereGeometry args={[0.014, 12, 12]} />
        <meshBasicMaterial color={[3, 2.4, 1.6]} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Marker({ at, labelIndex, color, animate }: { at: THREE.Vector3; labelIndex: number; color: string; animate: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const dot = useRef<THREE.Mesh>(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  const center = useMemo(() => new THREE.Vector3(), []);
  const toCam = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), at.clone().normalize()),
    [at],
  );

  useFrame(({ clock, camera, size }) => {
    const vis = globeVisibility();
    if (ring.current) {
      const t = animate ? (clock.elapsedTime * 0.7) % 1 : 0.3;
      ring.current.scale.setScalar(1 + t * 2.4);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t) * vis;
    }
    if (dot.current) (dot.current.material as THREE.MeshBasicMaterial).opacity = vis;
    const tag = labelEls[labelIndex];
    if (tag && dot.current) {
      dot.current.getWorldPosition(world);
      dot.current.parent!.parent!.getWorldPosition(center);
      const normal = world.clone().sub(center).normalize();
      const facing = normal.dot(toCam.copy(camera.position).sub(world).normalize());
      const screen = world.clone().project(camera);
      const x = ((screen.x + 1) / 2) * size.width;
      const y = ((1 - screen.y) / 2) * size.height;
      const dx = Number(tag.dataset.dx ?? 12);
      const dy = Number(tag.dataset.dy ?? 0);
      const shift = tag.dataset.side === "left" ? "-100%" : "0%";
      tag.style.transform = `translate3d(${x + dx}px, ${y + dy}px, 0) translate(${shift}, -50%)`;
      tag.style.opacity = String(THREE.MathUtils.smoothstep(facing, 0.15, 0.45) * vis);
    }
  });

  return (
    <group position={at} quaternion={quaternion}>
      <mesh ref={dot}>
        <circleGeometry args={[0.012, 24]} />
        <meshBasicMaterial color={color} transparent toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.016, 0.021, 40]} />
        <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function GlobeDetails({ animate }: { animate: boolean }) {
  const home = useMemo(() => v3(globe.home.lat, globe.home.lng), []);
  const links = useMemo(() => globe.links.map((l) => v3(l.lat, l.lng)), []);
  return (
    <group>
      <group>
        <Marker at={home} labelIndex={0} color={WARM} animate={animate} />
      </group>
      {globe.links.map((l, i) => (
        <group key={l.name}>
          <Arc from={home} to={links[i]} delay={i / links.length} animate={animate} />
          <Marker at={links[i]} labelIndex={i + 1} color={COOL} animate={animate} />
        </group>
      ))}
    </group>
  );
}
