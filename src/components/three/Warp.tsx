"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { storyFx } from "@/lib/story";

const COUNT = 700;
const NEAR = -1.5;
const FAR = -70;

/** Star streaks around the camera that stretch with how fast story time moves and vanish at rest. */
export default function Warp({ animate }: { animate: boolean }) {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.LineBasicMaterial>(null);

  const { geometry, stars } = useMemo(() => {
    const stars = Array.from({ length: COUNT }, () => {
      const a = Math.random() * Math.PI * 2;
      const r = 2.2 + Math.pow(Math.random(), 0.7) * 16;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.75, z: FAR + Math.random() * (NEAR - FAR) };
    });
    const pos = new Float32Array(COUNT * 6);
    const col = new Float32Array(COUNT * 6);
    for (let i = 0; i < COUNT; i++) {
      const warm = Math.random() < 0.25;
      const c = warm ? [1, 0.82, 0.55] : [0.7, 0.8, 1];
      col.set([...c.map((v) => v * 0.15), ...c], i * 6); // tail dim, head bright
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geometry: g, stars };
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || !mat.current) return;
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);
    const speed = animate ? storyFx.speed : 0;
    const strength = THREE.MathUtils.smoothstep(speed, 3, 30);
    mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, strength * 0.75, 6, delta);
    g.visible = mat.current.opacity > 0.01;
    if (!g.visible) return;
    const len = Math.min(speed * 0.09, 9);
    const arr = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const s = stars[i];
      s.z += speed * Math.min(delta, 0.05) * 0.9;
      if (s.z > NEAR) s.z = FAR + Math.random() * 10;
      arr[i * 6] = s.x;
      arr[i * 6 + 1] = s.y;
      arr[i * 6 + 2] = s.z - len;
      arr[i * 6 + 3] = s.x;
      arr[i * 6 + 4] = s.y;
      arr[i * 6 + 5] = s.z;
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial ref={mat} vertexColors transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
}
