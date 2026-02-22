<script lang="ts">
	import Chart from './Chart.svelte';
	import type { ChartConfiguration } from 'chart.js';

	interface Dataset {
		label: string;
		data: number[];
		backgroundColor?: string | string[];
		borderColor?: string | string[];
	}

	interface BarChartProps {
		labels: string[];
		datasets: Dataset[];
		title?: string;
		height?: string;
		horizontal?: boolean;
		stacked?: boolean;
		grouped?: boolean;
		xAxisLabel?: string;
		yAxisLabel?: string;
		onclick?: (event: any, elements: any[]) => void;
	}

	let {
		labels,
		datasets,
		title,
		height = '300px',
		horizontal = false,
		stacked = false,
		grouped = false,
		xAxisLabel,
		yAxisLabel,
		onclick
	}: BarChartProps = $props();

	const defaultColors = [
		'#3b82f6', // blue
		'#10b981', // green
		'#f59e0b', // yellow
		'#ef4444', // red
		'#8b5cf6' // purple
	];

	const config = $derived<ChartConfiguration>({
		type: 'bar',
		data: {
			labels,
			datasets: datasets.map((ds, index) => ({
				label: ds.label,
				data: ds.data,
				backgroundColor: ds.backgroundColor || defaultColors[index % defaultColors.length],
				borderColor: ds.borderColor || defaultColors[index % defaultColors.length],
				borderWidth: 0,
				borderRadius: 6,
				barPercentage: 0.7
			}))
		},
		options: {
			indexAxis: horizontal ? 'y' : 'x',
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: datasets.length > 1,
					position: 'top',
					labels: {
						usePointStyle: true,
						padding: 15,
						font: {
							size: 12
						}
					}
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
				x: {
					stacked,
					grid: {
						display: !horizontal,
						color: 'rgba(0, 0, 0, 0.05)'
					},
					title: {
						display: !!(horizontal ? yAxisLabel : xAxisLabel),
						text: (horizontal ? yAxisLabel : xAxisLabel) || '',
						font: { size: 12, weight: 'normal' },
						color: '#64748b',
						padding: { top: 8 }
					}
				},
				y: {
					stacked,
					beginAtZero: true,
					grid: {
						display: horizontal,
						color: 'rgba(0, 0, 0, 0.05)'
					},
					title: {
						display: !!(horizontal ? xAxisLabel : yAxisLabel),
						text: (horizontal ? xAxisLabel : yAxisLabel) || '',
						font: { size: 12, weight: 'normal' },
						color: '#64748b',
						padding: { bottom: 8 }
					}
				}
			}
		}
	});
</script>

<Chart {config} {height} {onclick} />
