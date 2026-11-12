<script>
  // svelte-ignore state_referenced_locally
  let { v } = $props();
  const x0 = 0, x1 = 250, s = x1 / 0.6, top = 26, rh = 44;
  const pct = n => Math.round(n * 100) + '%';
  // svelte-ignore state_referenced_locally
  const h = top + v.rows.length * rh - 10;
</script>
<svg class="fv" viewBox="0 0 300 {h}" role="img" aria-hidden="true">
  {#if v.unit}<text class="cap" x="0" y="10">{v.unit}</text>{/if}
  {#each v.rows as r, i}
    {@const y = top + i * rh}
    {@const cx = r.v * s}
    <text class="lab" x="0" y={y}>{r.label}</text>
    <line class="trk" x1={x0} x2={x1} y1={y + 16} y2={y + 16}/>
    {#if r.who === 'reader'}
      <line class="dash" x1={cx} x2={cx} y1={y + 6} y2={y + 26}/><circle class="hol" cx={cx} cy={y + 16} r="6"/>
    {:else}
      <line class="stem" x1="0" x2={cx} y1={y + 16} y2={y + 16}/><circle class="dotA" cx={cx} cy={y + 16} r="6"/>
    {/if}
    <text class="val" x={cx + 12} y={y + 20}>{pct(r.v)}</text>
  {/each}
</svg>
