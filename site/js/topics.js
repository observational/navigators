import { S, MODELS, fmt, pct, esc } from './data.js';
const $ = s => document.querySelector(s);
const SHORT = { 'DeepSeek4.1': 'DeepSeek', 'Grok4.7': 'Grok', 'MiMo2.6': 'MiMo', 'Qwen3.8': 'Qwen 3.8', 'Qwen3.7': 'Qwen 3.7', 'Gemini3.8': 'Gemini', 'Haiku5.5': 'Haiku', 'Luna': 'Luna', agents: 'all agents', readers: 'readers' };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function buildTopics() {
  const [TT, TP] = await Promise.all(['data/topic_tree.json', 'data/topic_paths.json'].map(u => fetch(u).then(r => r.json())));
  const cv = $('#tcv'), ctx = cv.getContext('2d'), leafIx = new Map(TT.order.map((id, i) => [id, i])), names = Object.fromEntries(TT.leaves.map(l => [l.id, l.name]));
  const nL = TT.order.length, rootH = TT.tree.height;
  const cop = TT.notes.find(t => /cophenetic/i.test(t)) || '';
  $('#tlede').innerHTML = `The circle is Wikipedia’s topics, placed by how their pages link. Curves are moves between topics; bars show where agents (orange) and people (blue) go.`;
  $('#tsrc').textContent = '';

  let who = 'agents', start = 1029, W = 0, H = 0, R = 0, cx = 0, cy = 0, DPR = Math.min(devicePixelRatio || 1, 2);
  const keys = ['agents', ...MODELS, 'readers'];
  $('#tgrounds').innerHTML = keys.map(k => `<a data-t="${k}" class="${k === 'readers' ? 'rd' : ''}${k === who ? ' on' : ''}">${SHORT[k]}</a>`).join('');
  document.querySelectorAll('#tgrounds a').forEach(a => a.onclick = () => { who = a.dataset.t; document.querySelectorAll('#tgrounds a').forEach(b => b.classList.toggle('on', b === a)); packets(); draw(); });
  const ts = $('#tstart'); S.derived.starts.forEach(([id, t]) => { const o = document.createElement('option'); o.value = id; o.textContent = t; if (id === start) o.selected = true; ts.appendChild(o); });
  ts.onchange = () => { start = +ts.value; packets(); };

  // positions: leaves on the rim, inner nodes at a radius set by their merge height
  const pos = new Map(), parent = new Map();
  function lay(n) {
    if (n.leaf != null) { const a = leafIx.get(n.leaf) / nL * Math.PI * 2 - Math.PI / 2; n.a = a; n.r = 1; pos.set('L' + n.leaf, n); return; }
    n.children.forEach(c => { lay(c); parent.set(c, n); });
    const ax = n.children.reduce((s, c) => s + Math.cos(c.a), 0), ay = n.children.reduce((s, c) => s + Math.sin(c.a), 0);
    n.a = Math.atan2(ay, ax); n.r = 1 - n.height / rootH; pos.set('N' + n.id, n);
  }
  lay(TT.tree);
  const anc = n => { const out = [n]; while (parent.has(n)) { n = parent.get(n); out.push(n); } return out; };
  const XY = n => [cx + Math.cos(n.a) * n.r * R, cy + Math.sin(n.a) * n.r * R];
  function route(a, b) { // control points: up from a to the common ancestor, down to b; straightened a little (beta = .85)
    const A = anc(pos.get('L' + a)), B = anc(pos.get('L' + b)), lca = A.find(x => B.includes(x));
    const pts = [...A.slice(0, A.indexOf(lca) + 1), ...B.slice(0, B.indexOf(lca)).reverse()].map(XY);
    const [x0, y0] = pts[0], [x1, y1] = pts[pts.length - 1], n = pts.length - 1;
    return pts.map(([x, y], i) => [.85 * x + .15 * (x0 + (x1 - x0) * i / n), .85 * y + .15 * (y0 + (y1 - y0) * i / n)]);
  }
  function curve(p) { ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my); } ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]); }
  function along(p, t) { // point at fraction t along the control polyline
    const seg = []; let L = 0; for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); seg.push(d); L += d; }
    let s = t * L; for (let i = 0; i < seg.length; i++) { if (s <= seg[i] || i === seg.length - 1) { const f = seg[i] ? s / seg[i] : 0; return [p[i][0] + (p[i + 1][0] - p[i][0]) * f, p[i][1] + (p[i + 1][1] - p[i][1]) * f]; } s -= seg[i]; }
  }
  const routes = new Map(); const rt = (a, b) => { const k = a + '>' + b; if (!routes.has(k)) routes.set(k, route(a, b)); return routes.get(k); };

  function size() {
    const box = cv.parentElement.getBoundingClientRect(); W = Math.min(box.width, 1180); H = W < 600 ? 400 : Math.min(Math.max(520, W * .7), 800);
    cv.style.height = H + 'px'; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = H / 2; R = Math.min(W, H) / 2 - (W < 600 ? 104 : 150); routes.clear();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    // tree
    ctx.strokeStyle = 'rgba(189,178,153,.45)'; ctx.lineWidth = 1;
    (function edges(n) { if (!n.children) return; const [px, py] = XY(n); n.children.forEach(c => { const [qx, qy] = XY(c); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx + Math.cos(c.a) * n.r * R, cy + Math.sin(c.a) * n.r * R); ctx.lineTo(qx, qy); ctx.stroke(); edges(c); }); })(TT.tree);
    // flows
    const fl = (TT.flows[who] || []).filter(f => f[0] !== f[1] && f[0] >= 0 && f[1] >= 0 && pos.has('L' + f[0]) && pos.has('L' + f[1]));
    const mx = Math.max(1, ...fl.map(f => f[2])), rd = who === 'readers';
    ctx.setLineDash(rd ? [5, 4] : []);
    fl.sort((a, b) => a[2] - b[2]).forEach(([a, b, c]) => {
      const t = Math.sqrt(c / mx); if (t < .09) return;
      ctx.strokeStyle = rd ? `rgba(127,178,214,${.25 + .7 * t})` : `rgba(243,154,74,${.06 + .55 * t})`; ctx.lineWidth = .5 + 2.6 * t;
      ctx.beginPath(); curve(rt(a, b)); ctx.stroke();
    });
    ctx.setLineDash([]);
    // bars and names
    const mA = TT.mass[who === 'readers' ? 'agents' : who] || {}, mR = TT.mass.readers || {}, big = Math.max(...Object.values(mA), ...Object.values(mR));
    const BL = W < 600 ? 26 : 64, nm = s => W < 600 && s.length > 11 ? s.slice(0, 10) + '…' : s;
    TT.order.forEach(id => {
      const n = pos.get('L' + id), c = Math.cos(n.a), s = Math.sin(n.a), r0 = R + 8;
      const a1 = (mA[id] || 0) / big * BL, a2 = (mR[id] || 0) / big * BL, off = .012;
      ctx.lineWidth = 4; ctx.strokeStyle = '#f39a4a'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(n.a - off) * r0, cy + Math.sin(n.a - off) * r0); ctx.lineTo(cx + Math.cos(n.a - off) * (r0 + a1), cy + Math.sin(n.a - off) * (r0 + a1)); ctx.stroke();
      ctx.strokeStyle = '#7fb2d6'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(n.a + off) * r0, cy + Math.sin(n.a + off) * r0); ctx.lineTo(cx + Math.cos(n.a + off) * (r0 + a2), cy + Math.sin(n.a + off) * (r0 + a2)); ctx.stroke();
      ctx.save(); ctx.translate(cx + c * (r0 + BL + 8), cy + s * (r0 + BL + 8)); const flip = c < 0; ctx.rotate(flip ? n.a + Math.PI : n.a);
      ctx.fillStyle = '#e6dcc3'; ctx.font = `italic 400 ${W < 600 ? 10.5 : 14}px Newsreader, Georgia, serif`; ctx.textAlign = flip ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.fillText(nm(names[id]), 0, 0); ctx.restore();
    });
    // packets
    for (const p of pk) { const pt = p.at; if (!pt) continue; ctx.fillStyle = '#ffd09a'; ctx.strokeStyle = '#14110d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pt[0], pt[1], 3.6, 0, 7); ctx.stroke(); ctx.fill(); }
    // legend
    ctx.font = '500 10px "Hanken Grotesk", sans-serif'; ctx.fillStyle = '#8a8168'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(rd ? 'PEOPLE’S FIRST CLICKS' : `MOVES BY ${SHORT[who].toUpperCase()}`, 4, H - 8);
  }
  // packets: up to 36 runs from the chosen start hop topic to topic
  let pk = [], T = 0, last = 0;
  function packets() {
    pk = [];
    if (who !== 'readers') for (const r of TP.runs) { if (r.s !== start || (who !== 'agents' && r.m !== who) || !MODELS.includes(r.m)) continue; const q = r.q.filter(x => x >= 0 && pos.has('L' + x)); if (q.length > 1) pk.push({ q, at: null }); if (pk.length >= 36) break; }
    T = 0;
  }
  function tick(now) {
    requestAnimationFrame(tick);
    if ($('#topics').hidden || document.hidden) { last = now; return; }
    const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; if (!pk.length && T > 0) return;
    T += RM ? 0 : dt * .9;
    pk.forEach((p, i) => { const L = p.q.length - 1, t = (T + i * .37) % (L + 1.5), h = Math.min(L - 1, Math.floor(t)), f = Math.min(1, t - h);
      const a = p.q[h], b = p.q[h + 1]; p.at = a === b ? XY(pos.get('L' + a)) : along(rt(a, b), 1 - Math.pow(1 - f, 2)); });
    draw();
  }
  addEventListener('resize', () => { size(); draw(); });
  size(); packets(); draw(); requestAnimationFrame(tick);
}
