<script>
  // Updates tab: the team's Google Form for update sign-ups, embedded.
  // The form is light; a filter turns it into the site's dark ground (the iframe is cross-origin, so CSS cannot reach inside).
  // The tab mounts on first visit only, so Google is not contacted until someone opens it.
  import { onMount } from 'svelte';
  let { active, onready } = $props();
  const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSf9vyPDFvEtyoH_oUOYtPu8-t_u2sv_1OS1VFek8Xi76Unk4g/viewform';
  onMount(() => onready());
</script>

<section id="updates" class="page" hidden={!active}>
  <div class="col">
    <h1>Updates</h1>
    <p class="lede">Hear from us when the paper and new results come out.</p>
    <iframe src={FORM + '?embedded=true'} title="Sign up for updates" loading="lazy">Loading…</iframe>
    <p class="src">The form is hosted by Google Forms. If it does not load, <a href={FORM} target="_blank" rel="noopener">open it in a new tab</a>.</p>
  </div>
</section>

<style>
  .col{max-width:720px}
  iframe{display:block;width:100%;height:1560px;border:0;margin:8px 0 0;background:transparent;
    filter:invert(.9) hue-rotate(180deg) sepia(.12)}
  .src{margin-top:12px}
  .src a{color:var(--bone);text-decoration:none;border-bottom:1px solid var(--ember)}
  @media (max-width:760px){iframe{height:1740px}}
</style>
