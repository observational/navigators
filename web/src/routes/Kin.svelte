<script>
  import { onMount } from 'svelte';
  import { S, load } from '../lib/data.js';
  import { loadSigils } from '../lib/kin/sigil.js';
  import Ladder from '../lib/kin/Ladder.svelte';
  import Hyp from '../lib/kin/Hyp.svelte';
  import Tree from '../lib/kin/Tree.svelte';
  import Plates from '../lib/kin/Plates.svelte';
  let { active, onready } = $props();
  let ready = $state(false), vw = $state(innerWidth);
  let ladlede = $state('');
  onMount(async () => {
    await load(); await loadSigils();
    const D = Object.fromEntries(S.stats.ladder.map(r => [r.key, r.v]));
    ladlede = `Different models pick the same link about ${Math.round(D.dmsc / D.hh)}x as often as two people do.`;
    ready = true;
    await Promise.resolve(); onready();
  });
</script>

<svelte:window bind:innerWidth={vw} />

<section id="kin" class="page" hidden={!active}>
  <div class="col">
    <h1>Eight models, one herd.</h1>
    <p class="lede" id="ladlede">{ladlede}</p>
    <div class="fig" id="ladder">{#if ready}<Ladder {vw} />{/if}</div>
    <h2>What predicts a model&rsquo;s first click</h2>
    <p class="lede small" id="hyplede">{ready ? 'A model’s first click is best guessed from what other models clicked, not from what people click.' : ''}</p>
    <div class="fig" id="hyp">{#if ready}<Hyp {vw} />{/if}</div>
    <p class="fine kin" id="hypnote"></p>
    <h2>Who is kin to whom</h2>
    <p class="lede small" id="klede">{ready ? 'Models that pick alike sit close together. People sit apart from all of them.' : ''}</p>
    {#if ready}<Tree {vw} />{:else}<div id="tree"></div>{/if}
    <h2>Sigils</h2>
    <p class="lede small">Each model has its own drawing, shaped by how it behaves.</p>
    {#if ready}<Plates />{:else}<div id="plates"></div>{/if}
    <p class="src" id="ksrc"></p>
  </div>
</section>
