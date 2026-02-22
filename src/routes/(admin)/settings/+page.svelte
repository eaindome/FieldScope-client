<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { icons } from '$lib/components/icons.svelte';
</script>

<div class="flex h-screen flex-col">
	<div class="border-b border-slate-200 bg-white px-6 py-4">
		<h1 class="text-2xl font-bold text-slate-900">Settings</h1>
		<p class="text-sm text-slate-600 mt-1">Configure your organization settings</p>
	</div>

	<div class="flex-1 overflow-auto bg-slate-50 p-6">
		<Card>
			<div class="text-center py-12">
				<div class="text-6xl mb-4 text-slate-400">{@html icons.Settings(64)}</div>
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Settings Coming Soon</h3>
				<p class="text-slate-600">Manage organization preferences and configurations</p>
			</div>
		</Card>
	</div>
</div>
