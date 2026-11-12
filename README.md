# Navigators

Where do language-model agents go on Wikipedia when nobody asks them anything? This site maps thousands of task-free
agent runs next to where human readers click from the same pages.

**Site:** https://observational.github.io/navigators/

## What is here

- `site/`: the website. Plain HTML, CSS and JavaScript modules with three.js; static JSON data; no build step.
  Details in `site/README.md`.
- `.github/workflows/pages.yml`: publishes `site/` to GitHub Pages on every push to `main`.

The experiment harness and the analysis will follow in this repository.

## Run locally

    cd site && python3 -m http.server 8000

then open http://127.0.0.1:8000/ (WebGL 2 needed for the map).

## Licences

- Code: MIT (`LICENSE`).
- Site text, figures and our data files: CC BY 4.0 (`LICENSE-CONTENT`).
- Wikipedia titles, links and quoted article text: CC BY-SA 4.0, Wikipedia contributors. Wikimedia clickstream: CC0.
- Bundled third-party code and fonts keep their own licences: `site/vendor/THIRD_PARTY.md`, `site/CREDITS.md`.

## Cite

See `CITATION.cff`.
