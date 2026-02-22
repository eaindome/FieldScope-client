<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	let {
		datasets = [],
		title = '',
		height = '400px'
	}: {
		datasets: Array<{
			label: string;
			data: Array<{ x: number; y: number; r: number }>;
			backgroundColor?: string;
		}>;
		title?: string;
		height?: string;
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clone datasets to avoid Svelte 5 reactivity issues
		const clonedDatasets = JSON.parse(JSON.stringify(datasets));

		chart = new Chart(ctx, {
			type: 'bubble',
			data: {
				datasets: clonedDatasets.map((ds: any) => ({
					...ds,
					backgroundColor: ds.backgroundColor || '#3b82f680',
					borderColor: ds.backgroundColor?.replace('80', '') || '#3b82f6',
					borderWidth: 2
				}))
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
						display: datasets.length > 1,
						position: 'top'
					},
					tooltip: {
						callbacks: {
							label: function (context: any) {
								const point = context.raw;
								return `${context.dataset.label}: (${point.x}, ${point.y}) Size: ${point.r}`;
							}
						}
					}
				},
				scales: {
					x: {
						type: 'linear',
						position: 'bottom',
						title: {
							display: true,
							text: 'X Axis'
						}
					},
					y: {
						title: {
							display: true,
							text: 'Y Axis'
						}
					}
				}
			}
		});

		return () => {
			chart.destroy();
		};
	});

	$effect(() => {
		if (chart && datasets) {
			const clonedDatasets = JSON.parse(JSON.stringify(datasets));
			chart.data.datasets = clonedDatasets.map((ds: any) => ({
				...ds,
				backgroundColor: ds.backgroundColor || '#3b82f680',
				borderColor: ds.backgroundColor?.replace('80', '') || '#3b82f6',
				borderWidth: 2
			}));
			chart.update();
		}
	});
</script>

<div style="height: {height}; position: relative;">
	<canvas bind:this={canvas}></canvas>
</div>
