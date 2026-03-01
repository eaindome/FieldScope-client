<script lang="ts">
	let {
		value = 0,
		min = 0,
		max = 100,
		title = '',
		height = '400px'
	}: {
		value: number;
		min?: number;
		max?: number;
		title?: string;
		height?: string;
	} = $props();

	// Calculate percentage and angle
	const percentage = $derived(Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)));
	const angle = $derived((percentage / 100) * 180); // 0-180 degrees

	// Color based on percentage
	const color = $derived(
		percentage < 33 ? '#ef4444' : percentage < 66 ? '#f59e0b' : '#10b981'
	);
</script>

<div class="flex flex-col items-center justify-center p-8" style="height: {height}">
	{#if title}
		<h3 class="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
	{/if}

	<!-- Gauge SVG -->
	<div class="relative" style="width: 280px; height: 180px;">
		<svg viewBox="0 0 200 120" class="w-full h-full">
			<!-- Background arc -->
			<path
				d="M 20 100 A 80 80 0 0 1 180 100"
				fill="none"
				stroke="#e2e8f0"
				stroke-width="20"
				stroke-linecap="round"
			/>

			<!-- Value arc -->
			<path
				d="M 20 100 A 80 80 0 0 1 180 100"
				fill="none"
				stroke={color}
				stroke-width="20"
				stroke-linecap="round"
				stroke-dasharray="251.2"
				stroke-dashoffset={251.2 * (1 - percentage / 100)}
				class="transition-all duration-1000"
			/>

			<!-- Needle -->
			<g transform="translate(100, 100)">
				<line
					x1="0"
					y1="0"
					x2="0"
					y2="-70"
					stroke="#334155"
					stroke-width="3"
					stroke-linecap="round"
					transform="rotate({angle - 90})"
					class="transition-transform duration-700"
				/>
				<circle cx="0" cy="0" r="6" fill="#334155" />
			</g>
		</svg>

		<!-- Value range display -->
		<div class="absolute inset-x-0 bottom-0 text-center">
			<div class="text-sm text-slate-500">
				{min} - {max}
			</div>
		</div>
	</div>

	<!-- Value and Percentage -->
	<div class="mt-4 text-center">
		<div class="text-4xl font-bold" style="color: {color}">{value.toFixed(1)}</div>
		<div class="text-lg text-slate-600 mt-1">{percentage.toFixed(1)}%</div>
	</div>
</div>
