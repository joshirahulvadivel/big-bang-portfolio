"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { imageShape, readPixels, DEG } from "@/lib/shapes";
import { ramp, storyFx, window4 } from "@/lib/story";
import { scrollState, useUi } from "@/lib/store";
import { flashEl } from "@/lib/labels";
import Cosmos from "./Cosmos";
import Earth, { SUN, earthFx } from "./Earth";
import GlobeDetails from "./GlobeDetails";

const INTRO_SECONDS = 4.2;
const SINGULARITY = 0.16; // share of the intro spent on the swelling point before the bang
const EARTH_Y = -(52 + 90) * DEG; // faces the Earth toward the India–Europe midpoint
const SUN_DAY = new THREE.Vector3(-0.35, 0.3, 0.88).normalize();
const SUN_DUSK = new THREE.Vector3(-0.85, 0.3, 0.45).normalize();

const diskVertex = /* glsl */ `
  attribute float aBright;
  attribute vec4 aRand;
  attribute vec4 aDisk; // radius, start angle, height, inner heat
  uniform float uTime; uniform float uSize; uniform float uPixelRatio; uniform float uCollapse;
  varying float vBright; varying vec3 vColor; varying float vNear;
  void main() {
    // Keplerian disk: inner material orbits faster
    float ang = aDisk.y + uTime * 0.32 / pow(max(aDisk.x, 0.15), 1.5);
    vec3 disk = vec3(cos(ang) * aDisk.x, aDisk.z, sin(ang) * aDisk.x);
    // tilt the disk toward the viewer
    float ct = cos(1.1), st = sin(1.1);
    disk = vec3(disk.x, disk.y * ct - disk.z * st, disk.y * st + disk.z * ct);
    // each particle falls in at its own moment, spiralling as it goes
    float c = smoothstep(aRand.x * 0.45, 0.55 + aRand.x * 0.45, uCollapse);
    float twist = (1.0 - c) * c * 3.0;
    vec3 neb = position;
    vec3 swirl = vec3(neb.x * cos(twist) - neb.z * sin(twist), neb.y, neb.x * sin(twist) + neb.z * cos(twist));
    vec3 p = mix(swirl, disk, c);
    p += 0.008 * vec3(sin(uTime * 1.1 + aRand.y * 40.0), cos(uTime * 0.9 + aRand.z * 40.0), 0.0);

    vec3 diskCol = mix(vec3(0.55, 0.36, 0.3), vec3(1.6, 1.05, 0.55), aDisk.w);
    vColor = mix(color, diskCol, c);
    vBright = mix(aBright, 0.35 + aDisk.w * 0.6, c);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * (0.6 + aRand.w * 0.8) * (0.55 + vBright * 0.75) * uPixelRatio / -mv.z, 36.0 * uPixelRatio);
    vNear = smoothstep(1.2, 4.5, -mv.z);
  }
`;
const diskFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vBright; varying vec3 vColor; varying float vNear;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor * (0.55 + vBright * 0.9), pow(1.0 - d * 2.0, 1.6) * uOpacity * vNear * (0.35 + vBright * 0.65));
  }
