<script lang="ts">
	import Chart from './Chart.svelte';
	import type { ChartConfiguration } from 'chart.js';

	interface ScatterPoint {
		x: number;
		y: number;
	}

	interface Dataset {
		label: string;
		data: ScatterPoint[];
		backgroundColor?: string;
		borderColor?: string;
	}

	interface ScatterChartProps {
		datasets: Dataset[];
		xLabel?: string;
		yLabel?: string;
		title?: string;
		height?: string;
	}

	let { datasets, xLabel, yLabel, title, height = '300px' }: ScatterChartProps = $props();

	const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

	const config = $derived<ChartConfiguration>({
		type: 'scatter',
		data: {
			datasets: datasets.map((ds, i) => ({
				label: ds.label,
				data: ds.data,
				backgroundColor: ds.backgroundColor || defaultColors[i % defaultColors.length] + 'cc',
				borderColor: ds.borderColor || defaultColors[i % defaultColors.length],
				borderWidth: 1,
				pointRadius: 5,
				pointHoverRadius: 7
			}))
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: datasets.length > 1,
					position: 'top',
					labels: {
						usePointStyle: true,
						padding: 15,
						font: { size: 12 }
					}
				},
				title: {
					display: !!title,
					text: title || '',
					font: { size: 16, weight: 'bold' }
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					padding: 12,
					cornerRadius: 8,
					callbacks: {
						label: (ctx: any) => `(${ctx.parsed.x}, ${ctx.parsed.y})`
					}
				}
			},
			scales: {
				x: {
					title: {
						display: !!xLabel,
						text: xLabel || ''
					},
					grid: { color: 'rgba(0, 0, 0, 0.05)' }
				},
				y: {
					title: {
						display: !!yLabel,
						text: yLabel || ''
					},
					beginAtZero: false,
					grid: { color: 'rgba(0, 0, 0, 0.05)' }
				}
			}
		}
	});
</script>

<Chart {config} {height} />