import { getJSON } from '../data.js';
/* sigils: each model its own kind of chaotic map (identity); its behaviour bends the parameters (data/sigils.json,
   our mapping, not a fit). Drawn as an orbit density in ink, lightly dithered. */
const MAPS = {
  clifford: ([a, b, c, d]) => (x, y) => [Math.sin(a * y) + c * Math.cos(a * x), Math.sin(b * x) + d * Math.cos(b * y)],
  dejong: ([a, b, c, d]) => (x, y) => [Math.sin(a * y) - Math.cos(b * x), Math.sin(c * x) - Math.cos(d * y)],
  svensson: ([a, b, c, d]) => (x, y) => [d * Math.sin(a * x) - Math.sin(b * y), c * Math.cos(a * x) + Math.cos(b * y)],
  bedhead: ([a, b]) => (x, y) => [Math.sin(x * y / b) * y + Math.cos(a * x - y), x + Math.sin(y) / b],
  ikeda: ([u, k, c]) => (x, y) => { const t = k - c / (1 + x * x + y * y); return [1 + u * (x * Math.cos(t) - y * Math.sin(t)), u * (x * Math.sin(t) + y * Math.cos(t))]; },
  gumowski_mira: ([al, si, mu]) => { const f = x => mu * x + 2 * (1 - mu) * x * x / (1 + x * x); return (x, y) => { const xn = y + al * (1 - si * y * y) * y + f(x); return [xn, -x + f(xn)]; }; },
  icon: ([lam, al, be, ga, om, deg]) => (x, y) => {
    const zz = x * x + y * y; let pr = 1, pi = 0; for (let i = 0; i < deg; i++) [pr, pi] = [pr * x - pi * y, pr * y + pi * x];   // z^deg
    let cr = 1, ci = 0; for (let i = 0; i < deg - 1; i++) [cr, ci] = [cr * x + ci * y, ci * x - cr * y];                         // conj(z)^(deg-1)
    const p = lam + al * zz + be * pr; return [p * x - om * y + ga * cr, p * y + om * x + ga * ci];
  },
};
const START = { ikeda: [0, 0], gumowski_mira: [1, 1], bedhead: [1, 1], icon: [.01, .003] };
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const SIG = {}; // model key -> loaded sigil spec
export async function loadSigils() { if (!Object.keys(SIG).length) Object.assign(SIG, (await getJSON('sigils.json')).models); return SIG; }
export function sigil(cv, key, color, Sz = 140) {
  const sp = SIG[key]; if (!sp) return;
  const R = Math.min(2, devicePixelRatio || 1), N = Math.round(Sz * R);
  cv.width = cv.height = N; cv.style.width = cv.style.height = Sz + 'px';
  const ctx = cv.getContext('2d'), im = ctx.createImageData(N, N), cnt = new Float32Array(N * N), step = MAPS[sp.map](sp.params);
  const [x0, y0, x1, y1] = sp.box, pad = .06, sx = (N - 1) * (1 - 2 * pad) / Math.max(x1 - x0, y1 - y0), ox = (N - 1) / 2 - (x0 + x1) / 2 * sx, oy = (N - 1) / 2 + (y0 + y1) / 2 * sx;
  let [x, y] = START[sp.map] || [.1, .1]; const n = Sz > 80 ? 600000 : 160000;
  for (let i = 0; i < n; i++) {
    [x, y] = step(x, y); if (i < 1000 || !isFinite(x)) continue;
    const u = x * sx + ox, v = oy - y * sx, iu = u | 0, iv = v | 0;
    if (iu < 0 || iv < 0 || iu >= N - 1 || iv >= N - 1) continue;
    const fu = u - iu, fv = v - iv, k = iv * N + iu;     // bilinear splat: soft strands, no blocky pixels
    cnt[k] += (1 - fu) * (1 - fv); cnt[k + 1] += fu * (1 - fv); cnt[k + N] += (1 - fu) * fv; cnt[k + N + 1] += fu * fv;
  }
  const sorted = Array.from(cnt).filter(c => c > 0).sort((a, b) => a - b), ref = sorted[Math.floor(sorted.length * .995)] || 1;
  const hx = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)), c1 = hx(color), c2 = [244, 234, 210], bg = [20, 17, 13];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, o = k * 4, t = Math.min(1, Math.log1p(cnt[k]) / Math.log1p(ref));
    const g = Math.pow(t, .75), d = (BAY[(j & 3) * 4 + (i & 3)] + .5) / 16 * .18;   // light dither keeps the printed grain
    const a = Math.max(0, Math.min(1, g * 1.08 - d)), hi = Math.max(0, (g - .78) / .22), c = c1.map((v, q) => v + (c2[q] - v) * hi);
    im.data[o] = bg[0] + (c[0] - bg[0]) * a; im.data[o + 1] = bg[1] + (c[1] - bg[1]) * a; im.data[o + 2] = bg[2] + (c[2] - bg[2]) * a; im.data[o + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
}
