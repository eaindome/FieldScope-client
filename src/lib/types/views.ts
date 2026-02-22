// Chart types supported (18 standard types)
export type ChartType =
	// Bar & Column Charts
	| 'bar' // Simple vertical bar
	| 'groupedBar' // Grouped vertical bars
	| 'stackedBar' // Stacked vertical bars
	| 'horizontalBar' // Horizontal bar
	// Line & Area Charts
	| 'line' // Line chart
	| 'area' // Area chart
	| 'stackedArea' // Stacked area
	// Pie & Donut
	| 'pie' // Pie chart
	| 'doughnut' // Donut chart
	// Scatter & Bubble
	| 'scatter' // Scatter plot (2D)
	| 'bubble' // Bubble chart (3D - size variable)
	// Distribution & Statistical
	| 'histogram' // Distribution over numeric buckets
	| 'boxPlot' // Box-and-whisker plot
	// Heatmap & Tree
	| 'heatmap' // Heatmap (2D matrix)
	| 'treeMap' // Tree map (hierarchical rectangles)
	// Process & Flow
	| 'funnel' // Funnel chart (conversion)
	| 'waterfall' // Waterfall chart (cumulative)
	| 'sankey' // Sankey diagram (flow)
	// Specialized
	| 'radar' // Radar/spider chart
	| 'gauge' // Gauge/speedometer
	| 'choropleth' // Map-based chart
	| 'number'; // Single number KPI

// Aggregation methods
export type AggregationType = 'sum' | 'count' | 'average';

// Field configuration based on chart type
export interface ViewConfig {
	formId: number;
	aggregation: AggregationType;

	// Basic field selections
	field?: string; // Single-value charts (number card, pie, gauge)
	groupBy?: string; // Grouped charts (bar, doughnut)
	xAxis?: string; // X-axis field for bar/line/scatter/heatmap charts
	yAxis?: string; // Y-axis field for bar/line/scatter/heatmap charts

	// Advanced field selections
	sizeField?: string; // Bubble chart - controls bubble size
	categoryField?: string; // Tree map, funnel - hierarchy/category
	valueField?: string; // Heatmap value, tree map value
	locationField?: string; // Choropleth - geographic region/area

	// Chart-specific options
	scatter?: boolean; // True for scatter (raw x/y, no aggregation)
	bucketSize?: number; // Histogram - bucket/bin size
	min?: number; // Gauge - minimum value
	max?: number; // Gauge - maximum value
	colors?: string[]; // Custom colors
}

// View definition structure (saved to backend)
export interface ViewDefinition {
	chartType: ChartType;
	description: string;
	config: ViewConfig;
}

// Full view object from API
export interface View {
	id: number;
	projectId: number;
	name: string;
	description?: string;
	definition: string; // JSON stringified ViewDefinition
	metadata?: string; // JSON stringified extra metadata
	createdAt: string;
	updatedAt: string;
}

// Form field metadata for dropdowns
export interface FormField {
	id: string;
	label: string;
	type: string;
	formId: number;
	formName: string;
}

// Aggregated chart data
export interface ChartData {
	labels: string[];
	datasets: Array<{
		label: string;
		data: number[] | Array<{ x: number; y: number }>;
		backgroundColor?: string | string[];
		borderColor?: string | string[];
	}>;
}
