<script lang="ts">
	import Chart from './Chart.svelte';
	import type { ChartConfiguration } from 'chart.js';

	interface Dataset {
		label: string;
		data: number[];
		borderColor?: string;
		backgroundColor?: string;
		tension?: number;
	}

	interface AreaChartProps {
		labels: string[];
		datasets: Dataset[];
		title?: string;
		height?: string;
		stacked?: boolean;
		xAxisLabel?: string;
		yAxisLabel?: string;
		onclick?: (event: any, elements: any[]) => void;
	}

	let { labels, datasets, title, height = '300px', stacked = false, xAxisLabel, yAxisLabel, onclick }: AreaChartProps = $props();

	const config = $derived<ChartConfiguration>({
		type: 'line',
		data: {
			labels,
			datasets: datasets.map((ds) => ({
				label: ds.label,
				data: ds.data,
				borderColor: ds.borderColor || '#3b82f6',
				backgroundColor: ds.backgroundColor || 'rgba(59, 130, 246, 0.2)',
				tension: ds.tension ?? 0.4,
				fill: true,
				pointRadius: 3,
				pointHoverRadius: 5,
				borderWidth: 2
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
					mode: 'index',
					intersect: false,
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					padding: 12,
					cornerRadius: 8,
					titleFont: { size: 14, weight: 'bold' },
					bodyFont: { size: 13 }
				},
				filler: { propagate: false }
			},
			scales: {
				y: {
					stacked,
					beginAtZero: true,
					grid: { color: 'rgba(0, 0, 0, 0.05)' },
					title: {
						display: !!yAxisLabel,
						text: yAxisLabel || '',
						font: { size: 12, weight: 'normal' },
						color: '#64748b',
						padding: { bottom: 8 }
					}
				},
				x: {
					grid: { display: false },
					title: {
						display: !!xAxisLabel,
						text: xAxisLabel || '',
						font: { size: 12, weight: 'normal' },
						color: '#64748b',
						padding: { top: 8 }
					}
				}
			},
			interaction: { mode: 'nearest', axis: 'x', intersect: false }
		}
	});
</script>

<Chart {config} {height} {onclick} />
