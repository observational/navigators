# Navigators

Left alone on Wikipedia with no task, different AI models make the same choices. This site maps thousands of task-free
agent runs next to where human readers click from the same pages.

**Site:** https://observational.github.io/navigators/

## What is here

- `web/`: the website, a Vite + Svelte 5 single-page app with three.js for the map; static JSON data in `web/public/data/`.
  Details in `web/README.md`.
- `.github/workflows/pages.yml`: builds `web/` and publishes it to GitHub Pages on every push to `main`.

The experiment harness and the analysis will follow in this repository.

## Run locally

    cd web && npm ci && npm run dev

(Node 20 or later; WebGL 2 needed for the map.) `npm run build` writes the static site to `web/dist/`.

## Licences

- Code: MIT (`LICENSE`).
- Site text, figures and our data files: CC BY 4.0 (`LICENSE-CONTENT`).
- Wikipedia titles, links and quoted article text: CC BY-SA 4.0, Wikipedia contributors. Wikimedia clickstream: CC0.
- Bundled third-party code and fonts keep their own licences: `web/public/THIRD_PARTY.md`, `web/public/CREDITS.md`.

## Cite

See `CITATION.cff`.
