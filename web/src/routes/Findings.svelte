<script>
  import { onMount } from 'svelte';
  import { getJSON } from '../lib/data.js';
  import Card from '../lib/findings/Card.svelte';
  let { active, onready } = $props();
  let D = $state(null);
  onMount(async () => {
    D = await getJSON('findings_public.json');
    await Promise.resolve();
    onready();
  });
</script>

<section id="findings" class="page" hidden={!active}>
  {#if D}
    <div class="fwrap"><h1>{D.title}</h1><p class="flead">{D.lede}</p>
      {#each D.groups as g}
        <section class="fgroup {g.id}"><div class="fgh"><h2>{g.title}</h2><p>{g.sub}</p></div>
          <div class="fgrid">{#each g.cards as c}<Card {c} />{/each}</div></section>
      {/each}
    </div>
  {/if}
</section>
