# Navigators (Vite + Svelte 5)

Static single-page app, built into plain files. No server code, no external requests at runtime.

    npm install
    npm run dev       # dev server with hot reload
    npm run build     # static output in dist/ (relative paths, works under a sub-path such as /navigators/)
    npm run preview   # serve dist/ locally

## Layout
- `index.html`, `vite.config.js` (base './')
- `src/main.js` mounts `App.svelte` and imports the global CSS
- `src/App.svelte` header, hash router (#topics, #kin, #log, #findings, #hypotheses; map at the root), `window.__ready`
- `src/routes/` one component per tab: Landscape, Topics, Kin, Log, Findings, Hypotheses
- `src/lib/data.js` shared loader (`load()`, `S`, `getJSON(name)`) and helpers
- `src/styles/` global.css (tokens, shell, landscape), pages.css, findings.css
- `public/` copied as-is: `data/*.json`, `fonts/` (with licences), `CREDITS.md`, `THIRD_PARTY.md`, `THREE_LICENSE.txt`

## Tab contract
Each route component takes props `active` (boolean) and `onready` (call once rendered). It renders its own `<section id="..." hidden={!active}>`.
Tabs mount on first visit and then stay mounted (state is kept, as on the old site).

## Data files (`data/`)
| file | content | loaded by |
|---|---|---|
| nodes.json | 12,586 Wikipedia pages: id, title, x, y layout position (0..1000), topic, agent visit count, reader click count; 29 topics with hulls | Landscape |
| derived.json | 20 start pages, 1,759 agent runs as page-id paths (model, condition, ending), readers' first-click shares | Landscape |
| highways.json | 16,016 directed page-to-page edges with run counts, bundled road polylines | Landscape |
| wells_shrunk.json | per-model shrinkage weights, sparse flags, labels, method notes for the terrain (the pre-computed grids were removed, see below) | Landscape |
| first_hops.json | first-hop shares of agents and readers per start page | Landscape |
| facts.json | headline counts, per-model facts (stop rate, backtracking, agreement), notes shown beside the terrain | Landscape |
| log_lines.json | one sentence per start page and condition | Landscape |
| said_thought.json | 120 verbatim pairs of what a model said and what its internal reasoning showed | Landscape |
| kin.json | agreement matrix between models, dendrogram, bootstrap | start (loaded with the others) and Kin |
| models_v2.json | per-model summary: stop rate, backtrack share, agreements, sigil mapping | landscape (start), Kin |
| stats.json | agreement ladder, HypTrails results, loop numbers, the blank-page opening pages | landscape (start), Kin |
| sigils.json | parameters of the eight chaotic-map sigils | Kin |
| topic_tree.json, topic_paths.json | topic dendrogram; run paths reduced to topic sequences | Topics |
| events.json | 2,213 field-log events (verbatim quotes with labels, at most 150 per type) | Field log |
| findings_public.json | the Findings page: groups, cards, chart values | Findings |
| hypotheses.json | the Hypotheses page: groups of hypotheses (main four and the null, rest of H1–H10, H11–H13, shared context, link-level scores, the 9 Nov explanations), each with a status key from `statuses`, verdict, evidence and optionally the run that would test it; `compact: true` renders a group with smaller rows | Hypotheses |

## How the terrain is computed
In the browser, from `nodes.json` and `derived.json`. For the chosen ground (all agents, one of eight models, or readers) each page's visit count is turned into `log(1 + visits)` (readers: `log(1 + clicks/50)`) and put on a 160 x 160 grid over the 0..1000 layout, blurred with a Gaussian of sigma 2.6 cells, then converted to height `-log(r + 0.02 max)` and scaled to 0..1 (0 = deepest well, 1 = empty rim). A single model's ground is its own field blended with the all-agents field by the shrinkage weight in `wells_shrunk.json` (models with few runs lean on the pooled field). Height is not a loss: low ground means many arrivals. The terrain is drawn with one WebGL shader (contour and hatch lines); runs animate along their page paths.
