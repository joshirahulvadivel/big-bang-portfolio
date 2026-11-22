// Ambient soundtrack synthesised in the browser (Web Audio API): no audio files, nothing to license.
// A low drone whose filter opens as the story moves forward, space "wind", and a soft chime per chapter.

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  filter: BiquadFilterNode;
  echo: GainNode;
};

let engine: Engine | null = null;

function brownNoise(ctx: AudioContext, seconds = 3) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

function build(): Engine {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // echo bus for the chimes
  const echo = ctx.createGain();
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.38;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.38;
  echo.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);
  echo.connect(master);

  // drone: A1, E2, A2, E3, slightly detuned, through a slowly breathing low-pass
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 280;
  filter.Q.value = 0.7;
  filter.connect(master);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 90;
  lfo.connect(lfoDepth);
  lfoDepth.connect(filter.frequency);
  lfo.start();
  [55, 82.41, 110, 164.81].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 ? "triangle" : "sine";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 4;
    const g = ctx.createGain();
    g.gain.value = [0.16, 0.08, 0.1, 0.04][i];
    o.connect(g);
    g.connect(filter);
    o.start();
  });

  // space wind
  const noise = ctx.createBufferSource();
  noise.buffer = brownNoise(ctx);
  noise.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 320;
  band.Q.value = 0.6;
  const ng = ctx.createGain();
  ng.gain.value = 0.05;
  noise.connect(band);
  band.connect(ng);
  ng.connect(master);
  noise.start();

  return { ctx, master, filter, echo };
}

export const ambient = {
  get on() {
    return !!engine && engine.ctx.state === "running" && engine.master.gain.value > 0.001;
  },
  /** Must be called from a user gesture (browsers block audio otherwise). */
  async start() {
    if (!engine) engine = build();
    await engine.ctx.resume();
    const now = engine.ctx.currentTime;
    engine.master.gain.cancelScheduledValues(now);
    engine.master.gain.setTargetAtTime(0.22, now, 0.8);
  },
  stop() {
    if (!engine) return;
    const e = engine;
    const now = e.ctx.currentTime;
    e.master.gain.cancelScheduledValues(now);
    e.master.gain.setTargetAtTime(0, now, 0.25);
    setTimeout(() => {
      if (e.master.gain.value < 0.01) e.ctx.suspend();
    }, 1500);
  },
  /** Opens the drone's filter as story time moves forward (0..6). */
  setStory(t: number) {
    if (!engine) return;
    engine.filter.frequency.setTargetAtTime(240 + t * 160, engine.ctx.currentTime, 0.6);
  },
  /** A soft two-note chime, used when a new chapter begins. */
  chime(chapter: number) {
    if (!engine || engine.ctx.state !== "running") return;
    const { ctx, echo } = engine;
    const now = ctx.currentTime;
    const root = 440 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14][chapter % 7] / 12);
    [root, root * 1.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.05, now + i * 0.12 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 2.8);
      o.connect(g);
      g.connect(echo);
      o.start(now + i * 0.12);
      o.stop(now + i * 0.12 + 3);
    });
  },
  pause() {
    engine?.ctx.suspend();
  },
  resume() {
    if (engine && engine.master.gain.value > 0.001) engine.ctx.resume();
  },
};
