// Terrain fields for the landscape: same recipe as the old main.js (visit counts -> blurred -> -log -> 0..1).
import { S } from '../data.js';

export const GN = 160, AMP = 240, LIFT = 300;

function blur(a, s) {
  const R = Math.ceil(s * 4), k = []; let sum = 0;
  for (let i = -R; i <= R; i++) { const v = Math.exp(-i * i / (2 * s * s)); k.push(v); sum += v; }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const cl = i => i < 0 ? -i - 1 : i >= GN ? 2 * GN - i - 1 : i;
  const t = new Float32Array(GN * GN), o = new Float32Array(GN * GN);
  for (let y = 0; y < GN; y++) for (let x = 0; x < GN; x++) { let acc = 0; for (let j = -R; j <= R; j++) acc += a[y * GN + cl(x + j)] * k[j + R]; t[y * GN + x] = acc; }
  for (let y = 0; y < GN; y++) for (let x = 0; x < GN; x++) { let acc = 0; for (let j = -R; j <= R; j++) acc += t[cl(y + j) * GN + x] * k[j + R]; o[y * GN + x] = acc; }
  return o;
}
function splat(w) {
  const nodes = S.nodes, N = nodes.length, r = new Float32Array(GN * GN);
  for (let i = 0; i < N; i++) { const v = w[i]; if (!(v > 0)) continue; const n = nodes[i];
    const gx = Math.min(GN - 1, Math.max(0, Math.round(n.x / 1000 * (GN - 1)))), gy = Math.min(GN - 1, Math.max(0, Math.round(n.y / 1000 * (GN - 1))));
    r[gy * GN + gx] += v; }
  return blur(r, 2.6);
}
function pot(r) { // 0 = deepest well, 1 = empty rim
  let mx = 0; for (const v of r) if (v > mx) mx = v;
  const p = new Float32Array(r.length); let lo = 1e9, hi = -1e9;
  for (let i = 0; i < r.length; i++) { p[i] = -Math.log(r[i] + .02 * mx); if (p[i] < lo) lo = p[i]; if (p[i] > hi) hi = p[i]; }
  for (let i = 0; i < p.length; i++) p[i] = (p[i] - lo) / (hi - lo);
  return p;
}
const sumOf = a => { let s = 0; for (const v of a) s += v; return s; };

let rawAll;
const GR = {}, WC = {};
export function field(k) {
  const nodes = S.nodes;
  rawAll ||= splat(nodes.map(n => Math.log1p(n.A)));
  if (GR[k]) return GR[k];
  if (k === 'all') return GR[k] = pot(rawAll);
  if (k === 'readers') return GR[k] = pot(splat(nodes.map(n => Math.log1p(n.H / 50))));
  // one model: its own field blended with the pooled field by the shrinkage weight (wells_shrunk.json)
  const rm = splat(Array.from(S.visits[k], v => Math.log1p(v))), w = S.wells.models[k].weight, sm = sumOf(rm), sa = sumOf(rawAll);
  const mix = new Float32Array(GN * GN); for (let i = 0; i < mix.length; i++) mix[i] = w * rm[i] / sm + (1 - w) * rawAll[i] / sa;
  return GR[k] = pot(mix);
}
// wells: local minima (15-cell window), thinned to 110 layout units, named after the most visited page nearby
export function wellsOf(k) {
  if (WC[k]) return WC[k];
  const nodes = S.nodes, N = nodes.length;
  const p = field(k), out = [], cand = [];
  for (let y = 7; y < GN - 7; y++) for (let x = 7; x < GN - 7; x++) {
    const v = p[y * GN + x]; if (v > .55) continue; let mn = true;
    for (let dy = -7; dy <= 7 && mn; dy++) for (let dx = -7; dx <= 7; dx++) if (p[(y + dy) * GN + x + dx] < v) { mn = false; break; }
    if (mn) cand.push([v, x / (GN - 1) * 1000, y / (GN - 1) * 1000]);
  }
  cand.sort((a, b) => a[0] - b[0]);
  const wt = k === 'readers' ? i => nodes[i].H : k === 'all' ? i => nodes[i].A : i => S.visits[k][i];
  for (const [v, x, y] of cand) {
    if (out.some(o => (o.x - x) ** 2 + (o.y - y) ** 2 < 110 ** 2)) continue;
    let best = -1, bw = 0, tot = 0; const tc = {};
    for (let i = 0; i < N; i++) { const n = nodes[i]; if ((n.x - x) ** 2 + (n.y - y) ** 2 > 55 ** 2) continue; const q = wt(i); if (!q) continue; tot += q; tc[n.topic] = (tc[n.topic] || 0) + q; if (q > bw) { bw = q; best = i; } }
    if (best < 0) continue;
    const tp = +Object.entries(tc).sort((a, b) => b[1] - a[1])[0][0];
    out.push({ x, y, page: nodes[best].t, topic: S.topicsF[tp]?.name || '', n: tot });
    if (out.length === 8) break;
  }
  return WC[k] = out;
}
