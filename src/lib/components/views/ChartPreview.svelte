<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DoughnutChart from '$lib/components/charts/DoughnutChart.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import AreaChart from '$lib/components/charts/AreaChart.svelte';
	import RadarChart from '$lib/components/charts/RadarChart.svelte';
	import ScatterChart from '$lib/components/charts/ScatterChart.svelte';
	import BubbleChart from '$lib/components/charts/BubbleChart.svelte';
	import HistogramChart from '$lib/components/charts/HistogramChart.svelte';
	import BoxPlotChart from '$lib/components/charts/BoxPlotChart.svelte';
	import HeatmapChart from '$lib/components/charts/HeatmapChart.svelte';
	import TreeMapChart from '$lib/components/charts/TreeMapChart.svelte';
	import FunnelChart from '$lib/components/charts/FunnelChart.svelte';
	import WaterfallChart from '$lib/components/charts/WaterfallChart.svelte';
	import GaugeChart from '$lib/components/charts/GaugeChart.svelte';
	import ChoroplethChart from '$lib/components/charts/ChoroplethChart.svelte';
	import type { ChartType, ChartData } from '$lib/types/views';

	let {
		chartType,
		chartData,
		title = '',
		compact = false
	}: {
		chartType: ChartType;
		chartData: ChartData;
		title?: string;
		compact?: boolean;
	} = $props();

	// For scatter charts, data is {x,y}[] — cast appropriately
	const scatterDatasets = $derived(
		chartData.datasets.map((ds) => ({
			...ds,
			data: ds.data as Array<{ x: number; y: number }>
		}))
	);
</script>

