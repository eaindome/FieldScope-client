<script lang="ts">
	let { children } = $props();
</script>

<!-- Preview gets full screen without admin sidebar/padding -->
<div class="h-screen w-screen overflow-auto">
	{@render children()}
</div>
