<script>
  import { S } from '../data.js';
  let { vw } = $props();
  const L = S.stats.ladder;
  const mob = $derived(vw < 760), W = $derived(Math.min(980, vw - (mob ? 32 : 48))), LW = $derived(mob ? 168 : 260);
  const x0 = $derived(LW + 14), x1 = $derived(W - 40), RH = $derived(mob ? 30 : 32), H = $derived(L.length * RH + 34);
  const xs = v => x0 + v / 0.7 * (x1 - x0), top = 10;
  const colOf = r => r.who === 'readers' ? 'var(--ice)' : r.who === 'mixed' ? 'var(--dim)' : 'var(--road)';
  const p = v => Math.round(v * 100);
</script>

<svg width={W} height={H} role="img" aria-label="How often two choices from the same page pick the same link">
  {#each [0, .2, .4, .6] as t}
    <line class="rule" x1={xs(t)} x2={xs(t)} y1={top - 6} y2={top + L.length * RH - 10} />
    <text class="ax" x={xs(t)} y={top + L.length * RH + 8} text-anchor="middle">{p(t)}%</text>
  {/each}
  {#each L as r, i}
    {@const y = top + i * RH + 8}
    {@const col = colOf(r)}
    <text class="lab{r.mark ? ' em' : ''}" x={LW} y={y + 5} text-anchor="end" font-style="italic">{r.label}</text>
    <line x1={xs(0)} x2={xs(r.v)} y1={y} y2={y} stroke={col} stroke-width={r.mark ? 2 : 1} stroke-dasharray={r.who === 'readers' ? '4 3' : null} opacity={r.mark ? 1 : .6}><title>{r.label}: {p(r.v)}%</title></line>
    <circle cx={xs(r.v)} cy={y} r={r.mark ? 5.5 : 4} fill={r.who === 'readers' ? 'var(--ground)' : col} stroke={col} stroke-width="1.5"><title>{r.label}: {p(r.v)}%</title></circle>
    <text class="val" x={xs(r.v) + 12} y={y + 4}>{p(r.v)}%</text>
  {/each}
  <text class="ax" x={x1} y={top + L.length * RH + 24} text-anchor="end">SAME LINK, SAME PAGE</text>
</svg>