`;

/** Soft round glow texture for the young Sun's corona. */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,240,210,1)");
    g.addColorStop(0.25, "rgba(255,190,110,0.55)");
    g.addColorStop(1, "rgba(255,140,60,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
}

/**
 * Chapter 4, the Sun: the Carina Nebula arrives out of the galaxy, collapses into a spinning
 * disk while the projects are browsed, and the young Sun ignites at its centre.
 */
function SunChapter({ phone }: { phone: boolean }) {
  const img = useLoader(THREE.ImageLoader, "/space/carina-720.jpg");
  const group = useRef<THREE.Group>(null);
  const sun = useRef<THREE.Group>(null);
  const corona = useRef<THREE.Sprite>(null);
  const glow = useGlowTexture();

  const geometry = useMemo(() => {
    const shape = imageShape(phone ? 8000 : 16000, readPixels(img), { width: 4.4, depth: 1.0, gamma: 1.4, floor: 0.08, seed: 11, boost: 1.9 });
    const n = shape.pos.length / 4;
    const pos = new Float32Array(n * 3);
    const bright = new Float32Array(n);
    const disk = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos.set([shape.pos[i * 4], shape.pos[i * 4 + 1], shape.pos[i * 4 + 2]], i * 3);
      bright[i] = shape.pos[i * 4 + 3];
      // radius with two cleared gaps where planets are forming
      let r = 0;
      do r = 0.18 + Math.pow(Math.random(), 0.75) * 2.1;
      while ((r > 0.85 && r < 0.97) || (r > 1.42 && r < 1.52));
      const h = (Math.random() - 0.5) * 0.05 * r;
      disk.set([r, Math.random() * Math.PI * 2, h, Math.max(0, 1 - r / 1.3)], i * 4);
    }
    const rand = new Float32Array(n * 4).map(() => Math.random());
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(shape.col, 3));
    g.setAttribute("aBright", new THREE.BufferAttribute(bright, 1));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    g.setAttribute("aDisk", new THREE.BufferAttribute(disk, 4));
    return g;
  }, [img, phone]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: diskVertex,
        fragmentShader: diskFragment,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uSize: { value: phone ? 15 : 20 }, uPixelRatio: { value: 1 }, uOpacity: { value: 0 }, uCollapse: { value: 0 } },
      }),
    [phone],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = scrollState.story;
    const vis = window4(t, 3.45, 4.0, 4.55, 5.1);
    g.visible = vis > 0.003;
    if (!g.visible) return;
    const arrive = ramp(t, 3.45, 4.1);
    const leave = ramp(t, 4.55, 5.1);
    g.scale.setScalar(1.1 * (0.35 + 0.65 * arrive) * (1 + leave * 2.5));
    g.position.set(phone ? 0 : 1.7, 0.15, (phone ? -2.6 : -1.6) - (1 - arrive) * 6 + leave * 4);

    // the collapse plays out while the project panels are browsed
    const collapse = ramp(t, 3.9, 4.1);
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uOpacity.value = vis * (phone ? 0.4 : 0.9);
    u.uCollapse.value = collapse;

    // ignition: the Sun swells with a brief flare once most of the gas has fallen in
    // and fades before the camera flies through on the way to Earth
    const ignite = ramp(t, 4.02, 4.1) * (1 - ramp(t, 4.35, 4.6));
    const flare = window4(t, 4.02, 4.06, 4.07, 4.12);
    if (sun.current) {
      sun.current.visible = ignite > 0.01;
      sun.current.scale.setScalar(0.04 + 0.12 * ignite + 0.06 * flare);
    }
    if (corona.current) {
      corona.current.scale.setScalar((0.9 + 1.4 * flare) * ignite * (1 + 0.04 * Math.sin(state.clock.elapsedTime * 2)));
      corona.current.visible = ignite > 0.01;
      (corona.current.material as THREE.SpriteMaterial).opacity = ignite * (phone ? 0.5 : 0.9) * vis;
    }
  });

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <group ref={sun} visible={false}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color={[4, 2.9, 1.6]} toneMapped={false} />
        </mesh>
      </group>
      <sprite ref={corona}>
        <spriteMaterial map={glow} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
    </group>
  );
}

const debrisVertex = /* glsl */ `
  attribute vec4 aRing; // start angle, radius, height, orbit speed
  attribute vec4 aRand;
  uniform float uDebris; uniform float uTime; uniform vec3 uImpactPos; uniform vec3 uMoonPos; uniform float uPixelRatio;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float burst = 1.0 - pow(1.0 - smoothstep(0.0, 0.35, uDebris), 3.0);
    float gather = smoothstep(0.35 + aRand.x * 0.2, 1.0, uDebris);
    float ang = aRing.x + uTime * aRing.w;
    vec3 ring = vec3(cos(ang) * aRing.y, aRing.z, sin(ang) * aRing.y);
    float ct = cos(0.35), st = sin(0.35);
    ring = vec3(ring.x, ring.y * ct - ring.z * st, ring.y * st + ring.z * ct);
    vec3 p = mix(uImpactPos, ring, burst);
    p = mix(p, uMoonPos + (aRand.xyz - 0.5) * 0.12 * (1.0 - gather), gather * gather);
    vColor = mix(vec3(2.4, 0.9, 0.25), vec3(0.75, 0.68, 0.6), smoothstep(0.1, 0.6, uDebris));
    vAlpha = smoothstep(0.0, 0.03, uDebris) * (1.0 - smoothstep(0.88, 1.0, uDebris));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + aRand.w * 3.0) * uPixelRatio * (3.0 / -mv.z) * (1.0 + (1.0 - burst) * 1.5);
  }
