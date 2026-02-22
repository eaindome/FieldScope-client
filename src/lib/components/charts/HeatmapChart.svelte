<script lang="ts">
	let {
		labels = [], // X-axis labels
		datasets = [], // Array of {label, data[]}
		title = '',
		height = '400px',
		colorScale = ['#dbeafe', '#3b82f6', '#1e40af']
	}: {
		labels: string[];
		datasets: Array<{ label: string; data: number[] }>;
		title?: string;
		height?: string;
		colorScale?: string[];
	} = $props();

	// Find min and max values for color scaling
	const allValues = $derived(datasets.flatMap((ds) => ds.data));
	const minValue = $derived(Math.min(...allValues));
	const maxValue = $derived(Math.max(...allValues));

	// Get color for value
	function getColor(value: number): string {
		if (maxValue === minValue) return colorScale[1];

		const normalized = (value - minValue) / (maxValue - minValue);

		if (normalized <= 0.5) {
			// Interpolate between first and middle color
			const t = normalized * 2;
			return interpolateColor(colorScale[0], colorScale[1], t);
		} else {
			// Interpolate between middle and last color
			const t = (normalized - 0.5) * 2;
			return interpolateColor(colorScale[1], colorScale[2], t);
		}
	}

	function interpolateColor(color1: string, color2: string, factor: number): string {
		const c1 = hexToRgb(color1);
		const c2 = hexToRgb(color2);

		const r = Math.round(c1.r + (c2.r - c1.r) * factor);
		const g = Math.round(c1.g + (c2.g - c1.g) * factor);
		const b = Math.round(c1.b + (c2.b - c1.b) * factor);

		return `rgb(${r}, ${g}, ${b})`;
	}

	function hexToRgb(hex: string): { r: number; g: number; b: number } {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
			  }
			: { r: 0, g: 0, b: 0 };
	}
</script>

<div class="flex flex-col p-6" style="height: {height}">
	{#if title}
		<h3 class="text-lg font-semibold text-slate-700 mb-4 text-center">{title}</h3>
	{/if}

	<div class="flex-1 overflow-auto">
		<div class="inline-block min-w-full">
			<!-- Heatmap grid -->
			<div class="border border-slate-200 rounded-lg overflow-hidden">
				<!-- Header row with X-axis labels -->
				<div class="flex bg-slate-50 border-b border-slate-200">
					<div class="w-32 shrink-0 p-3 border-r border-slate-200"></div>
					{#each labels as label}
						<div class="flex-1 min-w-[80px] p-3 text-center text-sm font-medium text-slate-700">
							{label}
						</div>
					{/each}
				</div>

				<!-- Data rows -->
				{#each datasets as dataset}
					<div class="flex border-b border-slate-200 last:border-b-0">
						<!-- Y-axis label -->
						<div
							class="w-32 shrink-0 p-3 border-r border-slate-200 text-sm font-medium text-slate-700 flex items-center"
						>
							{dataset.label}
						</div>

						<!-- Cells -->
						{#each dataset.data as value, i}
							<div
								class="flex-1 min-w-[80px] p-3 text-center relative group transition-transform hover:scale-105"
								style="background-color: {getColor(value)}"
							>
								<span class="text-sm font-semibold" style="color: {value > (maxValue + minValue) / 2 ? 'white' : '#1e293b'}">
									{value}
								</span>

								<!-- Tooltip on hover -->
								<div
									class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10"
								>
									<div class="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
										{labels[i]}: {value}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Legend -->
	<div class="mt-4 flex items-center justify-center gap-2">
		<span class="text-xs text-slate-500">Low</span>
		<div class="flex h-4 w-48 rounded overflow-hidden">
			{#each colorScale as color}
				<div class="flex-1" style="background-color: {color}"></div>
			{/each}
		</div>
		<span class="text-xs text-slate-500">High</span>
	</div>
</div>
