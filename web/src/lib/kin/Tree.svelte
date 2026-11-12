<script>
  import { S, FCOL } from '../data.js';
  import { sigil } from './sigil.js';
  let { vw } = $props();
  const K = S.kin, byLabel = Object.fromEntries(S.mv2.models.map(m => [m.label, m]));
  const RH = 64, pad = 14, root = K.tree.height;
  const leaves = [], paths = [];
  const mob = $derived(vw < 760), W = $derived(Math.min(980, vw - (mob ? 32 : 48))), LW = $derived(mob ? 176 : 300), TW = $derived(W - LW - 10);
  (function walk(n) { if (n.name) leaves.push(n); else n.children.forEach(walk); })(K.tree);
  // layout (y) does not depend on width; x is computed from TW
  let li = 0;
  (function lay(n) {
    if (n.name) { n.y = li++ * RH + RH / 2; return; }
    n.children.forEach(lay); n.y = n.children.reduce((s, c) => s + c.y, 0) / n.children.length;
  })(K.tree);
  const X = h => pad + (root - h) / root * (TW - pad);
  const segs = $derived.by(() => {
    const out = [];
    (function f(n) { if (n.name) return; n.children.forEach(c => { out.push(`M${X(n.height)},${n.y}V${c.y}H${X(c.name ? 0 : c.height)}`); f(c); }); })(K.tree);
    return out;
  });
  function draw(cv, l) {
    const m = byLabel[l.name];
    if (!m) { cv.width = cv.height = 56; const x = cv.getContext('2d'); x.fillStyle = '#14110d'; x.fillRect(0, 0, 56, 56); x.strokeStyle = '#7fb2d6'; x.lineWidth = 2; x.setLineDash([3, 3]); x.beginPath(); x.arc(28, 28, 20, 0, 7); x.stroke(); }
    else sigil(cv, m.key, FCOL[m.family], 56);
  }
</script>

<div id="tree" style:height="{leaves.length * RH + 34}px">
  <svg width={TW} height={leaves.length * RH + 30}>
    {#each segs as d}<path class="" {d} />{/each}
    <text x={X(0)} y={leaves.length * RH + 22} text-anchor="end" font-size="13">more alike →</text>
  </svg>
  {#each leaves as l}
    <div class="row" style:top="{l.y - RH / 2}px" style:left="{TW + 10}px">
      <canvas use:draw={l}></canvas>
      <div class="nm">{l.name}</div>
    </div>
  {/each}
</div>
