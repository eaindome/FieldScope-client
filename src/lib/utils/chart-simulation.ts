import type { ChartType, ViewConfig, ChartData } from '$lib/types/views';

/**
 * Generate simulated chart data for preview when no real data is available
 */
export function generateSimulatedChartData(
	chartType: ChartType,
	config: ViewConfig
): ChartData {
	// Default colors
	const colors = config.colors?.length
		? config.colors
		: [
				'#3b82f6',
				'#10b981',
				'#f59e0b',
				'#ef4444',
				'#8b5cf6',
				'#ec4899',
				'#14b8a6',
				'#f97316'
		  ];

	switch (chartType) {
		case 'bar':
		case 'horizontalBar':
		case 'line':
		case 'area':
			return {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
				datasets: [
					{
						label: 'Dataset',
						data: [12, 19, 8, 15, 22, 18],
						backgroundColor: colors[0],
						borderColor: colors[0]
					}
				]
			};

		case 'groupedBar':
		case 'stackedBar':
		case 'stackedArea':
			return {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
				datasets: [
					{
						label: 'Group A',
						data: [12, 19, 8, 15, 22, 18],
						backgroundColor: colors[0],
						borderColor: colors[0]
					},
					{
						label: 'Group B',
						data: [8, 14, 12, 9, 16, 14],
						backgroundColor: colors[1],
						borderColor: colors[1]
					},
					{
						label: 'Group C',
						data: [15, 11, 18, 13, 10, 16],
						backgroundColor: colors[2],
						borderColor: colors[2]
					}
				]
			};

		case 'pie':
		case 'doughnut':
			return {
				labels: ['Lions', 'Elephants', 'Giraffes', 'Zebras', 'Rhinos'],
				datasets: [
					{
						label: 'Wildlife Count',
						data: [35, 28, 22, 18, 12],
						backgroundColor: colors.slice(0, 5)
					}
				]
			};

		case 'scatter':
			return {
				labels: [],
				datasets: [
					{
						label: 'Data Points',
						data: [
							{ x: 10, y: 20 },
							{ x: 15, y: 35 },
							{ x: 25, y: 30 },
							{ x: 30, y: 45 },
							{ x: 40, y: 55 },
							{ x: 45, y: 50 },
							{ x: 50, y: 65 },
							{ x: 60, y: 70 }
						],
						backgroundColor: colors[0]
					}
				]
			};

		case 'bubble':
			return {
				labels: [],
				datasets: [
					{
						label: 'Bubble Data',
						data: [
							{ x: 10, y: 20, r: 10 },
							{ x: 15, y: 35, r: 15 },
							{ x: 25, y: 30, r: 8 },
							{ x: 30, y: 45, r: 20 },
							{ x: 40, y: 55, r: 12 },
							{ x: 50, y: 65, r: 18 }
						] as any,
						backgroundColor: colors[0]
					}
				]
			};

		case 'radar':
			return {
				labels: ['Speed', 'Strength', 'Agility', 'Intelligence', 'Endurance'],
				datasets: [
					{
						label: 'Species A',
						data: [80, 70, 90, 60, 75],
						backgroundColor: colors[0] + '40',
						borderColor: colors[0]
					},
					{
						label: 'Species B',
						data: [60, 85, 70, 80, 65],
						backgroundColor: colors[1] + '40',
						borderColor: colors[1]
					}
				]
			};

		case 'histogram':
			return {
				labels: ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80'],
				datasets: [
					{
						label: 'Frequency',
						data: [5, 12, 18, 25, 20, 15, 8, 3],
						backgroundColor: colors[0]
					}
				]
			};

		case 'boxPlot':
			return {
				labels: ['Group A', 'Group B', 'Group C', 'Group D'],
				datasets: [
					{
						label: 'Distribution',
						data: [
							{ min: 10, q1: 20, median: 30, q3: 40, max: 50 },
							{ min: 15, q1: 25, median: 35, q3: 45, max: 55 },
							{ min: 8, q1: 18, median: 28, q3: 38, max: 48 },
							{ min: 12, q1: 22, median: 32, q3: 42, max: 52 }
						] as any,
						backgroundColor: colors[0]
					}
				]
			};

		case 'heatmap':
			return {
				labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
				datasets: [
					{
						label: 'Week 1',
						data: [12, 25, 18, 30, 22, 15, 8]
					},
					{
						label: 'Week 2',
						data: [18, 22, 28, 25, 20, 12, 10]
					},
					{
						label: 'Week 3',
						data: [15, 28, 32, 28, 25, 18, 12]
					},
					{
						label: 'Week 4',
						data: [20, 30, 25, 35, 28, 22, 15]
					}
				] as any
			};

		case 'treeMap':
			return {
				labels: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'],
				datasets: [
					{
						label: 'Tree Map',
						data: [45, 30, 25, 20, 15],
						backgroundColor: colors.slice(0, 5)
					}
				]
			};

		case 'funnel':
			return {
				labels: ['Awareness', 'Interest', 'Consideration', 'Intent', 'Purchase'],
				datasets: [
					{
						label: 'Conversion Funnel',
						data: [1000, 750, 500, 300, 150],
						backgroundColor: colors.slice(0, 5)
					}
				]
			};

		case 'waterfall':
			return {
				labels: ['Start', 'Revenue', 'Costs', 'Marketing', 'Operations', 'Total'],
				datasets: [
					{
						label: 'Waterfall',
						data: [100, 50, -20, -15, -10, 105],
						backgroundColor: colors[0]
					}
				]
			};

		case 'sankey':
			return {
				labels: ['Source A', 'Source B', 'Target X', 'Target Y', 'Target Z'],
				datasets: [
					{
						label: 'Flow',
						data: [
							{ from: 'Source A', to: 'Target X', value: 30 },
							{ from: 'Source A', to: 'Target Y', value: 20 },
							{ from: 'Source B', to: 'Target Y', value: 25 },
							{ from: 'Source B', to: 'Target Z', value: 15 }
						] as any,
						backgroundColor: colors
					}
				]
			};

		case 'gauge':
			return {
				labels: ['Value'],
				datasets: [
					{
						label: 'Gauge',
						data: [75],
						backgroundColor: colors[0]
					}
				]
			};

		case 'choropleth':
			return {
				labels: ['Region A', 'Region B', 'Region C', 'Region D', 'Region E'],
				datasets: [
					{
						label: 'Map Data',
						data: [85, 62, 45, 78, 92],
						backgroundColor: colors.slice(0, 5)
					}
				]
			};

		case 'number':
			return {
				labels: [],
				datasets: [
					{
						label: 'Total Count',
						data: [1247],
						backgroundColor: colors[0]
					}
				]
			};

		default:
			return { labels: [], datasets: [] };
	}
}
