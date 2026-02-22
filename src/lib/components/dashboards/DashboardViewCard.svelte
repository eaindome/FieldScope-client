<script lang="ts">
	import { icons } from '$lib/components/icons.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import ChartPreview from '$lib/components/views/ChartPreview.svelte';
	import type { DashboardItem } from '$lib/types/dashboards';
	import type { View, ViewDefinition } from '$lib/types/views';
	import type { ChartData, FormField } from '$lib/types/views';
	import { aggregateSubmissionData } from '$lib/utils/data-aggregation';

	let {
		item,
		view,
		submissions = [],
		allFields = [],
		onRemove,
		editMode = false
	}: {
		item: DashboardItem;
		view: View;
		submissions: any[];
		allFields: FormField[];
		onRemove?: () => void;
		editMode?: boolean;
	} = $props();

	// Parse view definition and generate chart data
	const chartData = $derived.by<ChartData>(() => {
		try {
			const definition: ViewDefinition = JSON.parse(view.definition);
			return aggregateSubmissionData(submissions, definition.config, allFields);
		} catch (e) {
			console.error('Error generating chart data:', e);
			return { labels: [], datasets: [] };
		}
	});

	const chartType = $derived.by(() => {
		try {
			const definition: ViewDefinition = JSON.parse(view.definition);
			return definition.chartType;
		} catch {
			return 'bar';
		}
	});
</script>

<div class="h-full flex flex-col bg-white rounded-lg border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
	<!-- Header -->
	<div
		class="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 drag-handle {editMode
			? 'cursor-move'
			: ''}"
	>
		<div class="flex items-center gap-2 flex-1 min-w-0">
			{#if editMode}
				<div class="text-slate-400" title="Drag to move">
					{@html icons.GripVertical(16)}
				</div>
			{/if}
			<h4 class="text-sm font-semibold text-slate-900 truncate">{view.name}</h4>
		</div>
		{#if editMode}
			<div class="flex items-center gap-1">
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						onRemove?.();
					}}
					class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
					title="Remove from dashboard"
				>
					{@html icons.X(16)}
				</button>
			</div>
		{/if}
	</div>

	<!-- Chart Content -->
	<div class="flex-1 p-4 overflow-hidden">
		<div class="h-full">
			<ChartPreview {chartType} {chartData} title="" />
		</div>
	</div>
</div>
