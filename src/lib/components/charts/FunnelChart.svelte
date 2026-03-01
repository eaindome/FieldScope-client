<script lang="ts">
	let {
		labels = [],
		data = [],
		colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
		title = '',
		height = '400px'
	}: {
		labels: string[];
		data: number[];
		colors?: string[];
		title?: string;
		height?: string;
	} = $props();

	// Calculate percentages and widths
	const maxValue = $derived(Math.max(...data));
	const stages = $derived(
		labels.map((label, i) => ({
			label,
			value: data[i] || 0,
			percentage: maxValue > 0 ? ((data[i] || 0) / maxValue) * 100 : 0,
			color: colors[i % colors.length],
			conversionRate:
				i > 0 && data[i - 1] > 0 ? ((data[i] / data[i - 1]) * 100).toFixed(1) : null
		}))
	);
</script>

<div class="flex flex-col p-6 overflow-hidden" style="height: {height}">
	{#if title}
		<h3 class="text-lg font-semibold text-slate-700 mb-4 text-center">{title}</h3>
	{/if}

	<div class="flex-1 flex flex-col justify-center space-y-2 overflow-y-auto">
		{#each stages as stage, i}
			<div class="flex flex-col items-center shrink-0">
				<!-- Funnel segment -->
				<div
					class="relative transition-all duration-300 hover:opacity-90"
					style="width: {Math.max(stage.percentage, 30)}%; min-width: 120px; max-width: 100%;"
				>
					<div
						class="py-3 px-4 rounded-lg shadow-md text-white text-center"
						style="background-color: {stage.color}"
					>
						<div class="font-semibold text-xs mb-1 truncate">{stage.label}</div>
						<div class="text-lg font-bold">{stage.value.toLocaleString()}</div>
						{#if stage.conversionRate}
							<div class="text-xs mt-0.5 opacity-90">
								{stage.conversionRate}% conversion
							</div>
						{/if}
					</div>
				</div>

				<!-- Connector arrow (except for last item) -->
				{#if i < stages.length - 1}
					<div class="my-1">
						<svg width="20" height="20" viewBox="0 0 20 20" class="text-slate-300">
							<path
								d="M10 5 L10 15 M10 15 L6 11 M10 15 L14 11"
								stroke="currentColor"
								stroke-width="2"
								fill="none"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
