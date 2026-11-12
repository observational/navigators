<script>
  import { onMount } from 'svelte';
  import { showStart } from '../lib/map/bridge.js';
  import { S, FAMS, load, getJSON } from '../lib/data.js';
  import { SH, TYPES, GROUPS, DROP, JARGON, LEAD, trim, FNAME, hash } from '../lib/log/model.js';
  let { active, onready } = $props();

  const col = 'var(--road)';
  let events = $state([]), ordered = $state([]), mappedIds = $state(new Set());
  let types = $state([]), famSel = $state([]), shown = $state(30);
  let ready = $state(false);

  const mapped = e => e.replay && e.replay !== 'search' && mappedIds.has(+e.replay);
  const fams = $derived([...FAMS, 'other'].filter(f => events.some(e => e.family === f)));
  const hits = $derived(ordered.filter(e => (!types.length || types.includes(e.type)) && (!famSel.length || famSel.includes(e.family))));
  const toggle = (arr, k) => arr.includes(k) ? arr.filter(x => x !== k) : [...arr, k];
  const clear = () => { types = []; famSel = []; shown = 30; };
  const pick = (kind, k) => { if (kind === 't') types = toggle(types, k); else famSel = toggle(famSel, k); shown = 30; };

  function go(id) {
    showStart(id);
    location.hash = '#landscape';
  }

  onMount(async () => {
    await load();
    const raw = await getJSON('events.json');
    const ev = raw.filter(e => !DROP.has(e.type) && e.quote && !JARGON.test(e.quote)).map(e => ({ ...e, quote: trim(e.quote) }));
    mappedIds = new Set(S.derived.starts.map(s => s[0]).filter(id => S.fh.starts.some(s => s.page_id === id)));
    events = ev;
    ordered = ev.map(e => [hash(e.id), e]).sort((a, b) => LEAD.has(b[1].type) - LEAD.has(a[1].type) || a[0] - b[0]).map(r => r[1]);
    ready = true;
    await Promise.resolve();
    onready();
  });
</script>

{#snippet shape(i)}
  <svg width="12" height="12" viewBox="0 0 12 12" fill={col} stroke={col} aria-hidden="true">{@html SH[i]}</svg>
{/snippet}

<section id="log" class="page" hidden={!active}>
  <div class="col">
    <h1>Field log</h1>
    <p class="lede" id="loglede">{ready ? 'What the models wrote while choosing. The first ones wonder whether they are being tested.' : ''}</p>
    <div id="logfilters">
      {#each GROUPS as [g, lab]}
        <div class="ctl"><span class="k">{lab}</span><span class="opts">
          {#each Object.entries(TYPES).filter(([t, v]) => v[1] === g && events.some(e => e.type === t)) as [t, v]}
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_missing_attribute -->
            <a class:on={types.includes(t)} onclick={() => pick('t', t)}>{v[0]}</a>
          {/each}
        </span></div>
      {/each}
      {#if ready}
        <div class="ctl"><span class="k">model family</span><span class="opts">
          {#each fams as f}
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_missing_attribute -->
            <a class="fam" class:on={famSel.includes(f)} style="--c:{col}" onclick={() => pick('f', f)}>{#if FAMS.includes(f)}{@render shape(FAMS.indexOf(f))}{/if}{FNAME[f]}</a>
          {/each}
        </span></div>
      {/if}
    </div>
    <p id="logtype"></p>
    <div class="logbar"><span id="logn"></span><!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_missing_attribute --><a id="logclear" onclick={clear}>clear filters</a></div>
    <div id="loglist">
      {#each hits.slice(0, shown) as e (e.id)}
        {@const t = TYPES[e.type] || [e.type.replace(/_/g, ' ')]}
        <article class="ev">
          <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
          <p class="q" tabindex="0" onclick={ev => ev.currentTarget.classList.toggle('open')}>{e.quote}</p>
          <p class="meta"><b>{t[0]}</b><span style="color:{col}">{#if FAMS.includes(e.family)}{@render shape(FAMS.indexOf(e.family))}{/if}{(e.model_label || e.model || FNAME[e.family]).replace(/\s*\(.*?\)/g, '')}</span><span>{e.start_title || ''}</span><span>step {e.k}</span>{#if mapped(e)}<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_missing_attribute --><a class="go" onclick={() => go(+e.replay)}>show on the map</a>{/if}</p>
        </article>
      {:else}
        {#if ready}<p class="lede small">Nothing matches that combination.</p>{/if}
      {/each}
    </div>
    <button id="logmore" type="button" hidden={hits.length <= shown} onclick={() => shown += 30}>more</button>
    <p class="src" id="logsrc"></p>
  </div>
</section>
