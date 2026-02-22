<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	let {
		labels = [],
		data = [],
		title = '',
		height = '400px',
		color = '#3b82f6'
	}: {
		labels: string[];
		data: number[];
		title?: string;
		height?: string;
		color?: string;
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clone data to avoid Svelte 5 reactivity issues
		const labelsClone = [...labels];
		const dataClone = [...data];

		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labelsClone,
				datasets: [
					{
						label: 'Frequency',
						data: dataClone,
						backgroundColor: color + '80',
						borderColor: color,
						borderWidth: 2,
						barPercentage: 1.0,
						categoryPercentage: 1.0
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
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Range'
						},
						grid: {
							display: false
						}
					},
					y: {
						title: {
							display: true,
							text: 'Frequency'
						},
						beginAtZero: true
					}
				}
			}
		});

		return () => {
			chart.destroy();
		};
	});

	$effect(() => {
		if (chart) {
			chart.data.labels = [...labels];
			chart.data.datasets[0].data = [...data];
			chart.data.datasets[0].backgroundColor = color + '80';
			chart.data.datasets[0].borderColor = color;
			chart.update();
		}
	});
</script>

<div style="height: {height}; position: relative;">
	<canvas bind:this={canvas}></canvas>
</div>
