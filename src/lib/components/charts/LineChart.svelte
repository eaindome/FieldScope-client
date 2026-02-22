<script lang="ts">
	import Chart from './Chart.svelte';
	import type { ChartConfiguration } from 'chart.js';

	interface Dataset {
		label: string;
		data: number[];
		borderColor?: string;
		backgroundColor?: string;
		tension?: number;
		fill?: boolean;
	}

	interface LineChartProps {
		labels: string[];
		datasets: Dataset[];
		title?: string;
		height?: string;
		xAxisLabel?: string;
		yAxisLabel?: string;
		onclick?: (event: any, elements: any[]) => void;
	}

	let { labels, datasets, title, height = '300px', xAxisLabel, yAxisLabel, onclick }: LineChartProps = $props();

	const config = $derived<ChartConfiguration>({
		type: 'line',
		data: {
			labels,
			datasets: datasets.map((ds) => ({
				label: ds.label,
				data: ds.data,
				borderColor: ds.borderColor || '#3b82f6',
				backgroundColor: ds.backgroundColor || 'rgba(59, 130, 246, 0.1)',
				tension: ds.tension ?? 0.4,
				fill: ds.fill ?? false,
				pointRadius: 4,
				pointHoverRadius: 6,
				borderWidth: 2
			}))
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: datasets.length > 1,
					position: 'top'
				},
				title: {
					display: !!title,
					text: title || '',
					font: {
						size: 16,
						weight: 'bold'
					}
				},
				tooltip: {
					mode: 'index',
					intersect: false,
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					padding: 12,
					cornerRadius: 8,
					titleFont: {
						size: 14,
						weight: 'bold'
					},
					bodyFont: {
						size: 13
					}
				}
			},
			scales: {
				y: {
					beginAtZero: true,
					grid: {
						color: 'rgba(0, 0, 0, 0.05)'
					},
					title: {
						display: !!yAxisLabel,
						text: yAxisLabel || '',
						font: { size: 12, weight: 'normal' },
						color: '#64748b',
						padding: { bottom: 8 }
					}
				},
				x: {
					grid: {
						display: false
					},
					title: {
						display: !!xAxisLabel,
						text: xAxisLabel || '',
						font: { size: 12, weight: 'normal' },
						color: '#64748b',
						padding: { top: 8 }
					}
				}
			},
			interaction: {
				mode: 'nearest',
				axis: 'x',
				intersect: false
			}
		}
	});
</script>

<Chart {config} {height} {onclick} />
