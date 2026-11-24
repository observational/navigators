<script>
  // Subscribe tab: the team's Google Form for update sign-ups, embedded.
  // The form is light and cross-origin, so CSS cannot reach inside; a filter chain recolours it.
  // The numbers are fitted so the form's white lands on exactly --ground (20,17,13) and its black near --paper:
  // the cards then meet the page without a seam. Chromium ignores SVG url() filters and blend layers over iframes,
  // so only plain CSS filter functions are used. Refit if --ground changes.
  // The tab mounts on first visit only, so Google is not contacted until someone opens it.
  import { onMount } from 'svelte';
  let { active, onready } = $props();
  const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSf9vyPDFvEtyoH_oUOYtPu8-t_u2sv_1OS1VFek8Xi76Unk4g/viewform';
  onMount(() => onready());
</script>

<section id="subscribe" class="page" hidden={!active}>
  <div class="col">
    <h1>Subscribe</h1>
    <p class="lede">Hear from us when the paper and new results come out.</p>
    <iframe src={FORM + '?embedded=true'} title="Sign up for updates" loading="lazy">Loading…</iframe>
    <p class="src">The form is hosted by Google Forms. If it does not load, <a href={FORM} target="_blank" rel="noopener">open it in a new tab</a>.</p>
  </div>
</section>

<style>
  .col{max-width:720px}
  iframe{display:block;width:100%;height:1560px;border:0;margin:8px 0 0;background:transparent;
    filter:invert(.935) hue-rotate(180deg) sepia(.9) saturate(1.3) brightness(.892)}
  .src{margin-top:12px}
  .src a{color:var(--bone);text-decoration:none;border-bottom:1px solid var(--ember)}
  @media (max-width:760px){iframe{height:1740px}}
</style>
