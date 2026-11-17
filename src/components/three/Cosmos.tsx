"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ramp, window4 } from "@/lib/story";
import { scrollState } from "@/lib/store";

/**
 * The early universe as one particle system whose state follows story time:
 * a singularity, the Big Bang expansion, hot plasma cooling to the dark ages,
 * gas collapsing into the first stars, then the cosmic web of filaments and galaxies.
 */

const vertexShader = /* glsl */ `
  attribute vec4 aDir;      // xyz unit direction, w radius fraction (uniform ball)
  attribute vec3 aCluster;  // where the gas falls when the first stars form
  attribute vec3 aWeb;      // position on the cosmic web
  attribute vec4 aRand;
  attribute float aStar;    // 1 for particles that ignite as stars, 2 for galaxy cores
  uniform float uBang; uniform float uT; uniform float uTime; uniform float uPixelRatio; uniform float uSize;
  uniform sampler2D uCmb;
  varying vec3 vColor; varying float vAlpha;

  vec3 cmbColor(vec3 d) {
    vec2 uv = vec2(atan(d.z, d.x) / 6.28318 + 0.5, 0.5 + asin(clamp(d.y, -1.0, 1.0)) / 3.14159);
    return texture2D(uCmb, uv).rgb;
  }

  void main() {
    // 1. expansion: everything starts at one point, flies outward, keeps slowly expanding
    float bang = 1.0 - pow(1.0 - clamp(uBang, 0.0, 1.0), 4.0);
    float R = bang * 9.0 * (1.0 + 0.06 * uT);
    // turbulent shells and swirls rather than an even fog
    float swirl = sin(dot(aDir.xyz, vec3(3.1, 4.7, 2.3)) * 2.0 + aDir.w * 6.0 + uTime * 0.15);
    vec3 p = aDir.xyz * aDir.w * R * (1.0 + 0.22 * swirl);
    p += 0.15 * vec3(sin(uTime * 0.3 + aRand.y * 30.0), cos(uTime * 0.25 + aRand.z * 30.0), sin(uTime * 0.2 + aRand.x * 30.0)) * bang;

    // 2. gas collapses toward clumps, 3. clumps stretch into filaments
    float collapse = smoothstep(1.55 + aRand.x * 0.25, 2.35 + aRand.x * 0.25, uT);
    p = mix(p, aCluster, collapse);
    float web = smoothstep(2.55 + aRand.y * 0.2, 3.25 + aRand.y * 0.2, uT);
    p = mix(p, aWeb, web);

    // temperature: white hot after the bang, cooling through gold and red
    float heat = (1.0 - smoothstep(0.0, 1.1, uT)) * (0.75 + 0.25 * bang);
    float tint = aRand.z;
    vec3 white = vec3(1.5, 1.25, 0.9);
    vec3 gold = mix(vec3(1.35, 0.72, 0.28), vec3(1.1, 0.45, 0.16), tint);
    vec3 ember = mix(vec3(0.7, 0.16, 0.08), vec3(0.45, 0.12, 0.2), tint);
    vec3 hot = heat > 0.5 ? mix(gold, white, (heat - 0.5) * 2.0 * (0.4 + 0.6 * tint)) : mix(ember, gold, heat * 2.0);
    // at first light the gas carries the afterglow pattern, then goes dark
    float glow = smoothstep(0.55, 0.95, uT) * (1.0 - smoothstep(1.25, 1.75, uT));
    vec3 col = mix(hot, cmbColor(aDir.xyz) * 0.9, glow * 0.75);
    float dark = smoothstep(1.3, 1.8, uT);
    col = mix(col, vec3(0.16, 0.18, 0.26), dark);
    float a = mix(0.32 + 0.25 * (1.0 - tint), 0.2, dark) * (0.6 + 0.4 * (0.5 + 0.5 * swirl));
    float size = mix(1.25, 0.75, dark);

    // first stars: staggered ignition with a brief flare
    if (aStar > 0.5) {
      float s0 = 2.0 + aRand.w * 0.45;
      float ig = smoothstep(s0, s0 + 0.06, uT);
      float flare = ig * (1.0 - smoothstep(s0 + 0.06, s0 + 0.35, uT));
      vec3 starCol = aStar > 1.5 ? vec3(1.6, 1.15, 0.7) : vec3(0.95, 1.1, 1.6);
      col = mix(col, starCol * (1.0 + flare * 1.6), ig);
      a = mix(a, 1.0, ig);
      size = mix(size, 1.9 + flare * 2.2, ig);
    }
    // the web's filaments read faint blue-violet, its knots warm
    vec3 webCol = aStar > 0.5 ? col : vec3(0.42, 0.45, 0.85);
    col = mix(col, webCol, web * 0.8);
    a = mix(a, aStar > 0.5 ? a : 0.38, web);

    // a few particles become large faint glows: the plasma reads as a luminous haze, not specks
    float haze = step(aRand.x, 0.035) * (1.0 - collapse);
    size *= 1.0 + haze * 7.0;
    a *= 1.0 - haze * 0.86;

    // a bright point before the bang
    float singular = 1.0 - smoothstep(0.0, 0.06, uBang);
    col = mix(col, vec3(4.0, 3.6, 3.0), singular);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float s = uSize * size * (0.6 + aRand.w * 0.8) * uPixelRatio / max(0.5, -mv.z);
    gl_PointSize = min(s, mix(18.0, 110.0, haze) * uPixelRatio) + singular * 6.0 * uPixelRatio;
    vColor = col;
    vAlpha = a * smoothstep(1.4, 5.0, -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = pow(1.0 - d * 2.0, 1.8);
    gl_FragColor = vec4(vColor, soft * vAlpha * uOpacity);
  }
`;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

