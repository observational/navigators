// Data layer: shared loader and helpers (ported from site/js/data.js; same exports).
// JSON is fetched relative to the document (works under any sub-path); files live in public/data/.
const V2 = import.meta.env.BASE_URL + 'data/';
const j = u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
// any other JSON in public/data/, e.g. getJSON('topic_tree.json')
export const getJSON = name => j(V2 + name);
export const MODELS = ['DeepSeek4.1', 'Grok4.7', 'MiMo2.6', 'Qwen3.8', 'Qwen3.7', 'Gemini3.8', 'Haiku5.5', 'Luna'];
export const FAMS = ['deepseek', 'grok', 'mimo', 'qwen', 'gemini', 'haiku', 'gpt'];
// agents are warm: family hues stay inside amber-to-rose; shape is the non-colour cue
export const FCOL = { deepseek: '#f2b24c', grok: '#ff8a4c', mimo: '#ffe08e', qwen: '#d89a62', gemini: '#ff7a9a', haiku: '#ecd0a8', gpt: '#ffa488' };
export const ICE = '#7fb2d6', EMBER = '#e5532d', BONE = '#e6dcc3';
export const S = {}; // loaded data
export const fmt = n => Math.round(n).toLocaleString('en-GB');
export const pct = x => Math.round(x * 100) + '%';
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let loading;
// memoised: every tab can `await load()`; the data is fetched once and lives in S
export const load = () => loading ||= doLoad();
async function doLoad() {
  const [wells, nodesF, derived, hw, fh, facts, kin, mv2, log, st, stats] = await Promise.all([
    j(V2 + 'wells_shrunk.json'), j(V2 + 'nodes.json'), j(V2 + 'derived.json'), j(V2 + 'highways.json'),
    j(V2 + 'first_hops.json'), j(V2 + 'facts.json'), j(V2 + 'kin.json'), j(V2 + 'models_v2.json'),
    j(V2 + 'log_lines.json'), j(V2 + 'said_thought.json'), j(V2 + 'stats.json')]);
  Object.assign(S, { wells, derived, hw, fh, facts, kin, mv2, log, st, stats, topicsF: nodesF.topics });
  // nodes: [id,title,x,y,topic,agentVisits,readerClicks]
  S.nodes = nodesF.nodes.map(([id, t, x, y, topic, A, H]) => ({ id, t, x, y, topic, A, H }));
  S.byId = new Map(S.nodes.map((n, i) => [n.id, i]));
  S.mod = Object.fromEntries(mv2.models.map(m => [m.key, m]));
  S.startIdx = Object.fromEntries(derived.starts.map(([id], i) => [id, i]));
  // per-model visits per node, from the run paths (counts only)
  S.visits = {}; MODELS.forEach(m => S.visits[m] = new Uint16Array(S.nodes.length));
  for (const [si, mk, cond, term, path] of derived.runs) { const v = S.visits[mk]; if (!v) continue; for (let i = 1; i < path.length; i++) { const k = S.byId.get(path[i]); if (k != null) v[k]++; } }
  return S;
}

