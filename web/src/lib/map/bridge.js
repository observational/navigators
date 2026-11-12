// Contract for other tabs to drive the map (the old site did this through the #start select and window.__cam).
//   import { showStart, showCanon } from '../lib/map/bridge.js'
//   showStart(pageId)  select that start page and fly there (then set location.hash = '#landscape')
//   showCanon(on)      show / hide the "blank-page opening pages" rings (on omitted = toggle)
// If the Landscape tab has not mounted yet the request is kept and applied once it has rendered.
let handler = null, pending = [];
const call = (name, arg) => { if (handler) handler[name](arg); else pending.push([name, arg]); };
export const showStart = id => call('showStart', id);
export const showCanon = on => call('showCanon', on);
export function register(h) { handler = h; const p = pending; pending = []; p.forEach(([n, a]) => h[n](a)); }
export function unregister(h) { if (handler === h) handler = null; }