/** Builds every particle's direction, clump target and web target. */
function buildUniverse(n: number) {
  const r = rng(21);
  // clump seeds where the first stars form, inside a box in front of the camera
  const seeds = Array.from({ length: 70 }, () => new THREE.Vector3(0.8 + r() * 6.5, (r() - 0.5) * 5.5, -2 - r() * 7));
  // cosmic web: nodes joined to their nearest neighbours
  const nodes = Array.from({ length: 26 }, () => new THREE.Vector3(0.3 + r() * 8, (r() - 0.5) * 6, -2 - r() * 7));
  const edges: [number, number][] = [];
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: a.distanceTo(b) }))
      .filter((o) => o.j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 3)
      .forEach((o) => {
        if (!edges.some(([p, q]) => (p === i && q === o.j) || (p === o.j && q === i))) edges.push([i, o.j]);
      });
  });

  const dir = new Float32Array(n * 4);
  const cluster = new Float32Array(n * 3);
  const webPos = new Float32Array(n * 3);
  const rand = new Float32Array(n * 4);
  const star = new Float32Array(n);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.set(gauss(r), gauss(r), gauss(r)).normalize();
    dir.set([v.x, v.y, v.z, Math.cbrt(r())], i * 4);
    const seed = seeds[Math.floor(r() * seeds.length)];
    const spread = 0.12 + Math.pow(r(), 2) * 0.6;
    cluster.set([seed.x + gauss(r) * spread, seed.y + gauss(r) * spread, seed.z + gauss(r) * spread], i * 3);
    const isStar = r() < 0.035;
    if (isStar) cluster.set([seed.x + gauss(r) * 0.05, seed.y + gauss(r) * 0.05, seed.z + gauss(r) * 0.05], i * 3);
    // web: most particles along filaments, some in the knots (galaxies)
    let knot = false;
    if (r() < 0.22) {
      const nd = nodes[Math.floor(r() * nodes.length)];
      webPos.set([nd.x + gauss(r) * 0.18, nd.y + gauss(r) * 0.12, nd.z + gauss(r) * 0.18], i * 3);
      knot = true;
    } else {
      const [a, b] = edges[Math.floor(r() * edges.length)];
      const t = r();
      const p = nodes[a].clone().lerp(nodes[b], t);
      const thick = 0.05 + Math.sin(t * Math.PI) * 0.06;
      webPos.set([p.x + gauss(r) * thick, p.y + gauss(r) * thick, p.z + gauss(r) * thick], i * 3);
    }
    star[i] = isStar ? 1 : knot && r() < 0.35 ? 2 : 0;
    rand.set([r(), r(), r(), r()], i * 4);
  }
  return { dir, cluster, webPos, rand, star };
}

export default function Cosmos({ phone }: { phone: boolean }) {
  const { gl } = useThree();
  const cmb = useLoader(THREE.TextureLoader, "/space/cmb-2048.jpg");
  const group = useRef<THREE.Group>(null);
  const sky = useRef<THREE.Mesh>(null);
  const count = phone ? 22000 : 46000;

  useMemo(() => {
    cmb.colorSpace = THREE.SRGBColorSpace;
  }, [cmb]);

  const geometry = useMemo(() => {
    const u = buildUniverse(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aDir", new THREE.BufferAttribute(u.dir, 4));
    g.setAttribute("aCluster", new THREE.BufferAttribute(u.cluster, 3));
    g.setAttribute("aWeb", new THREE.BufferAttribute(u.webPos, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(u.rand, 4));
    g.setAttribute("aStar", new THREE.BufferAttribute(u.star, 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uBang: { value: 0 },
          uT: { value: 0 },
          uTime: { value: 0 },
          uPixelRatio: { value: gl.getPixelRatio() },
          uSize: { value: phone ? 16 : 20 },
          uOpacity: { value: 1 },
          uCmb: { value: cmb },
        },
      }),
    [cmb, gl, phone],
  );

  useFrame((state) => {
    const t = scrollState.story;
    const u = material.uniforms;
    u.uBang.value = scrollState.bang;
    u.uT.value = t;
    u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    // leaving: the camera dives into one galaxy, the web grows and fades
    const leave = ramp(t, 3.45, 4.2);
    u.uOpacity.value = (1 - leave) * (phone && t > 0.6 ? 0.55 : 1);
    if (group.current) {
      group.current.visible = leave < 0.999;
      group.current.scale.setScalar(1 + leave * 2.2);
      group.current.position.set(0, 0, leave * 3);
    }
    if (sky.current) {
      // the afterglow surrounds the viewer at first light, then the universe goes transparent
      const m = sky.current.material as THREE.MeshBasicMaterial;
      m.opacity = window4(t, 0.5, 0.95, 1.25, 1.7) * (phone ? 0.08 : 0.11);
      sky.current.visible = m.opacity > 0.002;
      sky.current.position.copy(state.camera.position);
      sky.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <>
      <group ref={group}>
        <points geometry={geometry} material={material} frustumCulled={false} />
      </group>
      <mesh ref={sky}>
        <sphereGeometry args={[40, 64, 32]} />
        <meshBasicMaterial map={cmb} transparent opacity={0} depthWrite={false} toneMapped={false} side={THREE.BackSide} />
      </mesh>
    </>
  );
}
