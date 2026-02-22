<script lang="ts">
	import Label from '$lib/components/ui/label.svelte';
	import type { AggregationType } from '$lib/types/views';

	let { value = $bindable('count') }: { value: AggregationType } = $props();

	const aggregations: Array<{ type: AggregationType; label: string; description: string }> = [
		{ type: 'count', label: 'Count', description: 'Count the number of records' },
		{ type: 'sum', label: 'Sum', description: 'Add all values together' },
		{ type: 'average', label: 'Average', description: 'Calculate the mean value' }
	];
</script>

<div class="space-y-2">
	<Label>Aggregation Method</Label>
	<div class="space-y-2">
		{#each aggregations as agg}
			<label
				class="flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 {value ===
				agg.type
					? 'border-blue-500 bg-blue-50'
					: 'border-slate-200 bg-white'}"
			>
				<input
					type="radio"
					name="aggregation"
					value={agg.type}
					bind:group={value}
					class="mt-0.5 text-blue-600 focus:ring-blue-500"
				/>
				<div class="flex-1">
					<div
						class="text-sm font-medium {value === agg.type
							? 'text-blue-700'
							: 'text-slate-900'}"
					>
						{agg.label}
					</div>
					<div class="text-xs text-slate-500 mt-0.5">{agg.description}</div>
				</div>
			</label>
		{/each}
	</div>
</div>
