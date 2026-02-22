<script lang="ts">
	import { icons } from '$lib/components/icons.svelte';
	import type { ChartType } from '$lib/types/views';

	let { value = $bindable('bar') }: { value: ChartType } = $props();

	// Organized chart types by category
	const chartCategories = [
		{
			name: 'Bar & Column',
			types: [
				{ type: 'bar' as ChartType, label: 'Bar', icon: icons.BarChart(22) },
				{ type: 'groupedBar' as ChartType, label: 'Grouped', icon: icons.BarChart2(22) },
				{ type: 'stackedBar' as ChartType, label: 'Stacked', icon: icons.BarChart2(22) },
				{ type: 'horizontalBar' as ChartType, label: 'Horizontal', icon: icons.BarChartH(22) }
			]
		},
		{
			name: 'Line & Area',
			types: [
				{ type: 'line' as ChartType, label: 'Line', icon: icons.TrendingUp(22) },
				{ type: 'area' as ChartType, label: 'Area', icon: icons.AreaChart(22) },
				{ type: 'stackedArea' as ChartType, label: 'Stacked', icon: icons.AreaChart(22) }
			]
		},
		{
			name: 'Pie & Donut',
			types: [
				{ type: 'pie' as ChartType, label: 'Pie', icon: icons.PieChart(22) },
				{ type: 'doughnut' as ChartType, label: 'Doughnut', icon: icons.Circle(22) }
			]
		},
		{
			name: 'Scatter & Distribution',
			types: [
				{ type: 'scatter' as ChartType, label: 'Scatter', icon: icons.Scatter(22) },
				{ type: 'bubble' as ChartType, label: 'Bubble', icon: icons.Bubble(22) },
				{ type: 'histogram' as ChartType, label: 'Histogram', icon: icons.Histogram(22) },
				{ type: 'boxPlot' as ChartType, label: 'Box Plot', icon: icons.BoxPlot(22) }
			]
		},
		{
			name: 'Heat & Tree',
			types: [
				{ type: 'heatmap' as ChartType, label: 'Heatmap', icon: icons.Heatmap(22) },
				{ type: 'treeMap' as ChartType, label: 'Tree Map', icon: icons.TreeMap(22) }
			]
		},
		{
			name: 'Process & Flow',
			types: [
				{ type: 'funnel' as ChartType, label: 'Funnel', icon: icons.Funnel(22) },
				{ type: 'waterfall' as ChartType, label: 'Waterfall', icon: icons.Waterfall(22) },
				{ type: 'sankey' as ChartType, label: 'Sankey', icon: icons.Sankey(22) }
			]
		},
		{
			name: 'Specialized',
			types: [
				{ type: 'radar' as ChartType, label: 'Radar', icon: icons.Radar(22) },
				{ type: 'gauge' as ChartType, label: 'Gauge', icon: icons.Gauge(22) },
				{ type: 'choropleth' as ChartType, label: 'Map', icon: icons.Choropleth(22) },
				{ type: 'number' as ChartType, label: 'Number', icon: icons.Hash(22) }
			]
		}
	];

	// Flatten for easy access
	const allChartTypes = chartCategories.flatMap((cat) => cat.types);
</script>

<div class="space-y-4">
	<label class="text-sm font-medium text-slate-700">Chart Type</label>

	<!-- All chart types organized by category -->
	<div class="space-y-4 max-h-96 overflow-y-auto pr-2">
		{#each chartCategories as category}
			<div>
				<h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
					{category.name}
				</h4>
				<div class="grid grid-cols-4 gap-2">
					{#each category.types as chartType}
						<button
							type="button"
							class="flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all hover:border-blue-300 hover:bg-blue-50 {value ===
							chartType.type
								? 'border-blue-500 bg-blue-50'
								: 'border-slate-200 bg-white'}"
							onclick={() => (value = chartType.type)}
						>
							<div class="mb-1 {value === chartType.type ? 'text-blue-600' : 'text-slate-400'}">
								{@html chartType.icon}
							</div>
							<span
								class="text-xs font-medium leading-tight text-center {value === chartType.type
									? 'text-blue-700'
									: 'text-slate-600'}">{chartType.label}</span
							>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
