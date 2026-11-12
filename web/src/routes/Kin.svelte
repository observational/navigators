<script>
  import { onMount } from 'svelte';
  import { load } from '../lib/data.js';
  import { loadSigils } from '../lib/kin/sigil.js';
  import Ladder from '../lib/kin/Ladder.svelte';
  import Hyp from '../lib/kin/Hyp.svelte';
  import Plates from '../lib/kin/Plates.svelte';
  let { active, onready } = $props();
  let ready = $state(false), vw = $state(innerWidth);
  onMount(async () => {
    await load(); await loadSigils();
    ready = true;
    await Promise.resolve(); onready();
  });
</script>

<svelte:window bind:innerWidth={vw} />

<section id="kin" class="page" hidden={!active}>
  <div class="col">
    <h1>Different makers, same picks.</h1>
    <p class="lede">Shown the same page, two different models pick the same link four times as often as two people.</p>
    <div class="fig" id="ladder">{#if ready}<Ladder {vw} />{/if}</div>
    <p class="lede small">DeepSeek and MiMo come from different companies. They agree about as often as one model agrees with itself.</p>
    <h2>What predicts a model&rsquo;s click</h2>
    <p class="lede small">The best guide to a model&rsquo;s click is what the other models clicked. What people click comes second.</p>
    <div class="fig" id="hyp">{#if ready}<Hyp {vw} />{/if}</div>
    <h2>The eight models</h2>
    <p class="lede small">They sound different and pick alike. One line from each, in its own words, beside the models it most and least resembles.</p>
    {#if ready}<Plates />{:else}<div id="plates"></div>{/if}
    <p class="src" id="ksrc"></p>
  </div>
</section>