`;
const debrisFragment = /* glsl */ `
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, pow(1.0 - d * 2.0, 1.5) * vAlpha);
  }
`;

/** The Moon-forming impact: the incoming body, then the debris ring that gathers into the Moon. */
function Impact({ phone }: { phone: boolean }) {
  const theia = useRef<THREE.Mesh>(null);
  // the impactor borrows the Moon map, tinted darker and redder, for a cratered rocky surface
  const rock = useLoader(THREE.TextureLoader, "/space/moon-1024.jpg");
  const start = useMemo(() => new THREE.Vector3(), []);
  const geometry = useMemo(() => {
    const n = phone ? 1800 : 3500;
    const ring = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const r = 1.7 + Math.pow(Math.random(), 0.6) * 1.0;
      ring.set([Math.random() * Math.PI * 2, r, (Math.random() - 0.5) * 0.12, 0.35 / Math.pow(r, 1.5)], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("aRing", new THREE.BufferAttribute(ring, 4));
    g.setAttribute("aRand", new THREE.BufferAttribute(new Float32Array(n * 4).map(() => Math.random()), 4));
    return g;
  }, [phone]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: debrisVertex,
        fragmentShader: debrisFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uDebris: { value: 0 },
          uTime: { value: 0 },
          uImpactPos: { value: new THREE.Vector3() },
          uMoonPos: { value: earthFx.moonPos },
          uPixelRatio: { value: 1 },
        },
      }),
    [],
  );

  useFrame((state) => {
    const t = scrollState.story;
    // the impactor comes in from the upper left and strikes the facing side
    const approach = ramp(t, 4.85, 5.07);
    const contact = earthFx.impactDir.clone().multiplyScalar(1.25);
    start.copy(earthFx.impactorStart);
    if (theia.current) {
      theia.current.visible = approach > 0.001 && approach < 0.999;
      theia.current.position.lerpVectors(start, contact, approach);
      theia.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
    const u = material.uniforms;
    u.uDebris.value = Math.min(1, Math.max(0, (t - 5.07) / 0.43));
    u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    (u.uImpactPos.value as THREE.Vector3).copy(earthFx.impactDir).multiplyScalar(1.02);
  });

  return (
    <>
      <mesh ref={theia} visible={false}>
        <sphereGeometry args={[0.4, 48, 48]} />
        <meshStandardMaterial map={rock} color="#9a6a55" emissive="#7a2208" emissiveIntensity={0.25} roughness={1} metalness={0} envMapIntensity={0.05} />
      </mesh>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </>
  );
}

/**
 * Chapters 5 and 6: the young Earth arrives molten, is struck by a Mars-sized body whose debris
 * becomes the Moon, cools into the Blue Marble, then turns to dusk with the client arcs.
 */
function EarthChapter({ phone, animate }: { phone: boolean; animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const tmp = useMemo(() => ({ q: new THREE.Quaternion(), dir: new THREE.Vector3() }), []);
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = scrollState.story;
    const arrive = ramp(t, 4.55, 5.0);
    g.visible = arrive > 0.002;
    if (!g.visible) return;
    const s = (phone ? 1.0 : 1.35) * (0.05 + 0.95 * arrive);
    g.scale.setScalar(s);
    // as the page closes, Earth drifts back so the final call to action has the stage
    const tail = ramp(scrollState.tail, 0.1, 0.7);
    g.position.set((phone ? 0 : 1.55) + tail * (phone ? 0 : 4.6), (phone ? -1.55 : -0.05) + tail * (phone ? 0.9 : 1.9), (phone ? -0.4 : 0) - (1 - arrive) * 14 - tail * 9);
    const sway = animate ? Math.sin(state.clock.elapsedTime * 0.1) * 0.15 : 0;
    // spins into place as it arrives
    const spin = (1 - arrive) * 2.4;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, EARTH_Y + sway + spin + state.pointer.x * 0.15, 3, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.42 - state.pointer.y * 0.08, 3, delta);

    // formation: molten, struck, the Moon gathers, the surface cools
    earthFx.molten = 1 - ramp(t, 5.25, 5.7);
    earthFx.impact = window4(t, 5.06, 5.09, 5.12, 5.35);
    earthFx.moonVis = ramp(t, 5.45, 5.55);
    // impact point: the upper-left of the side facing the camera, in Earth-local coordinates
    tmp.q.copy(g.quaternion).invert();
    tmp.dir.set(-0.55, 0.45, 0.7).normalize().applyQuaternion(tmp.q);
    earthFx.impactDir.copy(tmp.dir);
    // the impactor starts up-left and slightly behind, as seen on screen, converted to Earth-local
    earthFx.impactorStart.set(-4.2, 2.4, -2.5).applyQuaternion(tmp.q);

    // daylight while it forms, dusk over India for "now"
    SUN.copy(SUN_DAY).lerp(SUN_DUSK, ramp(t, 5.65, 6)).normalize();
  });
  return (
    <group ref={group} visible={false}>
      <Earth dayUrl={phone ? "/space/earth-day-2048.jpg" : "/space/earth-day-4096.jpg"} animate={animate} opacity={phone ? 0.35 : 1} />
      <Impact phone={phone} />
      <GlobeDetails animate={animate} />
    </group>
  );
}

/**
 * Drives the whole story: the opening Big Bang, smoothed story time, camera shake and parallax,
 * and every chapter's 3D. Signals the loader once the first frame is drawn.
 */
export default function Story({ animate, phone }: { animate: boolean; phone: boolean }) {
  const { camera } = useThree();
  const setReady = useUi((s) => s.setReady);
  const introDone = useUi((s) => s.introDone);
  const st = useRef({ start: -1, signalled: false, prevT: 0 });

  useFrame((state, delta) => {
    const s = st.current;
    const dt = Math.min(delta, 0.05);
    if (!s.signalled) {
      s.signalled = true;
      setReady();
    }

    // opening: a swelling point, then the bang
    let flash = 0;
    let bangSpeed = 0;
    if (!animate) {
      scrollState.bang = 1;
    } else if (introDone) {
      if (s.start < 0) s.start = state.clock.elapsedTime;
      const k = (state.clock.elapsedTime - s.start) / INTRO_SECONDS;
      const prev = scrollState.bang;
      scrollState.bang = Math.min(1, Math.max(0, (k - SINGULARITY) / (1 - SINGULARITY)));
      bangSpeed = (scrollState.bang - prev) / Math.max(dt, 1e-3);
      const since = (k - SINGULARITY) * INTRO_SECONDS;
      flash = since > 0 ? Math.exp(-since * 2.6) : 0;
    }

    const prevT = scrollState.story;
    scrollState.story = animate ? THREE.MathUtils.damp(scrollState.story, scrollState.stage, 3.5, dt) : scrollState.stage;
    storyFx.speed = Math.abs(scrollState.story - prevT) / Math.max(dt, 1e-3) * 30 + bangSpeed * 40 * (1 - scrollState.bang);

    // camera: fixed station, pointer parallax, a jolt at the bang
    const shake = flash * 0.12;
    camera.position.set(
      (animate ? state.pointer.x * 0.25 : 0) + (Math.random() - 0.5) * shake,
      (animate ? state.pointer.y * 0.15 : 0) + (Math.random() - 0.5) * shake,
      6,
    );
    camera.lookAt(0, 0, -1);

    if (flashEl.current) flashEl.current.style.opacity = String(Math.min(1, flash * 1.1));
  }, -2);

  return (
    <>
      <Cosmos phone={phone} />
      <SunChapter phone={phone} />
      <EarthChapter phone={phone} animate={animate} />
    </>
  );
}
