<script lang="ts">
	let {
		labels = [],
		data = [],
		colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
		title = '',
		height = '400px'
	}: {
		labels: string[];
		data: number[];
		colors?: string[];
		title?: string;
		height?: string;
	} = $props();

	// Calculate rectangles using simple squarified algorithm
	const total = $derived(data.reduce((sum, val) => sum + val, 0));
	const boxes = $derived(
		labels.map((label, i) => ({
			label,
			value: data[i] || 0,
			percentage: total > 0 ? ((data[i] || 0) / total) * 100 : 0,
			color: colors[i % colors.length]
		}))
	);

	// Simple layout - just use percentages for width/height
	function getBoxStyle(box: { percentage: number }, index: number) {
		const sqrt = Math.sqrt(box.percentage);
		return {
			width: `${Math.max(sqrt * 10, 15)}%`,
			height: `${Math.max(sqrt * 10, 15)}%`,
			backgroundColor: box.color
		};
	}
</script>

<div class="flex flex-col p-6" style="height: {height}">
	{#if title}
		<h3 class="text-lg font-semibold text-slate-700 mb-4 text-center">{title}</h3>
	{/if}

	<div class="flex-1 flex flex-wrap gap-2 content-start overflow-hidden">
		{#each boxes as box, i}
			{@const style = getBoxStyle(box, i)}
			<div
				class="rounded-lg shadow-md flex flex-col items-center justify-center p-3 transition-transform hover:scale-105 cursor-pointer"
				style="width: {style.width}; height: {style.height}; background-color: {style.backgroundColor}; min-width: 80px; min-height: 60px;"
			>
				<div class="text-white font-semibold text-sm text-center mb-1 line-clamp-2">
					{box.label}
				</div>
				<div class="text-white text-lg font-bold">{box.value.toLocaleString()}</div>
				<div class="text-white text-xs opacity-90">{box.percentage.toFixed(1)}%</div>
			</div>
		{/each}
	</div>
</div>
