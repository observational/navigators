<script>
  // Shell: header + hash router. Tabs mount on first visit and stay mounted afterwards
  // (like the old site: built once, hidden with the `hidden` attribute, state kept).
  import Landscape from './routes/Landscape.svelte';
  import Topics from './routes/Topics.svelte';
  import Kin from './routes/Kin.svelte';
  import Log from './routes/Log.svelte';
  import Findings from './routes/Findings.svelte';
  import Hypotheses from './routes/Hypotheses.svelte';

  const TABS = [
    { id: 'landscape', label: 'Landscape', C: Landscape },
    { id: 'topics', label: 'Topics', C: Topics },
    { id: 'kin', label: 'Kin', C: Kin },
    { id: 'log', label: 'Field log', C: Log },
    { id: 'findings', label: 'Findings', C: Findings },
    { id: 'hypotheses', label: 'Hypotheses', C: Hypotheses },
  ];
  const IDS = TABS.map(t => t.id);
  const read = () => { const h = location.hash.replace('#', ''); return IDS.includes(h) && h !== 'landscape' ? h : 'landscape'; };

  let current = $state(read());
  let visited = $state({ [read()]: true });
  let readyTabs = $state({});

  function onhash() { current = read(); visited[current] = true; }

  // window.__ready: true once the visible tab has rendered (tabs call their `onready`)
  // It is a live getter on the current hash, so it is false the instant the hash changes to a tab that has not rendered.
  Object.defineProperty(window, '__ready', { configurable: true, get: () => !!readyTabs[read()] });
</script>

<svelte:window onhashchange={onhash} />

<header>
  <div class="mark"><span class="wm">Navigators</span><span class="sub">where AI models go when left alone, and where people go</span></div>
  <nav id="tabs">{#each TABS as t}<a href={'#' + t.id} class:on={current === t.id}>{t.label}</a>{/each}</nav>
</header>

{#each TABS as t (t.id)}
  {#if visited[t.id]}
    <t.C active={current === t.id} onready={() => (readyTabs[t.id] = true)} />
  {/if}
{/each}
