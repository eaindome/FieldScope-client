<script lang="ts">
	import Chart from './Chart.svelte';
	import type { ChartConfiguration } from 'chart.js';

	interface Dataset {
		label: string;
		data: number[];
		borderColor?: string;
		backgroundColor?: string;
	}

	interface RadarChartProps {
		labels: string[];
		datasets: Dataset[];
		title?: string;
		height?: string;
	}

	let { labels, datasets, title, height = '300px' }: RadarChartProps = $props();

	const defaultColors = [
		{ border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
		{ border: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
		{ border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
		{ border: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
		{ border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)' }
	];

	const config = $derived<ChartConfiguration>({
		type: 'radar',
		data: {
			labels,
			datasets: datasets.map((ds, i) => ({
				label: ds.label,
				data: ds.data,
				borderColor: ds.borderColor || defaultColors[i % defaultColors.length].border,
				backgroundColor: ds.backgroundColor || defaultColors[i % defaultColors.length].bg,
				borderWidth: 2,
				pointRadius: 4,
				pointHoverRadius: 6
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
					cornerRadius: 8
				}
			},
			scales: {
				r: {
					beginAtZero: true,
					grid: { color: 'rgba(0, 0, 0, 0.08)' },
					ticks: { font: { size: 11 } }
				}
			}
		}
	});
</script>

<Chart {config} {height} />
