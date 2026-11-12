import { S, FAMS, FCOL, fmt, esc } from './data.js';
const $ = s => document.querySelector(s);
const SH = ['<circle cx="6" cy="6" r="4.5"/>', '<path d="M6 .5 11.5 6 6 11.5.5 6z"/>', '<path d="M6 .8 11.2 10.5H.8z"/>', '<rect x="1.5" y="1.5" width="9" height="9"/>', '<path d="M4.4.8h3.2v3.6h3.6v3.2H7.6v3.6H4.4V7.6H.8V4.4h3.6z"/>', '<path d="M6 .6 10.8 3.3v5.4L6 11.4 1.2 8.7V3.3z"/>', '<circle cx="6" cy="6" r="4" fill="none" stroke-width="2"/>'];
const shapeSvg = (i, col) => `<svg width="12" height="12" viewBox="0 0 12 12" fill="${col}" stroke="${col}" aria-hidden="true">${SH[i]}</svg>`;

// type -> [label, group, plain meaning]; groups: loops, reasoning, stopping, interface
const TYPES = {
  loop_trap: ['Loop trap', 'loops', 'bounces between the same two pages'],
  identical_reason: ['Repeats itself', 'loops', 'the same reason, word for word, at several steps'],
  internal_contradiction: ['Internal contradiction', 'reasoning', 'thinks one link, picks another'],
  invented_goal: ['Invented goal', 'reasoning', 'talks about a target although no task was given'],
  benchmark_suspicion: ['Feels watched', 'reasoning', 'wonders whether it is inside a test or evaluation'],
  injection_suspicion: ['Suspects a trick', 'reasoning', 'wonders whether the input is a prompt injection'],
  foreign_history_adopted: ['Borrowed past', 'reasoning', ''],
  format_confusion: ['Format confusion', 'reasoning', 'gets confused about the reply format'],
  self_reference: ['Self-reference', 'reasoning', 'brings its own nature as an AI into the choice'],
  garbled_input_task: ['Task from garbled text', 'reasoning', 'sets itself a task from broken text'],
  canon_opening: ['Canon opening', 'reasoning', 'starts on a well-known curiosity topic'],
  stop_no_task: ['Stop: no task', 'stopping', 'stops because no task was given'],
  stop_page_sufficient: ['Stop: page sufficient', 'stopping', 'stops because the page already covers the topic'],
  stop_narrative_closure: ['Stop: closure', 'stopping', 'stops because the path feels like a finished arc'],
  multi_tool_call: ['Several tool calls', 'interface', 'several links chosen in one reply'],
  parse_error: ['Parse error', 'interface', 'the reply was unreadable'],
  invalid_action: ['Invalid action', 'interface', 'the reply named a link that was not on the page'],
  harness_random_pick: ['Random pick', 'interface', 'the reply was unusable, so a link was picked at random'],
  api_error: ['API error', 'interface', 'a technical failure ended the run'],
  refusal: ['Refusal', 'interface', 'a reply that declined to help'],
};
const GROUPS = [['loops', 'loops'], ['reasoning', 'reasoning'], ['stopping', 'stopping']];
const DROP = new Set(['multi_tool_call', 'parse_error', 'invalid_action', 'harness_random_pick', 'api_error', 'refusal', 'format_confusion', 'garbled_input_task']);
const JARGON = /\*\*|json|tool call|save_page|ground truth|`|\{|\}/i;
const trim = q => { const s = q.match(/[^.!?]+[.!?]+/g) || [q]; let o = s.slice(0, 2).join('').trim(); if (o.length > 240) o = o.slice(0, 237).replace(/\s+\S*$/, '') + '…'; return o; };
const FNAME = { deepseek: 'DeepSeek', grok: 'Grok', mimo: 'MiMo', qwen: 'Qwen', gemini: 'Gemini', haiku: 'Haiku', gpt: 'GPT', other: 'other' };
const STR = { strong: 'harness record, exact rule or hand-checked', moderate: 'transparent pattern, checked by hand on samples', anecdotal: 'unvalidated pattern: read the quote' };
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };

export async function buildLog() {
  const events = (await fetch('data/events.json').then(r => r.json())).filter(e => !DROP.has(e.type) && e.quote && !JARGON.test(e.quote)).map(e => ({ ...e, quote: trim(e.quote) }));
  const ordered = events.map(e => [hash(e.id), e]).sort((a, b) => a[0] - b[0]).map(r => r[1]);
  const onMap = new Set(S.derived.starts.map(s => s[0]).filter(id => S.fh.starts.some(s => s.page_id === id)));
  const mapped = e => e.replay && e.replay !== 'search' && onMap.has(+e.replay);
  const st = { types: new Set(), fams: new Set(), strs: new Set(), shown: 30 };
  const nm = events.filter(mapped).length;
  const fams = [...FAMS, 'other'].filter(f => events.some(e => e.family === f));
  const fcol = () => 'var(--road)';

  $('#loglede').textContent = 'Real quotes from agent runs, in the models’ own words.';
  $('#logfilters').innerHTML =
    GROUPS.map(([g, lab]) => `<div class="ctl"><span class="k">${lab}</span><span class="opts">${Object.entries(TYPES).filter(([t, v]) => v[1] === g && events.some(e => e.type === t))
      .map(([t, v]) => `<a data-t="${t}" >${esc(v[0])}</a>`).join('')}</span></div>`).join('') +
    `<div class="ctl"><span class="k">model family</span><span class="opts">${fams.map(f => `<a class="fam${f === 'other' ? '' : ''}" data-f="${f}" style="--c:${fcol(f)}">${FAMS.includes(f) ? shapeSvg(FAMS.indexOf(f), fcol(f)) : ''}${FNAME[f]}</a>`).join('')}</span></div>`;
  $('#logtype').textContent = '';

  const match = e => (!st.types.size || st.types.has(e.type)) && (!st.fams.size || st.fams.has(e.family)) && (!st.strs.size || st.strs.has(e.strength));
  const card = e => {
    const t = TYPES[e.type] || [e.type.replace(/_/g, ' ')], f = e.family, q = e.quote == null || e.quote === '' ? '<span class="dim">(empty output)</span>' : esc(e.quote);
    return `<article class="ev"><p class="q" tabindex="0">${q}</p>
      <p class="meta"><b>${esc(t[0])}</b><span style="color:${fcol(f)}">${FAMS.includes(f) ? shapeSvg(FAMS.indexOf(f), fcol(f)) : ''}${esc((e.model_label || e.model || FNAME[f]).replace(/\s*\(.*?\)/g, ''))}</span><span>${esc(e.start_title || '')}</span><span>step ${esc(e.k)}</span>${mapped(e) ? `<a class="go" data-go="${+e.replay}">show on the map</a>` : ''}</p>
