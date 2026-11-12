import { esc } from './data.js';
const $ = s => document.querySelector(s);

const W = 300;
const pct = v => Math.round(v * 100) + '%';
const cls = who => (who === 'reader' ? 'ice' : 'agent');
const cap = u => u ? `<text class="cap" x="0" y="10">${esc(u)}</text>` : '';
const svg = (h, body) => `<svg class="fv" viewBox="0 0 ${W} ${h}" role="img" aria-hidden="true">${body}</svg>`;

function dots(v) {
  const x0 = 0, x1 = 250, s = x1 / 0.6, top = 26, rh = 44;
  let o = cap(v.unit);
  v.rows.forEach((r, i) => {
    const y = top + i * rh, cx = r.v * s, c = cls(r.who);
    o += `<text class="lab" x="0" y="${y}">${esc(r.label)}</text>`;
    o += `<line class="trk" x1="${x0}" x2="${x1}" y1="${y + 16}" y2="${y + 16}"/>`;
    if (c === 'ice') o += `<line class="dash" x1="${cx}" x2="${cx}" y1="${y + 6}" y2="${y + 26}"/><circle class="hol" cx="${cx}" cy="${y + 16}" r="6"/>`;
    else o += `<line class="stem" x1="0" x2="${cx}" y1="${y + 16}" y2="${y + 16}"/><circle class="dotA" cx="${cx}" cy="${y + 16}" r="6"/>`;
    o += `<text class="val" x="${cx + 12}" y="${y + 20}">${pct(r.v)}</text>`;
  });
  return svg(top + v.rows.length * rh - 10, o);
}

function person(x, y, fillFrac, id) {
  const p = `<circle cx="${x}" cy="${y}" r="7"/><path d="M${x - 11} ${y + 32} v-12 a11 11 0 0 1 22 0 v12 z"/>`;
  if (fillFrac >= 1) return `<g class="ppl">${p}</g>`;
  const w = 24 * fillFrac;
  return `<g class="ppl faint">${p}</g><clipPath id="${id}"><rect x="${x - 12}" y="${y - 8}" width="${w}" height="50"/></clipPath><g class="ppl" clip-path="url(#${id})">${p}</g>`;
}
function pictogram(v) {
  let o = '';
  const gx = 14, gap = (W - 28) / (v.n - 1);
  const px = [], py = 112, pg = 40;
  const full = Math.floor(v.effective), part = v.effective - full;
  const nP = full + 1;
  const sx = (W - (nP - 1) * pg) / 2;
  for (let i = 0; i < nP; i++) px.push(sx + i * pg);
  for (let i = 0; i < v.n; i++) {
    const x = gx + i * gap;
    const tx = px[Math.min(nP - 1, Math.floor(i * nP / v.n))];
    o += `<path class="flow" d="M${x} 36 C${x} 74 ${tx} 64 ${tx} 100"/>`;
    o += `<rect class="chip" x="${x - 8}" y="18" width="16" height="16" rx="4"/><circle class="chipEye" cx="${x}" cy="26" r="2.4"/>`;
  }
  px.forEach((x, i) => { o += person(x, py, i < full ? 1 : part, 'pc' + i); });
  o += `<text class="lab lft" x="0" y="10">${esc(v.labels[0])}</text>`;
  o += `<text class="lab ice" x="${W / 2}" y="172" text-anchor="middle">${esc(v.labels[1])}</text>`;
  return svg(182, o);
}

