<script>
  import { S, FAMS, FCOL, kinOf, shortName } from '../data.js';
  import { sigil } from './sigil.js';
  const SH = ['<circle cx="6" cy="6" r="4.5"/>', '<path d="M6 .5 11.5 6 6 11.5.5 6z"/>', '<path d="M6 .8 11.2 10.5H.8z"/>', '<rect x="1.5" y="1.5" width="9" height="9"/>', '<path d="M4.4.8h3.2v3.6h3.6v3.2H7.6v3.6H4.4V7.6H.8V4.4h3.6z"/>', '<path d="M6 .6 10.8 3.3v5.4L6 11.4 1.2 8.7V3.3z"/>', '<circle cx="6" cy="6" r="4" fill="none" stroke-width="2"/>'];
  const draw = (cv, m) => sigil(cv, m.key, FCOL[m.family], 140);
  const voice = m => S.facts.models[m.key].voice;
  const pc = v => Math.round(v * 100) + '%';
</script>

<div id="plates">
  {#each S.mv2.models as m}
    {@const col = FCOL[m.family]}
    {@const [near, far] = kinOf(m.key)}
    <div class="plate">
      <canvas use:draw={m}></canvas>
      <div>
        <h3><svg width="12" height="12" viewBox="0 0 12 12" fill={col} stroke={col} aria-hidden="true">{@html SH[FAMS.indexOf(m.family)]}</svg>{m.label}</h3>
        <p class="pk">picks most like <b>{shortName(near.key)}</b> <span>{pc(near.v)}</span></p>
        <p class="pk">least like <b>{shortName(far.key)}</b> <span>{pc(far.v)}</span></p>
        {#if voice(m)}<p class="pq">{voice(m).text}</p><p class="pw">{voice(m).when}</p>{/if}
      </div>
    </div>
  {/each}
</div>
