"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

/** Direction the sunlight comes from (world space): upper left, so India sits near the evening terminator. */
export const SUN = new THREE.Vector3(-0.85, 0.3, 0.45).normalize();

/** Earth stays solid; its chapter group decides when it is shown. */
export const earthVisibility = () => 1;

/**
 * Formation state, set by the story each frame: how molten the surface is, the Moon-forming impact
 * flash and where it lands (Earth-local direction), and whether the Moon has formed yet.
 * The Moon's current position is published back for the debris to gather at.
 */
export const earthFx = {
  molten: 0,
  impact: 0,
  impactDir: new THREE.Vector3(0, 0, 1),
  /** Where the impactor starts (Earth-local, in Earth radii). */
  impactorStart: new THREE.Vector3(-6, 4, -4),
  moonVis: 1,
  moonPos: new THREE.Vector3(),
};

const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosObj;
  varying vec3 vViewW;
  void main() {
    vUv = uv;
    vPosObj = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vViewW = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const earthFragment = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform vec3 uSun;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uMolten;
  uniform float uImpact;
  uniform vec3 uImpactDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosObj;
  varying vec3 vViewW;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewW);
    float ndl = dot(N, uSun);
    float dayMix = smoothstep(-0.12, 0.28, ndl);

    vec3 day = pow(texture2D(uDay, vUv).rgb, vec3(2.2));
    vec3 nightTex = texture2D(uNight, vUv).rgb;
    float city = smoothstep(0.36, 0.8, dot(nightTex, vec3(0.299, 0.587, 0.114)));
    vec3 lights = vec3(1.0, 0.66, 0.32) * city * 2.2;

    // drifting procedural cloud cover
    vec3 q = normalize(vPosObj) * 3.2 + vec3(uTime * 0.012, 0.0, uTime * 0.006);
    float clouds = smoothstep(0.5, 0.78, fbm(q + fbm(q * 1.7) * 0.6)) * 0.85 * (1.0 - uMolten);

    float ocean = smoothstep(0.01, 0.06, day.b - day.r);
    vec3 H = normalize(uSun + V);
    float spec = pow(max(dot(N, H), 0.0), 70.0) * ocean * dayMix * (1.0 - clouds) * 0.9;

    vec3 color = day * (0.02 + 1.25 * max(ndl, 0.0));
    color = mix(color, vec3(0.92, 0.94, 1.0) * (0.02 + max(ndl, 0.0) * 1.1), clouds);
    color += lights * (1.0 - dayMix) * (1.0 - clouds * 0.85);
    color += vec3(1.0, 0.92, 0.8) * spec;

    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    color += vec3(0.3, 0.55, 1.0) * fres * (0.15 + 0.85 * smoothstep(-0.35, 0.45, ndl)) * 0.9;

    // the young Earth: dark crust split by glowing lava, cooling as uMolten falls
    if (uMolten > 0.001) {
      vec3 m = normalize(vPosObj) * 2.5;
      float n = fbm(m * 1.5 + uTime * 0.02);
      float crack = 1.0 - smoothstep(0.0, 0.06, abs(fbm(m * 3.0 + 7.0) - 0.5));
      float pulse = 0.65 + 0.35 * sin(uTime * 1.4 + n * 10.0);
      vec3 lava = vec3(0.09, 0.03, 0.02) * (0.5 + n)
        + vec3(2.4, 0.7, 0.12) * crack * pulse
        + vec3(0.55, 0.11, 0.02) * n * n
        + vec3(1.2, 0.35, 0.05) * fres * 0.9;
      color = mix(color, lava, uMolten);
    }
    // impact: a white-hot spot and a wider orange glow where the body strikes
    float d = acos(clamp(dot(normalize(vPosObj), uImpactDir), -1.0, 1.0));
    color += uImpact * (vec3(3.2, 2.4, 1.5) * exp(-d * d * 14.0) + vec3(1.6, 0.5, 0.1) * exp(-d * d * 2.2));

    gl_FragColor = vec4(color, uOpacity);
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 uSun;
  uniform float uOpacity;
  uniform float uMolten;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  void main() {
    // Back faces of a slightly larger shell: only the halo ring around the limb is visible.
    vec3 N = normalize(vNormalW);
    float glow = pow(clamp(-dot(N, normalize(vViewW)) * 2.6, 0.0, 1.0), 2.2);
    float lit = smoothstep(-0.45, 0.6, dot(N, uSun));
    vec3 tint = mix(vec3(0.32, 0.58, 1.0), vec3(1.0, 0.38, 0.1), uMolten);
    float light = mix(0.15 + lit * 0.85, 0.9, uMolten);
    gl_FragColor = vec4(tint * glow * light, 1.0) * uOpacity;
  }
