<script>
  // svelte-ignore state_referenced_locally
  let { v, noCap = false, colors = null } = $props();
  // svelte-ignore state_referenced_locally
  const left = 0, bw = 205, rh = 38, top = noCap || !v.unit ? 8 : 28;
  const pct = n => Math.round(n * 100) + '%';
  // svelte-ignore state_referenced_locally
  const ref = v.reference;
  // svelte-ignore state_referenced_locally
  const mx = Math.max(...v.rows.map(r => r.v), ref ? ref.v : 0);
  const s = bw / (mx || 1);
  // svelte-ignore state_referenced_locally
  const h = top + v.rows.length * rh;
  const rx = ref ? ref.v * s : 0;
  const H = ref ? h + 14 : h - 4;
</script>
<svg class="fv" viewBox="0 0 300 {H}" role="img" aria-hidden="true">
  {#if v.unit}<text class="cap" x="0" y="10">{v.unit}</text>{/if}
  {#each v.rows as r, i}
    {@const y = top + i * rh}
    {@const w = Math.max(r.v * s, 2)}
    <text class="lab" x="0" y={y + 10}>{r.label}</text>
    <rect class="bar {colors ? colors[i] : 'agent'}" x={left} y={y + 16} width={w} height="8" rx="2"/>
    <text class="val" x={w + 8} y={y + 24}>{r.text ?? pct(r.v)}</text>
  {/each}
  {#if ref}
    {#each v.rows as r, i}
      {@const y = top + i * rh}
      <line class="dash" x1={rx} x2={rx} y1={y + 12} y2={y + 28}/>
    {/each}
    <text class="lab ice sm" x={rx} y={h + 6}>- - {ref.label} {pct(ref.v)}</text>
  {/if}
</svg>
