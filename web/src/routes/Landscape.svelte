<script>
  // Landscape tab: side panel, controls, legend and captions in markup; the three.js scene lives in lib/map/scene.js.
  import { onMount } from 'svelte';
  import { S, load, MODELS, esc } from '../lib/data.js';
  import { createMap } from '../lib/map/scene.js';
  import { SHORT, keyHtml } from '../lib/map/shapes.js';
  import { register, unregister } from '../lib/map/bridge.js';

  let { active, onready } = $props();

  let ready = $state(false), noGl = $state(false);
  let cur = $state('all'), startId = $state(1029), ink = $state(0), lift = $state(0), plan = $state(false);
  let regOn = $state(false);
  let playing = $state(true), canonOn = $state(false), voicesOpen = $state(false), vI = $state(0);
  let open = $state({});
  let map = null;
  let canvas, leaders, labels, names, regions, tip, startEl = $state();

  const GKEYS = ['all', ...MODELS, 'readers'];
  const inN = v => `${Math.max(1, Math.round(v * 10))} in 10`;
  let finds = $state.raw([]), starts = $state.raw([]);

  function setup() {
    // the three claims of the Findings page, one line each; page titles come from stats.json
    const CN = S.stats.canon;
    const cTitle = i => S.byId.has(CN.pages[i].id) ? S.nodes[S.byId.get(CN.pages[i].id)].t : '';
    finds = [
      { n: '4×', t: 'Two different models pick the same link four times as often as two people', x: 'They were never in contact: every run is separate.' },
      { n: '1 line', t: 'One added sentence cuts their pacing between two pages by two thirds', x: 'Much of what looks like character comes from the setup.' },
      { n: '36 of 80', t: 'From a blank page with a search box, nearly half open on the same few curiosities', canon: `${cTitle(0)} and ${cTitle(1)} lead. Following links, they scatter instead.` },
    ];
    starts = S.derived.starts.filter(([id]) => S.fh.starts.some(s => s.page_id === id));
  }

  function modelNote(k) {
    const F = S.facts;
    if (k === 'readers') return `<b>Human readers</b>: where people click first from the same pages.`;
    const m = F.models[k]; if (!m) return '';
    if (k === 'all') return `<b>All eight models</b>`;
    const sr = m.step1_stop_reason, bo = m.blank_page_openings;
    let s = `<b>${esc(m.label)}</b>. `;
    if (sr && sr.n_step1_stops && !sr.small_n) s += sr.no_task >= .5 ? `When it stops at once, ${inN(sr.no_task)} times the reason is that nobody asked for anything. ` : `When it stops at once, ${inN(sr.page_sufficient)} times the reason is that the page already says enough. `;
    else if (bo && bo.top3 && bo.top3.length) s += `On a blank page it opens ${esc(bo.top3[0].page)}. `;
    if (m.quote) s += `<q>${esc(m.quote.text)}</q>`;
    return s;
  }

  const st = $derived(ready ? S.fh.starts.find(s => s.page_id === startId) : null);
  const items = $derived(ready && st ? S.st.items.filter(i => i.start === st.start) : []);
  const item = $derived(items.length ? items[vI % items.length] : null);
  const itemLabel = $derived(item ? (Object.values(S.mod).find(m => m.id === item.model)?.label || item.model) : '');

  function setGround(k) { cur = k; map?.setGround(k); }
  function pickStart(id) { vI = 0; startId = id; map?.setStart(id); }
  function setInk(v) { ink = v; map?.setInk(v); }
  function setLift(v) { lift = v; map?.setLift(v); }
  function setView(p) { plan = p; map?.setView(p); }
  function setReg(on) { regOn = on; map?.setRegions(on); }
  function togglePlay() { playing = !playing; map?.setPlaying(playing); }
  function toggleCanon(on) { map?.showCanon(on); canonOn = map ? map.isCanon() : false; }
  const toggleOpen = i => open[i] = !open[i];

  $effect(() => { map?.setActive(active); });

  onMount(() => {
    let alive = true, bridge;
    (async () => {
      await load();
      if (!alive) return;
      setup();
      ready = true;
      await Promise.resolve();
      // direct listener: other tabs may dispatch a non-bubbling `change` on #start (the old contract)
      startEl.addEventListener('change', e => pickStart(+e.currentTarget.value));
      map = createMap({ canvas, leaders, labels, names, regions, tip });
      playing = map.playing;
      noGl = !map.glOK;
      map.setActive(active);
      bridge = { showStart: id => { startId = id; vI = 0; map.setStart(id); const s = document.getElementById('start'); if (s) s.value = id; }, showCanon: on => toggleCanon(on ?? !map.isCanon()) };
      register(bridge);
      window.__cam = { overview: () => map.overview(), dolly: f => map.dolly(f), flyTo: (id, d, p) => map.flyTo(id, d, p), setGround, lift: v => setLift(+v), plan: () => setView(true), regions: on => setReg(on) };
      onready();
    })();
    return () => { alive = false; if (bridge) unregister(bridge); map?.dispose(); map = null; };
  });
</script>

<canvas id="gl" bind:this={canvas} style:visibility={active ? 'visible' : 'hidden'} style:display={noGl ? 'none' : null}></canvas>
<svg id="leaders" aria-hidden="true" bind:this={leaders} style:visibility={active ? 'visible' : 'hidden'}></svg>
<div id="regions" aria-hidden="true" bind:this={regions} style:visibility={active ? 'visible' : 'hidden'}></div>
<div id="labels" aria-hidden="true" bind:this={labels} style:visibility={active ? 'visible' : 'hidden'}></div>
<div id="names" aria-hidden="true" bind:this={names} style:visibility={active ? 'visible' : 'hidden'}></div>

