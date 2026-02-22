<script lang="ts">
	let {
		labels = [],
		data = [],
		colors = [],
		title = '',
		height = '400px'
	}: {
		labels: string[];
		data: number[];
		colors?: string[];
		title?: string;
		height?: string;
	} = $props();

	// Auto-generate colors based on data intensity if not provided
	const minValue = $derived(Math.min(...data));
	const maxValue = $derived(Math.max(...data));

	function getColorForValue(value: number): string {
		if (maxValue === minValue) return '#3b82f6';

		const normalized = (value - minValue) / (maxValue - minValue);

		// Color scale from light to dark blue
		const r = Math.round(219 - normalized * 160); // 219 -> 59
		const g = Math.round(234 - normalized * 104); // 234 -> 130
		const b = Math.round(254 - normalized * 8); // 254 -> 246

		return `rgb(${r}, ${g}, ${b})`;
	}

	const regions = $derived(
		labels.map((label, i) => ({
			label,
			value: data[i] || 0,
			color: colors?.[i] || getColorForValue(data[i] || 0)
		}))
	);
</script>

<div class="flex flex-col p-6" style="height: {height}">
	{#if title}
		<h3 class="text-lg font-semibold text-slate-700 mb-4 text-center">{title}</h3>
	{/if}

	<!-- Simple region grid (placeholder for actual map) -->
	<div class="flex-1 relative bg-slate-100 rounded-lg overflow-hidden">
		<!-- Map placeholder with regions -->
		<div class="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 p-2">
			{#each regions as region, i}
				<div
					class="rounded shadow-md flex flex-col items-center justify-center p-3 transition-all hover:scale-105 cursor-pointer"
					style="background-color: {region.color}"
				>
					<div
						class="text-sm font-semibold text-center mb-1"
						style="color: {region.value > (maxValue + minValue) / 2 ? 'white' : '#1e293b'}"
					>
						{region.label}
					</div>
					<div
						class="text-xl font-bold"
						style="color: {region.value > (maxValue + minValue) / 2 ? 'white' : '#1e293b'}"
					>
						{region.value}
					</div>
				</div>
			{/each}
		</div>

		<!-- Map note -->
		<div class="absolute bottom-2 left-2 text-xs text-slate-500 bg-white px-2 py-1 rounded">
			Simplified map view
		</div>
	</div>

	<!-- Legend -->
	<div class="mt-4 flex items-center justify-center gap-2">
		<span class="text-xs text-slate-500">Low ({minValue})</span>
		<div class="flex h-4 w-48 rounded overflow-hidden">
			<div class="flex-1 bg-gradient-to-r from-blue-100 to-blue-600"></div>
		</div>
		<span class="text-xs text-slate-500">High ({maxValue})</span>
	</div>
</div>
