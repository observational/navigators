<script>
  // svelte-ignore state_referenced_locally
  let { v } = $props();
  // svelte-ignore state_referenced_locally
  const W = 300, gx = 14, gap = (W - 28) / (v.n - 1), py = 112, pg = 40;
  // svelte-ignore state_referenced_locally
  const full = Math.floor(v.effective), part = v.effective - full, nP = full + 1;
  const sx = (W - (nP - 1) * pg) / 2;
  const px = Array.from({ length: nP }, (_, i) => sx + i * pg);
  // svelte-ignore state_referenced_locally
  const chips = Array.from({ length: v.n }, (_, i) => {
    const x = gx + i * gap;
    return { x, tx: px[Math.min(nP - 1, Math.floor(i * nP / v.n))] };
  });
</script>
<svg class="fv" viewBox="0 0 {W} 182" role="img" aria-hidden="true">
  {#each chips as c}
    <path class="flow" d="M{c.x} 36 C{c.x} 74 {c.tx} 64 {c.tx} 100"/>
    <rect class="chip" x={c.x - 8} y="18" width="16" height="16" rx="4"/><circle class="chipEye" cx={c.x} cy="26" r="2.4"/>
  {/each}
  {#each px as x, i}
    {@const f = i < full ? 1 : part}
    {@const d = `M${x - 11} ${py + 32} v-12 a11 11 0 0 1 22 0 v12 z`}
    {#if f >= 1}
      <g class="ppl"><circle cx={x} cy={py} r="7"/><path {d}/></g>
    {:else}
      <g class="ppl faint"><circle cx={x} cy={py} r="7"/><path {d}/></g>
      <clipPath id="pc{i}"><rect x={x - 12} y={py - 8} width={24 * f} height="50"/></clipPath>
      <g class="ppl" clip-path="url(#pc{i})"><circle cx={x} cy={py} r="7"/><path {d}/></g>
    {/if}
  {/each}
  <text class="lab lft" x="0" y="10">{v.labels[0]}</text>
  <text class="lab ice" x={W / 2} y="172" text-anchor="middle">{v.labels[1]}</text>
</svg>