<section id="landscape" hidden={!active}>
  <aside id="side">
    <h1>Left alone, different AIs make the same choices.</h1>
    {#if ready}
    <p class="setup" id="setup">We gave eight AI models Wikipedia and no task. Each orange trail is one run on its own; blue is where human readers click.</p>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events, a11y_no_noninteractive_tabindex -->
    <ol id="finds">{#each finds as h, i}<li tabindex="0" class:open={open[i]} onclick={e => { if (!e.target.closest('a')) toggleOpen(i); }} onkeydown={e => { if (e.key === 'Enter') toggleOpen(i); }}><span class="n" class:sm={h.n.length > 6}>{h.n}</span><span class="t">{h.t}</span><span class="x">{#if h.canon}{h.canon} <!-- svelte-ignore a11y_missing_attribute, a11y_click_events_have_key_events, a11y_no_static_element_interactions --><a class="act" onclick={e => { e.preventDefault(); toggleCanon(); }}>{canonOn ? 'Hide them' : 'Show them on the map'}</a>{:else}{h.x} <a href="#findings">See the findings</a>{/if}</span></li>{/each}</ol>
    <div class="ctls">
      <div class="ctl wrap"><span class="k">ground</span><span id="grounds">{#each GKEYS as k}<!-- svelte-ignore a11y_missing_attribute, a11y_click_events_have_key_events, a11y_no_static_element_interactions --><a class:rd={k === 'readers'} class:sp={S.wells.models[k]?.sparse} class:on={cur === k} onclick={() => setGround(k)}>{SHORT[k]}</a>{/each}</span></div>
      <p id="mnote">{@html modelNote(cur)}</p>
      <div class="ctl"><span class="k">start page</span><select id="start" aria-label="Start page" value={startId} bind:this={startEl}>{#each starts as [id, t]}<option value={id}>{t}</option>{/each}</select></div>
      <!-- svelte-ignore a11y_missing_attribute, a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="ctl"><span class="k">view</span><a class:on={!plan} onclick={() => setView(false)}>landscape</a><a class:on={plan} onclick={() => setView(true)}>plan</a></div>
      <!-- svelte-ignore a11y_missing_attribute, a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="ctl"><span class="k">roads</span><a class:on={lift === 0} onclick={() => setLift(0)}>on the ground</a><a class:on={lift === 1} onclick={() => setLift(1)}>lifted</a></div>
      <!-- svelte-ignore a11y_missing_attribute, a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="ctl"><span class="k">ink</span><a class:on={ink === 0} onclick={() => setInk(0)}>who</a><a class:on={ink === 1} onclick={() => setInk(1)}>which model</a></div>
      <!-- svelte-ignore a11y_missing_attribute, a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="ctl"><span class="k">regions</span><a class:on={!regOn} onclick={() => setReg(false)}>hidden</a><a class:on={regOn} onclick={() => setReg(true)}>named</a></div>
      <!-- svelte-ignore a11y_missing_attribute, a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="ctl"><span class="k">runs</span><a id="play" class="on" onclick={togglePlay}>{playing ? 'pause' : 'play'}</a><a id="overview" onclick={() => map?.overview()}>see the whole map</a></div>
      <div id="key">{@html keyHtml(ink)}</div>
      <p class="fine" id="fine">Low ground is where more runs passed. It records traffic; nothing pulls a run downhill. <a href="CREDITS.md">Credits</a></p>
    </div>
    {/if}
  </aside>
  <div id="bottom" hidden={noGl}>
    <p id="curator">{#if st}{inN(st.top.k / st.n_first_hop)} first moves from <b style="font-weight:500">{st.start}</b> went to {st.top.title}; readers lean to {st.readers.top_title}.<em><!-- svelte-ignore a11y_missing_attribute, a11y_click_events_have_key_events, a11y_no_static_element_interactions --><a id="sayl" onclick={() => voicesOpen = !voicesOpen}>said / thought</a></em>{/if}</p>
    <div id="voices" hidden={!voicesOpen}>{#if ready}{#if !item}<div class="h">no paired reasoning for this page</div>{:else}<div class="h"><span>{itemLabel} · step {item.step}</span><!-- svelte-ignore a11y_missing_attribute, a11y_click_events_have_key_events, a11y_no_static_element_interactions --><a id="vnext" onclick={() => vI++}>next {(vI % items.length) + 1} / {items.length}</a></div>
      <div class="v"><b>said</b><p>{item.said}</p></div><div class="v th"><b>thought</b><p>{item.thought}</p></div>{/if}{/if}</div>
  </div>
  <div id="zoom" hidden={noGl}><button id="zin" aria-label="Zoom in" onclick={() => map?.dolly(.62)}>+</button><button id="zout" aria-label="Zoom out" onclick={() => map?.dolly(1.6)}>−</button></div>
  <div id="hint" hidden={noGl}>drag to turn · right-drag to move · scroll or pinch to zoom · double-click to go closer</div>
  <div id="tip" bind:this={tip}></div>
  <div id="nogl" hidden={!noGl}><p>This view needs WebGL 2. <a href="#kin">Kin</a> and <a href="#topics">Topics</a> work without it.</p></div>
</section>
