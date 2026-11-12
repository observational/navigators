<script>
  // svelte-ignore state_referenced_locally
  let { v } = $props();
  // svelte-ignore state_referenced_locally
  const cols = 10, rows = Math.ceil(v.n / cols), step = 26, r = 9;
</script>
<svg class="fv" viewBox="0 0 300 {rows * step - 8}" role="img" aria-hidden="true">
  {#each Array.from({ length: v.n }, (_, i) => i) as i}
    <circle class={i < v.k ? 'dotA' : 'dotDim'} cx={8 + (i % cols) * step + 10} cy={12 + Math.floor(i / cols) * step} r={r - (i < v.k ? 2 : 4)}/>
  {/each}
</svg>