`;

/** `opacity` below 1 turns the globe into a backdrop (used on phones, where text sits over it). */
export default function Earth({ dayUrl, animate, opacity = 1 }: { dayUrl: string; animate: boolean; opacity?: number }) {
  const [day, night, moonMap] = useLoader(THREE.TextureLoader, [dayUrl, "/space/earth-night-2048.jpg", "/space/moon-1024.jpg"]);
  const earthMat = useRef<THREE.ShaderMaterial>(null);
  const atmoMat = useRef<THREE.ShaderMaterial>(null);
  const moon = useRef<THREE.Mesh>(null);
  const moonMat = useRef<THREE.MeshStandardMaterial>(null);
  const group = useRef<THREE.Group>(null);

  useMemo(() => {
    [day, night].forEach((t) => {
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = 8;
    });
    moonMap.colorSpace = THREE.SRGBColorSpace;
  }, [day, night, moonMap]);

  const uniforms = useMemo(
    () => ({
      uDay: { value: day },
      uNight: { value: night },
      uSun: { value: SUN },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uMolten: { value: 0 },
      uImpact: { value: 0 },
      uImpactDir: { value: earthFx.impactDir },
    }),
    [day, night],
  );
  const atmoUniforms = useMemo(() => ({ uSun: { value: SUN }, uOpacity: { value: 1 }, uMolten: { value: 0 } }), []);

  useFrame(({ clock }) => {
    const vis = earthVisibility() * opacity;
    if (group.current) group.current.visible = vis > 0.005;
    if (earthMat.current) {
      earthMat.current.uniforms.uOpacity.value = vis;
      earthMat.current.uniforms.uTime.value = animate ? clock.elapsedTime : 0;
      earthMat.current.uniforms.uMolten.value = earthFx.molten;
      earthMat.current.uniforms.uImpact.value = earthFx.impact;
      earthMat.current.transparent = vis < 0.999;
      earthMat.current.depthWrite = vis > 0.5;
    }
    if (atmoMat.current) {
      atmoMat.current.uniforms.uOpacity.value = vis;
      atmoMat.current.uniforms.uMolten.value = earthFx.molten;
    }
    if (moonMat.current) moonMat.current.opacity = vis * earthFx.moonVis;
    if (moon.current) moon.current.visible = earthFx.moonVis > 0.01;
    if (moon.current) {
      const a = (animate ? clock.elapsedTime * 0.05 : 0) + 2.4;
      moon.current.position.set(Math.cos(a) * 2.3, 0.35 + Math.sin(a) * 0.25, Math.sin(a) * 2.3);
      moon.current.rotation.y = -a;
      earthFx.moonPos.copy(moon.current.position);
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1, 128, 128]} />
        <shaderMaterial ref={earthMat} vertexShader={earthVertex} fragmentShader={earthFragment} uniforms={uniforms} />
      </mesh>
      <mesh scale={1.07}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={atmoMat}
          vertexShader={earthVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmoUniforms}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={moon}>
        <sphereGeometry args={[0.15, 48, 48]} />
        <meshStandardMaterial ref={moonMat} map={moonMap} roughness={1} metalness={0} envMapIntensity={0.05} transparent />
      </mesh>
    </group>
  );
}
