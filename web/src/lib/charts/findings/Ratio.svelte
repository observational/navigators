<script>
  import Bars from './Bars.svelte';
  let { v } = $props();
</script>
<Bars v={{ rows: v.rows, unit: v.unit }} noCap={!v.unit} colors={v.rows.map(r => r.who === 'reader' ? 'ice' : 'agent')} />
