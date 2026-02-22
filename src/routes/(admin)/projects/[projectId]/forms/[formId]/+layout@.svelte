<script lang="ts">
	let { children } = $props();
</script>

<!-- Form builder gets full screen without admin sidebar/padding -->
<div class="h-screen w-screen overflow-hidden">
	{@render children()}
</div>
