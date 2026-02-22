<script lang="ts">
	import { network } from '$lib/stores/network.svelte';
	import { icons } from '$lib/components/icons.svelte';

	let { fromCache = false } = $props<{ fromCache?: boolean }>();
</script>

<!-- Offline Banner -->
{#if !network.online}
	<div
		class="fixed top-0 left-0 right-0 bg-amber-600 text-white px-4 py-2 z-50 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
	>
		<div class="flex items-center gap-2">
			{@html icons.AlertCircle(16)}
			<span>You're offline</span>
		</div>
		<span class="text-amber-100">·</span>
		<span class="text-amber-100">Your work will sync when you reconnect</span>
	</div>
{:else if fromCache}
	<div
		class="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 z-50 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
	>
		<div class="flex items-center gap-2">
			{@html icons.HardDrive(16)}
			<span>Viewing cached data</span>
		</div>
		<span class="text-blue-100">·</span>
		<span class="text-blue-100">Refreshing in background</span>
	</div>
{/if}
