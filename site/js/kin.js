import { S, FAMS, FCOL, fmt, pct, esc } from './data.js';
const $ = s => document.querySelector(s);
const SH = ['<circle cx="6" cy="6" r="4.5"/>', '<path d="M6 .5 11.5 6 6 11.5.5 6z"/>', '<path d="M6 .8 11.2 10.5H.8z"/>', '<rect x="1.5" y="1.5" width="9" height="9"/>', '<path d="M4.4.8h3.2v3.6h3.6v3.2H7.6v3.6H4.4V7.6H.8V4.4h3.6z"/>', '<path d="M6 .6 10.8 3.3v5.4L6 11.4 1.2 8.7V3.3z"/>', '<circle cx="6" cy="6" r="4" fill="none" stroke-width="2"/>'];
const shapeSvg = (i, col) => `<svg width="12" height="12" viewBox="0 0 12 12" fill="${col}" stroke="${col}" aria-hidden="true">${SH[i]}</svg>`;

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
export async function loadSigils() { if (!Object.keys(SIG).length) Object.assign(SIG, (await fetch('data/sigils.json').then(r => r.json())).models); return SIG; }
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
const MAPNAME = { clifford: 'Clifford map', dejong: 'Peter de Jong map', svensson: 'Svensson map', bedhead: 'Bedhead map', ikeda: 'Ikeda map (laser in an optical ring)', gumowski_mira: 'Gumowski–Mira map (particle accelerators)', icon: 'symmetric icon (Field & Golubitsky)' };

/* the agreement ladder: one axis, one row per kind of pair; numbers only on the two rows the finding compares */
function drawLadder() {
  const L = S.stats.ladder, mob = innerWidth < 760, W = Math.min(980, innerWidth - (mob ? 32 : 48)), LW = mob ? 168 : 260, x0 = LW + 14, x1 = W - 40, RH = mob ? 30 : 32, H = L.length * RH + 34;
  const xs = v => x0 + v / 0.7 * (x1 - x0), top = 10;
  let g = `<svg width="${W}" height="${H}" role="img" aria-label="How often two choices from the same page pick the same link">`;
  for (const t of [0, .2, .4, .6]) g += `<line class="rule" x1="${xs(t)}" x2="${xs(t)}" y1="${top - 6}" y2="${top + L.length * RH - 10}"/><text class="ax" x="${xs(t)}" y="${top + L.length * RH + 8}" text-anchor="middle">${Math.round(t*100)}%</text>`;
  L.forEach((r, i) => {
    const y = top + i * RH + 8, col = r.who === 'readers' ? 'var(--ice)' : r.who === 'mixed' ? 'var(--dim)' : 'var(--road)';
    g += `<text class="lab${r.mark ? ' em' : ''}" x="${LW}" y="${y + 5}" text-anchor="end" font-style="italic">${esc(r.label)}</text>`;
    g += `<line x1="${xs(0)}" x2="${xs(r.v)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="${r.mark ? 2 : 1}" ${r.who === 'readers' ? 'stroke-dasharray="4 3"' : ''} opacity="${r.mark ? 1 : .6}"><title>${esc(r.label)}: ${Math.round(r.v*100)}%</title></line>`;
    g += `<circle cx="${xs(r.v)}" cy="${y}" r="${r.mark ? 5.5 : 4}" fill="${r.who === 'readers' ? 'var(--ground)' : col}" stroke="${col}" stroke-width="1.5"><title>${esc(r.label)}: ${Math.round(r.v*100)}%</title></circle>`;
    if (r.mark) g += `<text class="val" x="${xs(r.v) + 12}" y="${y + 4}">${Math.round(r.v*100)}%</text>`;
  });
  g += `<text class="ax" x="${x1}" y="${top + L.length * RH + 24}" text-anchor="end">SAME LINK, SAME PAGE</text></svg>`;
  $('#ladder').innerHTML = g;
  const D = Object.fromEntries(L.map(r => [r.key, r.v]));
  $('#ladlede').textContent = `Different models pick the same link about ${Math.round(D.dmsc / D.hh)}x as often as two people do.`;
}
/* what predicts the first click: a diverging bar per explanation, no numbers */
function drawHyp() {
  const H = S.stats.hyptrails, mob = innerWidth < 760, W = Math.min(980, innerWidth - (mob ? 32 : 48)), LW = mob ? 168 : 260, mid = LW + 14 + (mob ? 40 : 120), x1 = W - 20, RH = 30;
  const mx = Math.max(...H.rows.map(r => Math.abs(r.e))), xs = e => mid + e / mx * (x1 - mid), h = H.rows.length * RH + 30;
  let g = `<svg width="${W}" height="${h}" role="img" aria-label="Which simple explanation predicts a model's first click best">`;
  g += `<line class="rule" x1="${mid}" x2="${mid}" y1="0" y2="${H.rows.length * RH}"/>`;
  H.rows.forEach((r, i) => {
    const y = i * RH + 15, pos = r.e > 0, col = pos ? (i === 0 ? 'var(--road)' : 'var(--bone)') : 'var(--dim)';
    g += `<text class="lab${i === 0 ? ' em' : ''}" x="${LW}" y="${y + 5}" text-anchor="end" font-style="italic">${esc(r.label.replace(/ \(.*?\)/, ''))}</text>`;
    g += `<rect x="${Math.min(mid, xs(r.e))}" y="${y - 4}" width="${Math.abs(xs(r.e) - mid)}" height="8" fill="${col}" opacity="${pos ? .9 : .5}"><title>${esc(r.label)}</title></rect>`;
  });
  g += `<text class="ax" x="${mid + 6}" y="${H.rows.length * RH + 16}">BETTER →</text><text class="ax" x="${mid - 6}" y="${H.rows.length * RH + 16}" text-anchor="end">← WORSE</text></svg>`;
  $('#hyp').innerHTML = g;
  $('#hyplede').textContent = 'A model’s first click is best guessed from what other models clicked, not from what people click.';
  $('#hypnote').textContent = '';
}

