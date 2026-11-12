# Navigators (static site)

Navigators shows where language-model agents go on Wikipedia when nobody gives them a task, next to where human readers click from the same pages. It has five pages (hash routes): Landscape (3D terrain with agent runs), Topics, Kin, Field log, Findings. Everything is static files: no build step, no server code, no external requests. Licences: see the repository README. Credits: `CREDITS.md`.

## Serve locally
Any static server works, from this folder, for example:

    python3 -m http.server 8000 --bind 127.0.0.1

then open http://127.0.0.1:8000/ . All paths are relative, so the folder also works under a sub-path (for example `/some-repo/`). The page needs WebGL 2; without it, the Topics, Kin, Field log and Findings pages still work. Opening `index.html` from `file://` does not work (browsers block module and JSON loading); use a server.

## Layout
- `index.html`, `css/` (style.css landscape, pages.css other pages), `js/` (main.js landscape and router, data.js loader, kin.js, topics.js, log.js, findings.js)
- `data/` the JSON the pages load (below)
- `vendor/` three.js 0.160.0 and the fonts, with licence texts (`vendor/THIRD_PARTY.md`)

## Data files (`data/`)
| file | content | loaded by |
|---|---|---|
| nodes.json | 12,586 Wikipedia pages: id, title, x, y layout position (0..1000), topic, agent visit count, reader click count; 29 topics with hulls | landscape (start) |
| derived.json | 20 start pages, 1,759 agent runs as page-id paths (model, condition, ending), readers' first-click shares | landscape (start) |
| highways.json | 16,016 directed page-to-page edges with run counts, bundled road polylines | landscape (start) |
| wells_shrunk.json | per-model shrinkage weights, sparse flags, labels, method notes for the terrain (the pre-computed grids were removed, see below) | landscape (start) |
| first_hops.json | first-hop shares of agents and readers per start page | landscape (start) |
| facts.json | headline counts, per-model facts (stop rate, backtracking, agreement), notes shown beside the terrain | landscape (start) |
| log_lines.json | one sentence per start page and condition | landscape (start) |
| said_thought.json | 120 verbatim pairs of what a model said and what its internal reasoning showed | landscape (start) |
| kin.json | agreement matrix between models, dendrogram, bootstrap | start (loaded with the others) and Kin |
| models_v2.json | per-model summary: stop rate, backtrack share, agreements, sigil mapping | landscape (start), Kin |
| stats.json | agreement ladder, HypTrails results, loop numbers, the blank-page opening pages | landscape (start), Kin |
| sigils.json | parameters of the eight chaotic-map sigils | Kin |
| topic_tree.json, topic_paths.json | topic dendrogram; run paths reduced to topic sequences | Topics |
| events.json | 2,213 field-log events (verbatim quotes with labels, at most 150 per type) | Field log |
| findings_public.json | the Findings page: groups, cards, chart values | Findings |

## How the terrain is computed
In the browser, from `nodes.json` and `derived.json`. For the chosen ground (all agents, one of eight models, or readers) each page's visit count is turned into `log(1 + visits)` (readers: `log(1 + clicks/50)`) and put on a 160 x 160 grid over the 0..1000 layout, blurred with a Gaussian of sigma 2.6 cells, then converted to height `-log(r + 0.02 max)` and scaled to 0..1 (0 = deepest well, 1 = empty rim). A single model's ground is its own field blended with the all-agents field by the shrinkage weight in `wells_shrunk.json` (models with few runs lean on the pooled field). Height is not a loss: low ground means many arrivals. The terrain is drawn with one WebGL shader (contour and hatch lines); runs animate along their page paths.
