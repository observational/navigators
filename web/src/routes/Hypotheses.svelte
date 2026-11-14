<script>
  // Hypotheses tab: the hypotheses written down before the main runs, and where each one stands.
  // Content lives in public/data/hypotheses.json, so verdicts can change without touching this file.
  import { onMount } from 'svelte';
  import { getJSON } from '../lib/data.js';
  let { active, onready } = $props();
  let D = $state(null);
  onMount(async () => {
    D = await getJSON('hypotheses.json');
    await Promise.resolve();
    onready();
  });
  // In-page jumps without touching the hash, which the router owns.
  function jump(id) {
    document.getElementById('hg-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<section id="hypotheses" class="page" hidden={!active}>
  {#if D}
    <div class="col">
      <h1>{D.title}</h1>
      <p class="lede">{D.lede}</p>
      <p class="hkey">{#each Object.entries(D.statuses) as [k, lab]}<span class="hs {k}">{lab}</span>{/each}</p>
      <ul class="hjump">
        {#each D.groups as g (g.id)}
          <li><button type="button" onclick={() => jump(g.id)}>{g.title}<span class="n">{g.items.length}</span></button></li>
        {/each}
      </ul>

      {#each D.groups as g (g.id)}
        <h2 class="sec" id={'hg-' + g.id}>{g.title}</h2>
        {#if g.lede}<p class="lede small">{g.lede}</p>{/if}
        <ol class="hlist" class:compact={g.compact}>
          {#each g.items as h (h.id)}
            <li class="hrow">
              <span class="hid">{h.id}</span>
              <div class="hbody">
                <h3>{h.short}</h3>
                <p class="htext">{h.text}</p>
                <p class="hverdict"><span class="hs {h.status}">{D.statuses[h.status]}</span><span class="hv">{h.verdict}</span></p>
                {#if h.evidence}<p class="hev">{h.evidence}</p>{/if}
                {#if h.test}<p class="htest"><b>What would test it</b>{h.test}</p>{/if}
              </div>
            </li>
          {/each}
        </ol>
      {/each}

      {#if D.found}
        <h2 class="sec">{D.found.title}</h2>
        <p class="lede small">{D.found.lede} <a href="#findings" class="hlink">Open Findings</a></p>
        <ul class="hfound">{#each D.found.items as x}<li>{x}</li>{/each}</ul>
      {/if}

      {#if D.next}
        <h2 class="sec">{D.next.title}</h2>
        <ul class="hfound">{#each D.next.items as x}<li>{x}</li>{/each}</ul>
      {/if}

      <p class="src">{D.source}</p>
    </div>
  {/if}
</section>
