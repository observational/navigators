<script>
  import Bars from './Bars.svelte';
  let { v } = $props();
</script>
<Bars {v} colors={['soft', 'agent']} />
