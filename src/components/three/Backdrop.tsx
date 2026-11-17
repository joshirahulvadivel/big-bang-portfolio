"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/store";
import { ramp } from "@/lib/story";

const DIST = 48;

/**
 * The night sky: a starfield, a faint Milky Way band and Webb's First Deep Field far behind.
 * None of it exists before the first stars, so it fades in from story chapter 2.
 */
export default function Backdrop({ animate, phone }: { animate: boolean; phone: boolean }) {
  const { camera } = useThree();
  const deep = useLoader(THREE.TextureLoader, "/space/deep-field-2048.jpg");
  const sky = useRef<THREE.Group>(null);
  const facing = useRef<THREE.Group>(null);
  const plane = useRef<THREE.Mesh>(null);
  const band = useRef<THREE.Points>(null);
  const field = useRef<THREE.Points>(null);

  useMemo(() => {
    deep.colorSpace = THREE.SRGBColorSpace;
  }, [deep]);

  const aspect = deep.image ? deep.image.width / deep.image.height : 1;
  const width = 72;

  const bandGeo = useMemo(() => {
    const n = phone ? 2500 : 6000;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const off = (Math.random() + Math.random() + Math.random() - 1.5) * 0.22;
      const r = 40;
      // great circle tilted across the sky
      const x = Math.cos(a) * r;
      const y = off * r;
      const z = Math.sin(a) * r;
      const t = 0.5;
      pos.set([x, y * Math.cos(t) - z * Math.sin(t), y * Math.sin(t) + z * Math.cos(t)], i * 3);
      const warm = Math.random();
      col.set([0.75 + warm * 0.25, 0.75 + warm * 0.1, 1 - warm * 0.25], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [phone]);

  const fieldGeo = useMemo(() => {
    const n = phone ? 1500 : 3200;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      v.randomDirection().multiplyScalar(44);
      pos.set([v.x, v.y, v.z], i * 3);
      const b = 0.5 + Math.random() * 0.5;
      col.set([b, b, b * (0.9 + Math.random() * 0.2)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [phone]);

  const dot = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((_, delta) => {
    // the sky travels with the camera so it never runs out
    if (sky.current) sky.current.position.copy(camera.position);
    if (facing.current) facing.current.quaternion.copy(camera.quaternion);
    const st = scrollState.story;
    const starlight = ramp(st, 1.9, 2.7);
    if (sky.current) sky.current.visible = starlight > 0.002;
    if (plane.current) {
      plane.current.position.y = THREE.MathUtils.damp(plane.current.position.y, st * 1.4 - 6, 2, delta);
      (plane.current.material as THREE.MeshBasicMaterial).opacity = 0.07 * starlight;
    }
    if (band.current) {
      (band.current.material as THREE.PointsMaterial).opacity = 0.55 * starlight;
      if (animate) band.current.rotation.y += delta * 0.004;
    }
    if (field.current) {
      (field.current.material as THREE.PointsMaterial).opacity = 0.9 * starlight;
      if (animate) field.current.rotation.y += delta * 0.006;
    }
  });

  return (
    <group ref={sky}>
      <group ref={facing}>
      <mesh ref={plane} position={[0, -4, -DIST]}>
        <planeGeometry args={[width, width / aspect]} />
        <meshBasicMaterial map={deep} color="#9aa3b5" transparent opacity={0.06} depthWrite={false} toneMapped={false} />
      </mesh>
      </group>
      <points ref={field} geometry={fieldGeo}>
        <pointsMaterial size={0.22} map={dot} vertexColors transparent opacity={0} depthWrite={false} sizeAttenuation blending={THREE.AdditiveBlending} />
      </points>
      <points ref={band} geometry={bandGeo}>
        <pointsMaterial size={0.16} map={dot} vertexColors transparent opacity={0.55} depthWrite={false} sizeAttenuation blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}
