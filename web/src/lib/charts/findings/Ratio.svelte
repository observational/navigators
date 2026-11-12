<script>
  import Bars from './Bars.svelte';
  let { v } = $props();
</script>
<Bars v={{ rows: v.rows }} noCap colors={v.rows.map(r => r.who === 'reader' ? 'ice' : 'agent')} />
