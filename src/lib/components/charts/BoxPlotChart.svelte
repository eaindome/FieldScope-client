<script lang="ts">
	let {
		labels = [],
		datasets = [],
		title = '',
		height = '400px'
	}: {
		labels: string[];
		datasets: Array<{
			label: string;
			data: Array<{ min: number; q1: number; median: number; q3: number; max: number }>;
		}>;
		title?: string;
		height?: string;
	} = $props();

	// Find overall min/max for scaling
	const allValues = $derived(
		datasets.flatMap((ds) => ds.data.flatMap((d) => [d.min, d.q1, d.median, d.q3, d.max]))
	);
	const globalMin = $derived(Math.min(...allValues));
	const globalMax = $derived(Math.max(...allValues));
	const range = $derived(globalMax - globalMin);

	// Convert value to pixel position (0-100%)
	function valueToPercent(value: number): number {
		if (range === 0) return 50;
		return ((value - globalMin) / range) * 100;
	}
</script>

<div class="flex flex-col p-6" style="height: {height}">
	{#if title}
		<h3 class="text-lg font-semibold text-slate-700 mb-4 text-center">{title}</h3>
	{/if}

	<div class="flex-1 flex items-end justify-around gap-4 pb-8">
		{#each datasets[0]?.data || [] as boxData, i}
			<div class="flex flex-col items-center flex-1 max-w-[120px]">
				<!-- Box plot visualization -->
				<div class="relative w-full h-64 mb-2">
					<!-- Max whisker -->
					<div
						class="absolute left-1/2 transform -translate-x-1/2 w-px bg-slate-400"
						style="bottom: {valueToPercent(boxData.median)}%; top: {100 - valueToPercent(boxData.max)}%;"
					></div>

					<!-- Upper whisker cap -->
					<div
						class="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-slate-400"
						style="bottom: {valueToPercent(boxData.max)}%;"
					></div>

					<!-- Box (Q1 to Q3) -->
					<div
						class="absolute left-1/2 transform -translate-x-1/2 w-16 bg-blue-100 border-2 border-blue-500 rounded"
						style="bottom: {valueToPercent(boxData.q1)}%; height: {valueToPercent(boxData.q3) - valueToPercent(boxData.q1)}%;"
					>
						<!-- Median line -->
						<div
							class="absolute left-0 right-0 h-0.5 bg-blue-700"
							style="bottom: {((boxData.median - boxData.q1) / (boxData.q3 - boxData.q1)) * 100}%;"
						></div>
					</div>

					<!-- Min whisker -->
					<div
						class="absolute left-1/2 transform -translate-x-1/2 w-px bg-slate-400"
						style="bottom: {valueToPercent(boxData.min)}%; top: {100 - valueToPercent(boxData.q1)}%;"
					></div>

					<!-- Lower whisker cap -->
					<div
						class="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-slate-400"
						style="bottom: {valueToPercent(boxData.min)}%;"
					></div>
				</div>

				<!-- Label -->
				<div class="text-sm font-medium text-slate-700 text-center">{labels[i]}</div>

				<!-- Stats -->
				<div class="text-xs text-slate-500 mt-1 text-center">
					<div>Min: {boxData.min}</div>
					<div>Q1: {boxData.q1}</div>
					<div>Median: {boxData.median}</div>
					<div>Q3: {boxData.q3}</div>
					<div>Max: {boxData.max}</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Y-axis scale -->
	<div class="flex justify-between text-xs text-slate-500 mt-2">
		<span>{globalMin}</span>
		<span>{globalMax}</span>
	</div>
</div>
