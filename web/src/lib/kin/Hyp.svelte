<script>
  import { S } from '../data.js';
  let { vw } = $props();
  const H = S.stats.hyptrails, RH = 30;
  const mob = $derived(vw < 760), W = $derived(Math.min(980, vw - (mob ? 32 : 48))), LW = $derived(mob ? 168 : 260);
  const mid = $derived(LW + 14 + (mob ? 40 : 120)), x1 = $derived(W - 20);
  const mx = Math.max(...H.rows.map(r => Math.abs(r.e))), h = H.rows.length * RH + 30;
  const xs = e => mid + e / mx * (x1 - mid);
</script>

<svg width={W} height={h} role="img" aria-label="Which simple explanation predicts a model's first click best">
  <line class="rule" x1={mid} x2={mid} y1="0" y2={H.rows.length * RH} />
  {#each H.rows as r, i}
    {@const y = i * RH + 15}
    {@const pos = r.e > 0}
    {@const col = pos ? (i === 0 ? 'var(--road)' : 'var(--bone)') : 'var(--dim)'}
    <text class="lab{i === 0 ? ' em' : ''}" x={LW} y={y + 5} text-anchor="end" font-style="italic">{r.label.replace(/ \(.*?\)/, '')}</text>
    <rect x={Math.min(mid, xs(r.e))} y={y - 4} width={Math.abs(xs(r.e) - mid)} height="8" fill={col} opacity={pos ? .9 : .5}><title>{r.label}</title></rect>
  {/each}
  <text class="ax" x={mid + 6} y={H.rows.length * RH + 16}>BETTER →</text>
  <text class="ax" x={mid - 6} y={H.rows.length * RH + 16} text-anchor="end">← WORSE</text>
</svg>
