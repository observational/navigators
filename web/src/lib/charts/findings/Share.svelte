<script>
  // svelte-ignore state_referenced_locally
  let { v } = $props();
  const bw = 225, rh = 46;
  const pct = n => Math.round(n * 100) + '%';
</script>
<svg class="fv" viewBox="0 0 300 100" role="img" aria-hidden="true">
  {#each v.rows as r, i}
    {@const y = 4 + i * rh}
    <text class="lab" x="0" y={y + 10}>{r.label}</text>
    <rect class="bar trkbar" x="0" y={y + 18} width={bw} height="10" rx="3"/>
    <rect class="bar {i === 0 ? 'dimf' : 'agent'}" x="0" y={y + 18} width={r.v * bw} height="10" rx="3"/>
    <text class="val" x={bw + 8} y={y + 27}>{pct(r.v)}</text>
  {/each}
</svg>
