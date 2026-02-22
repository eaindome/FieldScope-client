<script lang="ts">
	let { children } = $props();
</script>

<!-- Dashboard builder gets full screen without admin sidebar/padding -->
<div class="h-screen w-screen overflow-hidden">
	{@render children()}
</div>
