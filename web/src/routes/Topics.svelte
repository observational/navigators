<script>
  import { onMount } from 'svelte';
  import { S, MODELS, load, getJSON } from '../lib/data.js';
  import { createCircle, SHORT } from '../lib/topics/circle.js';
  let { active, onready } = $props();
  const keys = ['agents', ...MODELS, 'readers'];
  let who = $state('agents'), start = $state(1029), starts = $state([]), cv, circle;

  onMount(() => {
    let dead = false;
    (async () => {
      const [, TT, TP] = await Promise.all([load(), getJSON('topic_tree.json'), getJSON('topic_paths.json')]);
      if (dead) return;
      starts = S.derived.starts;
      circle = createCircle(cv, TT, TP, () => activeNow);
      onready();
    })();
    return () => { dead = true; circle?.destroy(); };
  });
  let activeNow = false;
  $effect(() => { activeNow = active; if (active) circle?.resize(); });
  const pick = k => { who = k; circle?.setWho(k); };
  const pickStart = e => { start = +e.currentTarget.value; circle?.setStart(start); };
</script>

<section id="topics" class="page" hidden={!active}>
  <div class="col wide">
    <h1>Same topics as readers. Except people.</h1>
    <p class="lede" id="tlede">Bars show where the first click lands, topic by topic: models in orange, people in blue. They mostly match; the gap is pages about people. Curves are every move the models made between topics.</p>
    <div class="ctl tctl"><span class="k">who</span><span id="tgrounds">{#each keys as k}<!-- svelte-ignore a11y_missing_attribute --><a role="button" tabindex="0" onkeydown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(k))} class="{k === 'readers' ? 'rd' : ''}{k === who ? ' on' : ''}" onclick={() => pick(k)}>{SHORT[k]}</a>{/each}</span></div>
    <div class="ctl tctl"><span class="k">start page</span><select id="tstart" aria-label="Start page for topic runs" value={start} onchange={pickStart}>{#each starts as [id, t]}<option value={id}>{t}</option>{/each}</select></div>
    <canvas id="tcv" bind:this={cv}></canvas>
    <p class="src" id="tsrc"></p>
  </div>
</section>
