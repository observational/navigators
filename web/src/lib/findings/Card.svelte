<script>
  import Dots from '../charts/findings/Dots.svelte';
  import Pictogram from '../charts/findings/Pictogram.svelte';
  import Bars from '../charts/findings/Bars.svelte';
  import Share from '../charts/findings/Share.svelte';
  import Ratio from '../charts/findings/Ratio.svelte';
  import BeforeAfter from '../charts/findings/BeforeAfter.svelte';
  import Dotgrid from '../charts/findings/Dotgrid.svelte';
  let { c } = $props();
  const VIZ = { dots: Dots, pictogram: Pictogram, bars: Bars, share: Share, ratio: Ratio, before_after: BeforeAfter, dotgrid: Dotgrid };
  // svelte-ignore state_referenced_locally
  const Viz = VIZ[c.viz?.type];
</script>
<article class="fcard"><h3>{c.headline}</h3><p class="one">{c.line}</p>
  {#if c.big}<div class="big"><b>{c.big}</b>{#if c.big_caption}<span>{c.big_caption}</span>{/if}</div>{/if}
  <div class="fig2">{#if Viz}<Viz v={c.viz} />{/if}</div>
  {#if c.quote}<blockquote>{c.quote}</blockquote>{/if}
  {#if c.chips}<div class="chips">{#each c.chips as x}<span>{x}</span>{/each}</div>{/if}
</article>