<div class="h-full flex items-center justify-center {compact ? 'p-2' : 'p-8'} bg-slate-50 rounded-lg">
	{#if chartData.labels.length === 0 && chartType !== 'scatter'}
		<div class="text-center text-slate-400">
			{#if !compact}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-16 w-16 mx-auto mb-4 text-slate-300"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				<p class="text-lg font-medium">Configure chart to see preview</p>
				<p class="text-sm mt-1">Select chart type and configure fields to visualize your data</p>
			{:else}
				<p class="text-xs text-slate-400">No data</p>
			{/if}
		</div>
	{:else if chartType === 'bar'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<BarChart labels={chartData.labels} datasets={chartData.datasets as any} {title} height="100%" />
		</div>
	{:else if chartType === 'horizontalBar'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<BarChart labels={chartData.labels} datasets={chartData.datasets as any} {title} height="100%" horizontal={true} />
		</div>
	{:else if chartType === 'stackedBar'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<BarChart
				labels={chartData.labels}
				datasets={chartData.datasets as any}
				{title}
				height="100%"
				stacked={true}
			/>
		</div>
	{:else if chartType === 'line'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<LineChart labels={chartData.labels} datasets={chartData.datasets as any} {title} height="100%" />
		</div>
	{:else if chartType === 'area'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<AreaChart labels={chartData.labels} datasets={chartData.datasets as any} {title} height="100%" />
		</div>
	{:else if chartType === 'stackedArea'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<AreaChart labels={chartData.labels} datasets={chartData.datasets as any} {title} height="100%" stacked={true} />
		</div>
	{:else if chartType === 'doughnut'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<DoughnutChart
				labels={chartData.labels}
				data={chartData.datasets[0]?.data as number[] || []}
				colors={Array.isArray(chartData.datasets[0]?.backgroundColor)
					? chartData.datasets[0].backgroundColor
					: undefined}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'pie'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<DoughnutChart
				labels={chartData.labels}
				data={chartData.datasets[0]?.data as number[] || []}
				colors={Array.isArray(chartData.datasets[0]?.backgroundColor)
					? chartData.datasets[0].backgroundColor
					: undefined}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'radar'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<RadarChart labels={chartData.labels} datasets={chartData.datasets as any} {title} height="100%" />
		</div>
	{:else if chartType === 'scatter'}
		{#if !scatterDatasets.length || (scatterDatasets[0]?.data?.length ?? 0) === 0}
			<div class="text-center text-slate-400">
				{#if !compact}
					<p class="text-lg font-medium">Configure chart to see preview</p>
					<p class="text-sm mt-1">Select X and Y fields to visualize scatter data</p>
				{:else}
					<p class="text-xs text-slate-400">No data</p>
				{/if}
			</div>
		{:else}
			<div class="w-full {compact ? 'h-full' : 'h-96'}">
				<ScatterChart datasets={scatterDatasets} {title} height="100%" />
			</div>
		{/if}
	{:else if chartType === 'groupedBar'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<BarChart
				labels={chartData.labels}
				datasets={chartData.datasets as any}
				{title}
				height="100%"
				grouped={true}
			/>
		</div>
	{:else if chartType === 'number'}
		<div class="text-center">
			<div class="{compact ? 'text-3xl' : 'text-6xl'} font-bold text-blue-600 mb-2">
				{chartData.datasets[0]?.data[0]?.toLocaleString() || '0'}
			</div>
			{#if title && !compact}
				<div class="text-slate-600 text-lg mt-2">{title}</div>
			{/if}
			<div class="{compact ? 'text-xs' : 'text-sm'} text-slate-500 mt-1">
				{chartData.datasets[0]?.label || 'Total'}
			</div>
		</div>
	{:else if chartType === 'bubble'}
		{#if !chartData.datasets.length || (chartData.datasets[0]?.data?.length ?? 0) === 0}
			<div class="text-center text-slate-400">
				{#if !compact}
					<p class="text-lg font-medium">Configure chart to see preview</p>
					<p class="text-sm mt-1">Select X, Y, and Size fields</p>
				{:else}
					<p class="text-xs text-slate-400">No data</p>
				{/if}
			</div>
		{:else}
			<div class="w-full {compact ? 'h-full' : 'h-96'}">
				<BubbleChart datasets={chartData.datasets as any} {title} height="100%" />
			</div>
		{/if}
	{:else if chartType === 'histogram'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<HistogramChart
				labels={chartData.labels}
				data={chartData.datasets[0]?.data as number[] || []}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'boxPlot'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<BoxPlotChart
				labels={chartData.labels}
				datasets={chartData.datasets as any}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'heatmap'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<HeatmapChart
				labels={chartData.labels}
				datasets={chartData.datasets as any}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'treeMap'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<TreeMapChart
				labels={chartData.labels}
				data={chartData.datasets[0]?.data as number[] || []}
				colors={Array.isArray(chartData.datasets[0]?.backgroundColor)
					? chartData.datasets[0].backgroundColor
					: undefined}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'funnel'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<FunnelChart
				labels={chartData.labels}
				data={chartData.datasets[0]?.data as number[] || []}
				colors={Array.isArray(chartData.datasets[0]?.backgroundColor)
					? chartData.datasets[0].backgroundColor
					: undefined}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'waterfall'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<WaterfallChart
				labels={chartData.labels}
				data={chartData.datasets[0]?.data as number[] || []}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'gauge'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<GaugeChart
				value={chartData.datasets[0]?.data[0] as number || 0}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'choropleth'}
		<div class="w-full {compact ? 'h-full' : 'h-96'}">
			<ChoroplethChart
				labels={chartData.labels}
				data={chartData.datasets[0]?.data as number[] || []}
				colors={Array.isArray(chartData.datasets[0]?.backgroundColor)
					? chartData.datasets[0].backgroundColor
					: undefined}
				{title}
				height="100%"
			/>
		</div>
	{:else if chartType === 'sankey'}
		<div class="text-center">
			<div class="inline-block p-4 bg-blue-50 rounded-full mb-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-12 w-12 text-blue-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
			<p class="text-lg font-semibold text-slate-700 mb-2">Sankey Diagram</p>
			<p class="text-sm text-slate-500">Chart rendering coming soon</p>
			<p class="text-xs text-slate-400 mt-2">Configuration saved (requires D3.js implementation)</p>
		</div>
	{:else}
		<div class="text-center text-slate-400">
			<p class="{compact ? 'text-xs' : ''}">Chart type not supported</p>
		</div>
	{/if}
</div>
