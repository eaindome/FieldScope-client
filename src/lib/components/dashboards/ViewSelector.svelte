<script lang="ts">
	import { icons } from '$lib/components/icons.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import type { View, ViewDefinition } from '$lib/types/views';

	let { views = [], onDragStart }: { views: View[]; onDragStart?: (view: View) => void } =
		$props();

	function getChartTypeIcon(view: View): string {
		try {
			const definition: ViewDefinition = JSON.parse(view.definition);
			const type = definition.chartType;
			switch (type) {
				case 'bar':
					return icons.BarChart(20);
				case 'line':
					return icons.TrendingUp(20);
				case 'pie':
					return icons.PieChart(20);
				case 'doughnut':
					return icons.Circle(20);
				case 'number':
					return icons.Hash(20);
				default:
					return icons.Activity(20);
			}
		} catch {
			return icons.Activity(20);
		}
	}

	function getChartTypeLabel(view: View): string {
		try {
			const definition: ViewDefinition = JSON.parse(view.definition);
			return definition.chartType.charAt(0).toUpperCase() + definition.chartType.slice(1);
		} catch {
			return 'Unknown';
		}
	}

	function handleDragStart(event: DragEvent, view: View) {
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'copy';
			event.dataTransfer.setData('application/json', JSON.stringify({ viewId: view.id }));
		}
		if (onDragStart) {
			onDragStart(view);
		}
	}
</script>

<div class="h-full flex flex-col">
	<div class="p-4 border-b border-slate-200">
		<h3 class="text-lg font-semibold text-slate-900">Available Views</h3>
		<p class="text-xs text-slate-500 mt-1">Drag views onto the canvas to add them</p>
	</div>

	<div class="flex-1 overflow-y-auto p-4 space-y-2">
		{#if views.length === 0}
			<div class="text-center py-8">
				<div class="flex justify-center mb-2 text-slate-300">
					{@html icons.Activity(48)}
				</div>
				<p class="text-slate-500 text-sm">No views available</p>
				<p class="text-slate-400 text-xs mt-1">Create views first to add them to dashboards</p>
			</div>
		{:else}
			{#each views as view}
				<div
					draggable="true"
					ondragstart={(e) => handleDragStart(e, view)}
					class="group cursor-move p-3 bg-white border-2 border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
					role="button"
					tabindex="0"
				>
					<div class="flex items-start gap-3">
						<div class="text-slate-400 group-hover:text-blue-500 transition-colors">
							{@html getChartTypeIcon(view)}
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-slate-900 truncate">{view.name}</div>
							{#if view.description}
								<div class="text-xs text-slate-500 truncate mt-0.5">{view.description}</div>
							{/if}
							<div class="mt-2">
								<Badge variant="default" class="text-xs">{getChartTypeLabel(view)}</Badge>
							</div>
						</div>
						<div class="text-slate-300 group-hover:text-slate-400">
							{@html icons.GripVertical(16)}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
