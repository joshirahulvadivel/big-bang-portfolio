// Particle target shapes. Each returns positions (n * 4: x, y, z, brightness 0..1) and linear RGB colours (n * 3).
// Image-based shapes sample real NASA imagery: brighter pixels attract more particles and lend them their colour.

export const DEG = Math.PI / 180;

export type Shape = { pos: Float32Array; col: Float32Array };

export function latLngToXYZ(lat: number, lng: number, r = 1): [number, number, number] {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
}

const toLinear = (c: number) => Math.pow(c / 255, 2.2);

function fibonacci(i: number, n: number, radius: number): [number, number, number] {
  const y = 1 - (i / (n - 1)) * 2;
  const rad = Math.sqrt(1 - y * y);
  const theta = Math.PI * (3 - Math.sqrt(5)) * i;
  return [Math.cos(theta) * rad * radius, y * radius, Math.sin(theta) * rad * radius];
}

/** Reads an image into pixels at a modest working width. */
export function readPixels(img: HTMLImageElement, width = 720) {
  const w = Math.min(width, img.naturalWidth);
  const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, w, h };
}

type Pixels = ReturnType<typeof readPixels>;

/**
 * A photograph turned into a cloud of points in the XY plane. Brightness sets density and depth.
 * `round` fades the corners so a face-on galaxy reads as a disc.
 */
export function imageShape(
  n: number,
  px: Pixels,
  opts: { width: number; depth: number; gamma: number; floor: number; seed: number; round?: boolean; boost?: number },
): Shape {
  const { data, w, h } = px;
  const r = rng(opts.seed);
  const weights = new Float64Array(w * h);
  let total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4;
      const lum = (0.2126 * data[k] + 0.7152 * data[k + 1] + 0.0722 * data[k + 2]) / 255;
      let wgt = lum > opts.floor ? Math.pow(lum, opts.gamma) : 0;
      if (opts.round) {
        const d = Math.hypot(x / w - 0.5, y / h - 0.5);
        wgt *= Math.max(0, Math.min(1, (0.5 - d) / 0.08));
      }
      total += wgt;
      weights[y * w + x] = total;
    }
  }
  const height = (opts.width * h) / w;
  const boost = opts.boost ?? 1.6;
  const pos = new Float32Array(n * 4);
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // binary search the cumulative weights
    const target = r() * total;
    let lo = 0;
    let hi = weights.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (weights[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const x = lo % w;
    const y = Math.floor(lo / w);
    const k = lo * 4;
    const lum = (0.2126 * data[k] + 0.7152 * data[k + 1] + 0.0722 * data[k + 2]) / 255;
    pos.set(
      [
        ((x + r()) / w - 0.5) * opts.width,
        (0.5 - (y + r()) / h) * height,
        (lum - 0.4) * opts.depth + gauss(r) * opts.depth * 0.25,
        Math.min(1, lum * 1.15),
      ],
      i * 4,
    );
    col.set([toLinear(data[k]) * boost, toLinear(data[k + 1]) * boost, toLinear(data[k + 2]) * boost], i * 3);
  }
  return { pos, col };
}

/** Where each role sits along the ascent, first role to current role. */
export const TRAJECTORY_STAGES = [0.18, 0.45, 0.72, 1];

function trajectoryPoint(t: number): [number, number, number] {
  return [-1.35 + 2.7 * t, -1.5 + 2.9 * (1 - Math.pow(1 - t, 1.8)), Math.sin(t * Math.PI) * 0.5];
}

/** A launch ascent with a plume, four stage points (one per role) and a closing orbit around the last. */
export function trajectoryShape(n: number): Shape {
  const r = rng(4);
  const pos = new Float32Array(n * 4);
  const col = new Float32Array(n * 3);
  const gold = [1.6, 1.0, 0.42];
  const end = trajectoryPoint(1);
  for (let i = 0; i < n; i++) {
    const roll = r();
    let p: [number, number, number];
    let b: number;
    let c: number[];
    if (roll < 0.45) {
      const t = Math.pow(r(), 0.9);
      const [x, y, z] = trajectoryPoint(t);
      const s = 0.012 + (1 - t) * 0.03;
      p = [x + gauss(r) * s, y + gauss(r) * s, z + gauss(r) * s];
      b = 0.3 + t * 0.35;
      c = [0.55 + t * 0.6, 0.62 + t * 0.3, 0.9 - t * 0.35];
    } else if (roll < 0.6) {
      const [x, y, z] = trajectoryPoint(0);
      const d = r();
      p = [x + gauss(r) * (0.04 + d * 0.22), y - d * 0.55, z + gauss(r) * (0.04 + d * 0.22)];
      b = 0.5 * (1 - d);
      c = [1.4, 0.55 + (1 - d) * 0.4, 0.18];
    } else if (roll < 0.8) {
      const m = Math.floor(r() * TRAJECTORY_STAGES.length);
      const [x, y, z] = trajectoryPoint(TRAJECTORY_STAGES[m]);
      const s = m === 3 ? 0.07 : 0.045;
      p = [x + gauss(r) * s, y + gauss(r) * s, z + gauss(r) * s];
      b = 1;
      c = gold;
    } else {
      const a = r() * Math.PI * 2;
      const rad = 0.42 + gauss(r) * 0.012;
      const ox = Math.cos(a) * rad;
      const oz = Math.sin(a) * rad;
      p = [end[0] + ox, end[1] + oz * 0.35, end[2] + oz * 0.94];
      b = 0.45;
      c = [0.55, 0.72, 1.2];
    }
    pos.set([...p, b], i * 4);
    col.set(c, i * 3);
  }
  return { pos, col };
}

/** A ringed gas giant: banded sphere plus A, B and C rings with the Cassini division. */
export function ringedPlanetShape(n: number): Shape {
  const r = rng(5);
  const pos = new Float32Array(n * 4);
  const col = new Float32Array(n * 3);
  const tilt = 0.4;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  for (let i = 0; i < n; i++) {
    if (r() < 0.42) {
      const [x, y, z] = fibonacci(Math.floor(r() * 20000), 20000, 0.62);
      const band = 0.5 + 0.5 * Math.sin((y / 0.62) * 14 + Math.sin(x * 6) * 0.4);
      const c = [0.9 + band * 0.35, 0.68 + band * 0.25, 0.4 + band * 0.12];
      pos.set([x * ct - y * st, x * st + y * ct, z, 0.4 + band * 0.25], i * 4);
      col.set(c, i * 3);
    } else {
      let rad = 0;
      let b = 0;
      // pick a ring by relative density
      const k = r();
      if (k < 0.15) {
        rad = 0.82 + r() * 0.16;
        b = 0.22;
      } else if (k < 0.72) {
        rad = 0.98 + r() * 0.3;
        b = 0.55;
      } else {
        rad = 1.34 + r() * 0.2;
        b = 0.4;
      }
      const a = r() * Math.PI * 2;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      const y = gauss(r) * 0.006;
      pos.set([x * ct - y * st, x * st + y * ct, z, b + (r() < 0.03 ? 0.4 : 0)], i * 4);
      const tone = 0.75 + r() * 0.25;
      col.set([1.1 * tone, 0.95 * tone, 0.75 * tone], i * 3);
    }
  }
  return { pos, col };
}