</article>`;
  };
  function render() {
    const hits = ordered.filter(match);
    $('#loglist').innerHTML = hits.slice(0, st.shown).map(card).join('') || '<p class="lede small">Nothing matches that combination.</p>';
    $('#logmore').hidden = hits.length <= st.shown;
  }
  $('#logfilters').onclick = ev => {
    const a = ev.target.closest('a'); if (!a) return;
    const [set, key] = a.dataset.t ? [st.types, a.dataset.t] : a.dataset.f ? [st.fams, a.dataset.f] : [st.strs, a.dataset.s];
    set.has(key) ? set.delete(key) : set.add(key); a.classList.toggle('on', set.has(key));
    st.shown = 30; render();
  };
  $('#logclear').onclick = () => { st.types.clear(); st.fams.clear(); st.strs.clear(); document.querySelectorAll('#logfilters a.on').forEach(a => a.classList.remove('on')); $('#logtype').textContent = ''; st.shown = 30; render(); };
  $('#logmore').onclick = () => { st.shown += 30; render(); };
  $('#loglist').onclick = ev => {
    const g = ev.target.closest('[data-go]');
    if (g) {
      const sel = $('#start'); sel.value = g.dataset.go; sel.dispatchEvent(new Event('change'));
      location.hash = '#landscape'; return;
    }
    const q = ev.target.closest('.q'); if (q) q.classList.toggle('open');
  };
  $('#logsrc').textContent = '';
  render();
}