function bars(v, opts = {}) {
  const left = 0, bw = 205, rh = 38, top = opts.noCap || !v.unit ? 8 : 28;
  const ref = v.reference;
  const mx = Math.max(...v.rows.map(r => r.v), ref ? ref.v : 0) * 1.0;
  const s = bw / (mx || 1);
  let o = cap(v.unit);
  v.rows.forEach((r, i) => {
    const y = top + i * rh, w = Math.max(r.v * s, 2), c = opts.colors ? opts.colors[i] : 'agent';
    o += `<text class="lab" x="0" y="${y + 10}">${esc(r.label)}</text>`;
    o += `<rect class="bar ${c}" x="${left}" y="${y + 16}" width="${w}" height="8" rx="2"/>`;
    o += `<text class="val" x="${w + 8}" y="${y + 24}">${r.text ?? pct(r.v)}</text>`;
  });
  const h = top + v.rows.length * rh;
  if (ref) {
    const x = ref.v * s;
    v.rows.forEach((r, i) => { const y = top + i * rh; o += `<line class="dash" x1="${x}" x2="${x}" y1="${y + 12}" y2="${y + 28}"/>`; });
    o += `<text class="lab ice sm" x="${x}" y="${h + 6}">- - ${esc(ref.label)} ${pct(ref.v)}</text>`;
    return svg(h + 14, o);
  }
  return svg(h - 4, o);
}

function share(v) {
  const bw = 225, rh = 46;
  let o = '';
  v.rows.forEach((r, i) => {
    const y = 4 + i * rh, c = i === 0 ? 'dimf' : 'agent';
    o += `<text class="lab" x="0" y="${y + 10}">${esc(r.label)}</text>`;
    o += `<rect class="bar trkbar" x="0" y="${y + 18}" width="${bw}" height="10" rx="3"/>`;
    o += `<rect class="bar ${c}" x="0" y="${y + 18}" width="${r.v * bw}" height="10" rx="3"/>`;
    o += `<text class="val" x="${bw + 8}" y="${y + 27}">${pct(r.v)}</text>`;
  });
  return svg(100, o);
}

function ratio(v) {
  return bars({ rows: v.rows }, { noCap: true, colors: v.rows.map(r => r.who === 'reader' ? 'ice' : 'agent') });
}
function beforeAfter(v) {
  return bars(v, { colors: ['soft', 'agent'] });
}

function dotgrid(v) {
  const cols = 10, rows = Math.ceil(v.n / cols), step = 26, r = 9;
  let o = '';
  for (let i = 0; i < v.n; i++) {
    const cx = 8 + (i % cols) * step + 10, cy = 12 + Math.floor(i / cols) * step;
    o += `<circle class="${i < v.k ? 'dotA' : 'dotDim'}" cx="${cx}" cy="${cy}" r="${r - (i < v.k ? 2 : 4)}"/>`;
  }
  return svg(rows * step - 8, o);
}

const VIZ = { dots, pictogram, bars, share, ratio, before_after: beforeAfter, dotgrid };

function card(c) {
  const v = c.viz && VIZ[c.viz.type] ? VIZ[c.viz.type](c.viz) : '';
  const big = c.big ? `<div class="big"><b>${esc(c.big)}</b>${c.big_caption ? `<span>${esc(c.big_caption)}</span>` : ''}</div>` : '';
  const q = c.quote ? `<blockquote>${esc(c.quote)}</blockquote>` : '';
  const ch = c.chips ? `<div class="chips">${c.chips.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : '';
  return `<article class="fcard"><h3>${esc(c.headline)}</h3><p class="one">${esc(c.line)}</p>${big}<div class="fig2">${v}</div>${q}${ch}</article>`;
}

export async function buildFindings() {
  if (!document.getElementById('findings-css')) {
    const l = document.createElement('link');
    l.id = 'findings-css'; l.rel = 'stylesheet'; l.href = 'css/findings.css';
    document.head.appendChild(l);
  }
  const D = await fetch('data/findings_public.json').then(r => r.json());
  $('#findings').innerHTML = `<div class="fwrap"><h1>${esc(D.title)}</h1><p class="flead">${esc(D.lede)}</p>
    ${D.groups.map(g => `<section class="fgroup ${esc(g.id)}"><div class="fgh"><h2>${esc(g.title)}</h2><p>${esc(g.sub)}</p></div>
      <div class="fgrid">${g.cards.map(card).join('')}</div></section>`).join('')}
    ${D.footer ? '' : ''}</div>`;
}