/* ---------- grounds ---------- */
const b64 = s => { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
const G0 = 160, G1 = 320; // source grid, display grid
export const GN = G1, AMP = 215;
const cache = {};
// Catmull-Rom upsample of the normalised height hn = (U+5)/8 (one shared scale for every ground)
function up(src) {
  const out = new Float32Array(G1 * G1), r = (G0 - 1) / (G1 - 1);
  const at = (i, j) => src[Math.max(0, Math.min(G0 - 1, j)) * G0 + Math.max(0, Math.min(G0 - 1, i))];
  const cr = (a, b, c, d, t) => b + .5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
  for (let y = 0; y < G1; y++) {
    const gy = y * r, j0 = Math.floor(gy), fy = gy - j0;
    for (let x = 0; x < G1; x++) {
      const gx = x * r, i0 = Math.floor(gx), fx = gx - i0, col = [];
      for (let k = -1; k <= 2; k++) col.push(cr(at(i0 - 1, j0 + k), at(i0, j0 + k), at(i0 + 1, j0 + k), at(i0 + 2, j0 + k), fx));
      out[y * G1 + x] = Math.min(1, Math.max(0, cr(col[0], col[1], col[2], col[3], fy)));
    }
  }
  return out;
}
export function ground(key) { // key: 'all' | 'readers' | model key
  if (cache[key]) return cache[key];
  const w = S.wells; let d, mask = null, meta = {};
  if (key === 'all') { d = w.agents.data; meta = { label: 'All agents', n_runs: w.agents.n_runs, n_visits: w.agents.n_visits }; }
  else if (key === 'readers') {
    d = w.readers.data; const mb = b64(w.readers.mask); mask = new Uint8Array(G0 * G0);
    for (let i = 0; i < mask.length; i++) mask[i] = (mb[i >> 3] >> (7 - (i & 7))) & 1;
    meta = { label: 'Readers', covered: mask.reduce((a, b) => a + b, 0) / mask.length };
  } else { const m = w.models[key]; d = m.data; meta = { label: m.label, n_runs: m.n_runs, n_visits: m.n_visits, weight: m.weight, sparse: m.sparse }; }
  const by = b64(d), U = new Float32Array(G0 * G0), hn = new Float32Array(G0 * G0);
  for (let i = 0; i < U.length; i++) { U[i] = mask && !mask[i] ? 3 : -5 + by[i] / 255 * 8; hn[i] = (U[i] + 5) / 8; }
  const H = up(hn);
  // wells: local minima of U on the source grid below U = -1, deepest first, with at least 14 cells between them
  const wl = [];
  for (let y = 2; y < G0 - 2; y++) for (let x = 2; x < G0 - 2; x++) {
    const u = U[y * G0 + x]; if (u > -1) continue; let mn = true;
    for (let dy = -2; dy <= 2 && mn; dy++) for (let dx = -2; dx <= 2; dx++) if ((dx || dy) && U[(y + dy) * G0 + x + dx] < u) { mn = false; break; }
    if (mn) wl.push({ U: u, x: x / (G0 - 1) * 1000, y: y / (G0 - 1) * 1000 });
  }
  wl.sort((a, b) => a.U - b.U); const wells = [];
  for (const q of wl) if (wells.every(p => Math.hypot(p.x - q.x, p.y - q.y) > 90)) wells.push(q);
  // name each well after the most visited page within 40 layout units
  const A = key === 'readers' ? i => S.nodes[i].H : key === 'all' ? i => S.nodes[i].A : i => S.visits[key][i];
  for (const q of wells) { let b = -1, bv = -1; S.nodes.forEach((n, i) => { if (Math.hypot(n.x - q.x, n.y - q.y) < 40) { const v = A(i); if (v > bv) { bv = v; b = i; } } }); q.node = b; q.n = bv; }
  return cache[key] = { key, U, H, mask, wells: wells.filter(w => w.node >= 0).slice(0, 8), meta };
}
export function hAt(g, x, y) { // bilinear, layout coords 0..1000
  const gx = Math.min(G1 - 1.001, Math.max(0, x / 1000 * (G1 - 1))), gy = Math.min(G1 - 1.001, Math.max(0, y / 1000 * (G1 - 1)));
  const i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, H = g.H;
  return (H[j * G1 + i] * (1 - fx) + H[j * G1 + i + 1] * fx) * (1 - fy) + (H[(j + 1) * G1 + i] * (1 - fx) + H[(j + 1) * G1 + i + 1] * fx) * fy;
}
export function contours(g, step = .025) { // marching squares on the upsampled field; one Path2D per level (layout coords)
  const H = g.H, n = G1, s = 1000 / (n - 1), out = [];
  for (let L = step; L < 1; L += step) {
    const p = new Path2D(); let any = false;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const a = H[j * n + i], b = H[j * n + i + 1], c = H[(j + 1) * n + i + 1], d = H[(j + 1) * n + i];
      const m = (a > L) | (b > L) << 1 | (c > L) << 2 | (d > L) << 3; if (m === 0 || m === 15) continue;
      any = true; const X = i * s, Y = j * s, t = (u, v) => (L - u) / (v - u);
      const T = [X + t(a, b) * s, Y], R = [X + s, Y + t(b, c) * s], B = [X + t(d, c) * s, Y + s], Lf = [X, Y + t(a, d) * s];
      const ln = (p0, q0) => { p.moveTo(p0[0], p0[1]); p.lineTo(q0[0], q0[1]); };
      switch (m) { case 1: case 14: ln(Lf, T); break; case 2: case 13: ln(T, R); break; case 3: case 12: ln(Lf, R); break; case 4: case 11: ln(R, B); break;
        case 5: ln(Lf, T); ln(R, B); break; case 6: case 9: ln(T, B); break; case 7: case 8: ln(Lf, B); break; case 10: ln(T, R); ln(Lf, B); break; }
    }
    if (any) out.push({ L, major: Math.round(L / step) % 5 === 0, p });
  }
  return out;
}

/* ---------- selections ---------- */
export const modelLabel = k => k === 'all' ? 'All agents' : k === 'readers' ? 'Readers' : S.mod[k].label;
export const famOf = k => S.mod[k]?.family || 'deepseek';
export const shortName = k => ({ 'DeepSeek4.1': 'DeepSeek', 'Grok4.7': 'Grok', 'MiMo2.6': 'MiMo', 'Qwen3.8': 'Qwen 3.8', 'Qwen3.7': 'Qwen 3.7', 'Gemini3.8': 'Gemini', 'Haiku5.5': 'Haiku', 'Luna': 'Luna', all: 'All agents', readers: 'Readers' }[k]);
export function startInfo(pageId) { return S.fh.starts.find(s => s.page_id === pageId); }
export const title = id => S.byId.has(id) ? S.nodes[S.byId.get(id)].t : 'another page';
