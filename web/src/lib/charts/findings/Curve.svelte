<script>
  // One line against the diagonal: what n models are worth, against n if each were independent.
  // svelte-ignore state_referenced_locally
  let { v } = $props();
  // svelte-ignore state_referenced_locally
  const n = v.points.length, x0 = 22, x1 = 250, y0 = 164, y1 = 30;
  const X = k => x0 + (k - 1) / (n - 1) * (x1 - x0), Y = y => y0 - y / n * (y0 - y1);
  // svelte-ignore state_referenced_locally
  const d = v.points.map((p, i) => `${i ? 'L' : 'M'}${X(i + 1).toFixed(1)} ${Y(p).toFixed(1)}`).join('');
  // svelte-ignore state_referenced_locally
  const last = v.points[n - 1];
</script>
<svg class="fv" viewBox="0 0 300 196" role="img" aria-hidden="true">
  <text class="cap" x="0" y="10">{v.y_label}</text>
  <line class="trk" x1={x0} x2={x1} y1={y0} y2={y0}/>
  {#each [1, 5, n] as k}
    <text class="cap" x={X(k)} y={y0 + 14} text-anchor="middle">{k}</text>
  {/each}
  <text class="cap" x={x1} y={y0 + 28} text-anchor="end">{v.x_label}</text>
  <line class="ideal" x1={X(1)} y1={Y(1)} x2={X(n)} y2={Y(n)}/>
  <text class="lab sm dimt" x={X(n) - 6} y={Y(n) + 4} text-anchor="end">{v.ideal_label}</text>
  <text class="val" x={X(n) + 8} y={Y(n) + 4}>{n}</text>
  <path class="ln" {d}/>
  {#each v.points as p, i}<circle class="dotA" cx={X(i + 1)} cy={Y(p)} r={i === n - 1 ? 5 : 2.5}/>{/each}
  <text class="val" x={X(n) + 8} y={Y(last) + 4}>{last}</text>
</svg>