export async function buildKin() {
  drawLadder(); drawHyp(); await loadSigils();
  const K = S.kin, mob = innerWidth < 760, byLabel = Object.fromEntries(S.mv2.models.map(m => [m.label, m]));
  $('#klede').textContent = 'Models that pick alike sit close together. People sit apart from all of them.';

  const leaves = []; (function walk(n) { if (n.name) leaves.push(n); else n.children.forEach(walk); })(K.tree);
  const RH = 64, box = $('#tree'), W = Math.min(980, innerWidth - (mob ? 32 : 48)), LW = mob ? 176 : 300, TW = W - LW - 10, pad = 14, root = K.tree.height;
  box.style.height = (leaves.length * RH + 34) + 'px';
  const X = h => pad + (root - h) / root * (TW - pad);
  let li = 0; const paths = [], sups = [];
  (function lay(n, isRoot) {
    if (n.name) { n.y = li++ * RH + RH / 2; n.x = X(0); return; }
    n.children.forEach(c => lay(c, false)); n.y = n.children.reduce((s, c) => s + c.y, 0) / n.children.length; n.x = X(n.height);
    const weak = false;
    n.children.forEach(c => paths.push(`<path class="${weak ? 'weak' : ''}" d="M${n.x},${n.y}V${c.y}H${c.x}"/>`));
  })(K.tree, true);
  let svg = `<svg width="${TW}" height="${leaves.length * RH + 30}">${paths.join('')}${sups.join('')}`;
  svg += `<text x="${X(0)}" y="${leaves.length * RH + 22}" text-anchor="end" font-size="13">more alike →</text></svg>`;
  box.innerHTML = svg;
  leaves.forEach(l => {
    const row = document.createElement('div'); row.className = 'row'; row.style.top = (l.y - RH / 2) + 'px'; row.style.left = (TW + 10) + 'px';
    const cv = document.createElement('canvas'); row.appendChild(cv);
    const m = byLabel[l.name], f = m && S.facts.models[m.key];
    const sub = '';
    const nm = document.createElement('div'); nm.className = 'nm'; nm.innerHTML = `${esc(l.name)}${sub ? `<small>${sub}</small>` : ''}`; row.appendChild(nm); box.appendChild(row);
    if (!m) { cv.width = cv.height = 56; const x = cv.getContext('2d'); x.fillStyle = '#14110d'; x.fillRect(0, 0, 56, 56); x.strokeStyle = '#7fb2d6'; x.lineWidth = 2; x.setLineDash([3, 3]); x.beginPath(); x.arc(28, 28, 20, 0, 7); x.stroke(); }
    else sigil(cv, m.key, FCOL[m.family], 56);
  });

  const P = $('#plates');
  S.mv2.models.forEach(m => {
    const f = S.facts.models[m.key], el = document.createElement('div'); el.className = 'plate';
    const sr = f.step1_stop_reason, w = S.wells.models[m.key];
    const k10 = Math.round(f.agreement.with_other_models * 10);
    let p = `<svg class="d10" viewBox="0 0 150 14" role="img" aria-label="${k10} in 10">${Array.from({ length: 10 }, (_, i) => `<circle cx="${7 + i * 15}" cy="7" r="5.5" class="${i < k10 ? 'on' : ''}"/>`).join('')}</svg><span class="d10l">${k10} in 10 of its first picks match another model’s</span>`;
    el.innerHTML = `<canvas></canvas><div><h3>${shapeSvg(FAMS.indexOf(m.family), FCOL[m.family])}${esc(m.label)}</h3>${p}</div>`;
    P.appendChild(el); sigil(el.querySelector('canvas'), m.key, FCOL[m.family], 140);
  });
  $('#ksrc').textContent = '';
  const sg = [...document.querySelectorAll('#kin h2')].find(h => /^Sigils/.test(h.textContent));
  if (sg) { sg.textContent = 'Sigils'; sg.nextElementSibling.textContent = 'Each model has its own drawing, shaped by how it behaves.'; }
}
