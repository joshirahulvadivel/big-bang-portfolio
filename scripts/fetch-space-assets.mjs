// Downloads the NASA imagery used by the 3D scenes, resizes it for the web and records credits.
// Run with `pnpm space:assets`. Writes public/space/*.jpg and src/data/space-credits.json.
// Images from the NASA Image and Video Library are skipped if their metadata names a third-party copyright.
// `mollweide: true` reprojects an all-sky oval map into an equirectangular map that wraps onto a sphere.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const EO = "https://assets.science.nasa.gov/content/dam/science/esd/eo/images";

/** id: output name; sizes: widths to export; either `url` (direct NASA file) or `nasaId` (images.nasa.gov). */
const ASSETS = [
  {
    id: "earth-day",
    url: `${EO}/bmng/bmng-topography-bathymetry/august/world.topo.bathy.200408.3x5400x2700.jpg`,
    sizes: [4096, 2048],
    title: "Blue Marble Next Generation, August",
    credit: "NASA Earth Observatory (Reto Stöckli)",
    source: "https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/",
  },
  {
    id: "earth-night",
    url: `${EO}/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg`,
    sizes: [2048],
    title: "Black Marble 2016: Earth at Night",
    credit: "NASA Earth Observatory (Joshua Stevens, Miguel Román)",
    source: "https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps",
  },
  {
    id: "moon",
    url: "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_2k.tif",
    sizes: [1024],
    title: "CGI Moon Kit, LROC colour map",
    credit: "NASA's Scientific Visualization Studio (LRO data: NASA/GSFC/Arizona State University)",
    source: "https://svs.gsfc.nasa.gov/4720",
  },
  {
    id: "cmb",
    url: "https://lambda.gsfc.nasa.gov/product/wmap/dr5/map_images/9yr_2048/ilc_9yr_temp_2048.png",
    sizes: [2048],
    mollweide: true,
    title: "WMAP nine-year microwave sky (ILC map)",
    credit: "NASA / WMAP Science Team",
    source: "https://lambda.gsfc.nasa.gov/product/wmap/dr5/m_images.html",
  },
  { id: "carina", nasaId: "carina_nebula", sizes: [720] },
  { id: "whirlpool", nasaId: "PIA04230", sizes: [720] },
  { id: "deep-field", nasaId: "webb_first_deep_field", sizes: [2048, 720] },
];

const THIRD_PARTY = /©|copyright\s+(?!.*nasa)/i;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function resolveLibraryAsset(nasaId) {
  const assets = await getJson(`https://images-api.nasa.gov/asset/${nasaId}`);
  const hrefs = assets.collection.items.map((i) => i.href.replace(/^http:/, "https:"));
  const file = hrefs.find((h) => h.includes("~large.jpg")) ?? hrefs.find((h) => h.includes("~orig.")) ?? hrefs[0];
  const meta = await getJson(`https://images-assets.nasa.gov/image/${nasaId}/metadata.json`);
  const credit = meta["XMP:Credit"] || meta["AVAIL:SecondaryCreator"] || meta["AVAIL:Photographer"] || "NASA";
  const rights = [meta["XMP:Rights"], meta["XMP:Credit"], meta["AVAIL:SecondaryCreator"]].filter(Boolean).join(" ");
  return {
    file,
    title: meta["AVAIL:Title"] || meta["XMP:Title"] || nasaId,
    credit,
    source: `https://images.nasa.gov/details/${nasaId}`,
    thirdParty: THIRD_PARTY.test(rights),
  };
}

/** Inverse Mollweide: samples an all-sky oval into a 2:1 equirectangular image. */
async function mollweideToEquirect(input, outW) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const isMap = (x, y) => {
    const k = (y * w + x) * c;
    return !(data[k] > 245 && data[k + 1] > 245 && data[k + 2] > 245);
  };
  // the oval's bounding box, measured along the middle row and column
  let x0 = 0, x1 = w - 1, y0 = 0, y1 = h - 1;
  const midY = h >> 1, midX = w >> 1;
  while (x0 < w && !isMap(x0, midY)) x0++;
  while (x1 > 0 && !isMap(x1, midY)) x1--;
  while (y0 < h && !isMap(midX, y0)) y0++;
  while (y1 > 0 && !isMap(midX, y1)) y1--;
  const outH = outW / 2;
  const out = Buffer.alloc(outW * outH * 3);
  const S2 = Math.SQRT2;
  for (let j = 0; j < outH; j++) {
    const lat = Math.PI / 2 - ((j + 0.5) / outH) * Math.PI;
    let t = lat;
    for (let n = 0; n < 12; n++) {
      const d = 2 + 2 * Math.cos(2 * t);
      if (Math.abs(d) < 1e-9) break;
      t -= (2 * t + Math.sin(2 * t) - Math.PI * Math.sin(lat)) / d;
    }
    for (let i = 0; i < outW; i++) {
      const lon = ((i + 0.5) / outW) * 2 * Math.PI - Math.PI;
      const mx = ((2 * S2) / Math.PI) * lon * Math.cos(t); // -2√2..2√2
      const my = S2 * Math.sin(t); // -√2..√2
      // galactic maps put longitude increasing to the left
      const px = Math.round(x0 + ((-mx / (2 * S2) + 1) / 2) * (x1 - x0));
      const py = Math.round(y0 + ((1 - my / S2) / 2) * (y1 - y0));
      const k = (Math.min(h - 1, Math.max(0, py)) * w + Math.min(w - 1, Math.max(0, px))) * c;
      const o = (j * outW + i) * 3;
      out[o] = data[k];
      out[o + 1] = data[k + 1];
      out[o + 2] = data[k + 2];
    }
  }
  return sharp(out, { raw: { width: outW, height: outH, channels: 3 } }).png().toBuffer();
}

mkdirSync("public/space", { recursive: true });
mkdirSync("src/data", { recursive: true });
const credits = [];

for (const a of ASSETS) {
  let info = { file: a.url, title: a.title, credit: a.credit, source: a.source, thirdParty: false };
  if (a.nasaId) info = await resolveLibraryAsset(a.nasaId);
  if (info.thirdParty) {
    console.warn(`skip ${a.id}: metadata names a third-party copyright (${info.credit})`);
    continue;
  }
  let input = await getBuffer(info.file);
  if (a.mollweide) input = await mollweideToEquirect(input, Math.max(...a.sizes));
  const files = [];
  for (const w of a.sizes) {
    const out = `public/space/${a.id}-${w}.jpg`;
    await sharp(input, { limitInputPixels: false }).resize({ width: w, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
    files.push(out.replace(/^public/, ""));
  }
  credits.push({ id: a.id, title: info.title, credit: info.credit, source: info.source, files });
  console.log(`ok ${a.id}: ${files.join(", ")}`);
}

writeFileSync("src/data/space-credits.json", JSON.stringify(credits, null, 2) + "\n");
console.log(`space-credits.json: ${credits.length} images`);
