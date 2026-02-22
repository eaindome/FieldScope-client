<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	let {
		labels = [],
		data = [],
		title = '',
		height = '400px'
	}: {
		labels: string[];
		data: number[];
		title?: string;
		height?: string;
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	// Calculate cumulative values and colors
	const waterfallData = $derived.by(() => {
		let cumulative = 0;
		const result = data.map((value, i) => {
			const isTotal = i === data.length - 1;
			const start = isTotal ? 0 : cumulative;
			cumulative += value;
			const end = isTotal ? cumulative : cumulative;

			return {
				label: labels[i],
				value,
				start,
				end,
				isTotal,
				isPositive: value >= 0,
				color: isTotal ? '#64748b' : value >= 0 ? '#10b981' : '#ef4444'
			};
		});
		return result;
	});

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clone data to avoid Svelte 5 reactivity issues
		const chartData = waterfallData.map((d) => (d.isTotal ? [0, d.end] : [d.start, d.end]));
		const backgroundColors = waterfallData.map((d) => d.color);
		const labelsClone = [...labels];

		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labelsClone,
				datasets: [
					{
						label: 'Waterfall',
						data: JSON.parse(JSON.stringify(chartData)),
						backgroundColor: [...backgroundColors],
						borderColor: [...backgroundColors],
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: !!title,
						text: title,
						font: { size: 16, weight: 'bold' }
					},
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: function (context: any) {
								const idx = context.dataIndex;
								const item = waterfallData[idx];
								return item.isTotal
									? `Total: ${item.end}`
									: `${item.isPositive ? '+' : ''}${item.value} (${item.start} → ${item.end})`;
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						}
					},
					y: {
						beginAtZero: false
					}
				}
			}
		});

		return () => {
			chart.destroy();
		};
	});

	$effect(() => {
		if (chart && waterfallData) {
			const chartData = waterfallData.map((d) => (d.isTotal ? [0, d.end] : [d.start, d.end]));
			const backgroundColors = waterfallData.map((d) => d.color);

			chart.data.labels = [...labels];
			chart.data.datasets[0].data = JSON.parse(JSON.stringify(chartData));
			chart.data.datasets[0].backgroundColor = [...backgroundColors];
			chart.data.datasets[0].borderColor = [...backgroundColors];
			chart.update();
		}
	});
</script>

<div style="height: {height}; position: relative;">
	<canvas bind:this={canvas}></canvas>
</div>
