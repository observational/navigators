export const SH = ['<circle cx="6" cy="6" r="4.5"/>', '<path d="M6 .5 11.5 6 6 11.5.5 6z"/>', '<path d="M6 .8 11.2 10.5H.8z"/>', '<rect x="1.5" y="1.5" width="9" height="9"/>', '<path d="M4.4.8h3.2v3.6h3.6v3.2H7.6v3.6H4.4V7.6H.8V4.4h3.6z"/>', '<path d="M6 .6 10.8 3.3v5.4L6 11.4 1.2 8.7V3.3z"/>', '<circle cx="6" cy="6" r="4" fill="none" stroke-width="2"/>'];
// type -> [label, group, plain meaning]; groups: loops, reasoning, stopping, interface
export const TYPES = {
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
export const GROUPS = [['loops', 'loops'], ['reasoning', 'reasoning'], ['stopping', 'stopping']];
export const DROP = new Set(['multi_tool_call', 'parse_error', 'invalid_action', 'harness_random_pick', 'api_error', 'refusal', 'format_confusion', 'garbled_input_task']);
export const JARGON = /\*\*|json|tool call|save_page|ground truth|`|\{|\}/i;
export const trim = q => { const s = q.match(/[^.!?]+[.!?]+/g) || [q]; let o = s.slice(0, 2).join('').trim(); if (o.length > 240) o = o.slice(0, 237).replace(/\s+\S*$/, '') + '…'; return o; };
export const FNAME = { deepseek: 'DeepSeek', grok: 'Grok', mimo: 'MiMo', qwen: 'Qwen', gemini: 'Gemini', haiku: 'Haiku', gpt: 'GPT', other: 'other' };
export const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };

