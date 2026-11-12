// Shared constants and small HTML builders for the landscape tab (ported from site/js/main.js).
import { FAMS, FCOL } from '../data.js';

export const SHORT = { 'DeepSeek4.1': 'DeepSeek', 'Grok4.7': 'Grok', 'MiMo2.6': 'MiMo', 'Qwen3.8': 'Qwen 3.8', 'Qwen3.7': 'Qwen 3.7', 'Gemini3.8': 'Gemini', 'Haiku5.5': 'Haiku', 'Luna': 'Luna', all: 'all agents', readers: 'readers' };

const SH = ['<circle cx="6" cy="6" r="4.5"/>', '<path d="M6 .5 11.5 6 6 11.5.5 6z"/>', '<path d="M6 .8 11.2 10.5H.8z"/>', '<rect x="1.5" y="1.5" width="9" height="9"/>', '<path d="M4.4.8h3.2v3.6h3.6v3.2H7.6v3.6H4.4V7.6H.8V4.4h3.6z"/>', '<path d="M6 .6 10.8 3.3v5.4L6 11.4 1.2 8.7V3.3z"/>', '<circle cx="6" cy="6" r="4" fill="none" stroke-width="2"/>'];
export const shapeSvg = (i, col) => `<svg width="12" height="12" viewBox="0 0 12 12" fill="${col}" stroke="${col}" aria-hidden="true">${SH[i]}</svg>`;
const FLAB = { deepseek: 'DeepSeek', grok: 'Grok', mimo: 'MiMo', qwen: 'Qwen', gemini: 'Gemini', haiku: 'Haiku', gpt: 'GPT' };

// legend under the controls; ink 0 = who, 1 = which model
export function keyHtml(ink) {
  const road = `<span><svg width="24" height="8" aria-hidden="true"><path d="M0 4h24" stroke="#f0924a" stroke-width="3"/></svg>agents’ roads, wider with more runs</span><span><svg width="24" height="8" aria-hidden="true"><path d="M0 4h24" stroke="#7fb2d6" stroke-width="1.6" stroke-dasharray="5 3"/></svg>readers’ first clicks from the start page</span>`;
  return ink === 1
    ? FAMS.map((f, i) => `<span>${shapeSvg(i, FCOL[f])}${FLAB[f]}</span>`).join('') + road + '<br><span style="color:var(--dim)">shape and colour both name the family that visited a page most</span>'
    : `<span>${shapeSvg(0, '#ede0c2')}visited by agents</span><span>${shapeSvg(0, '#7fb2d6')}only readers</span><span><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke="#e5532d"/></svg>start page</span>${road}`;
}
