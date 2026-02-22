<script lang="ts">
	import Chart from './Chart.svelte';
	import type { ChartConfiguration } from 'chart.js';

	interface DoughnutChartProps {
		labels: string[];
		data: number[];
		colors?: string[];
		title?: string;
		height?: string;
		onclick?: (event: any, elements: any[]) => void;
	}

	let { labels, data, colors, title, height = '300px', onclick }: DoughnutChartProps = $props();

	const defaultColors = [
		'#3b82f6', // blue
		'#10b981', // green
		'#f59e0b', // yellow
		'#ef4444', // red
		'#8b5cf6', // purple
		'#ec4899', // pink
		'#06b6d4', // cyan
		'#f97316' // orange
	];

	const config = $derived<ChartConfiguration>({
		type: 'doughnut',
		data: {
			labels,
			datasets: [
				{
					data,
					backgroundColor: colors || defaultColors.slice(0, data.length),
					borderWidth: 2,
					borderColor: '#ffffff',
					hoverBorderWidth: 3,
					hoverOffset: 8
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: true,
					position: 'bottom',
					labels: {
						padding: 15,
						usePointStyle: true,
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
					},
					padding: {
						bottom: 20
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
					},
					callbacks: {
						label: function (context) {
							const label = context.label || '';
							const value = context.parsed || 0;
							const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
							const percentage = ((value / total) * 100).toFixed(1);
							return `${label}: ${value} (${percentage}%)`;
						}
					}
				}
			},
			cutout: '65%'
		}
	});
</script>

<Chart {config} {height} {onclick} />
