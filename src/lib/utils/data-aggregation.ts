import type { ViewConfig, ChartData, FormField } from '$lib/types/views';

/**
 * Aggregates submission data based on view configuration
 * Handles count, sum, average aggregations
 * Groups data by specified field for bar/pie/doughnut charts
 */
export function aggregateSubmissionData(
	submissions: any[],
	config: ViewConfig,
	allFields: FormField[]
): ChartData {
	// Filter submissions by formId
	const filtered = submissions.filter((s) => s.formId === config.formId);

	// Handle different chart types based on config properties
	if (config.xAxis && config.yAxis && config.scatter) {
		// Scatter chart (raw x/y pairs, no aggregation)
		return aggregateScatterChart(filtered, config, allFields);
	} else if (config.xAxis && config.yAxis) {
		// Bar chart or line chart (x/y axis)
		return aggregateXYChart(filtered, config, allFields);
	} else if (config.groupBy && config.field) {
		// Pie/Doughnut/Radar chart (group by category)
		return aggregateCategoryChart(filtered, config, allFields);
	} else if (config.field) {
		// Number card (single value)
		return aggregateNumberCard(filtered, config);
	}

	return { labels: [], datasets: [] };
}

function aggregateNumberCard(submissions: any[], config: ViewConfig): ChartData {
	const values = submissions.map((s) => extractFieldValue(s, config.field!));
	let result = 0;

	if (config.aggregation === 'sum') {
		result = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
	} else if (config.aggregation === 'count') {
		result = values.length;
	} else if (config.aggregation === 'average') {
		result = values.reduce((sum, val) => sum + (Number(val) || 0), 0) / (values.length || 1);
	}

	return {
		labels: ['Total'],
		datasets: [{ label: 'Value', data: [result] }]
	};
}

function aggregateScatterChart(
	submissions: any[],
	config: ViewConfig,
	allFields: FormField[]
): ChartData {
	const points = submissions
		.map((s) => ({
			x: Number(extractFieldValue(s, config.xAxis!)) || 0,
			y: Number(extractFieldValue(s, config.yAxis!)) || 0
		}))
		.filter((p) => !isNaN(p.x) && !isNaN(p.y));

	return {
		labels: [],
		datasets: [
			{
				label: `${getFieldLabel(config.xAxis!, allFields)} vs ${getFieldLabel(config.yAxis!, allFields)}`,
				data: points,
				backgroundColor: config.colors?.[0] || 'rgba(59, 130, 246, 0.6)',
				borderColor: config.colors?.[0] || '#3b82f6'
			}
		]
	};
}

function aggregateXYChart(
	submissions: any[],
	config: ViewConfig,
	allFields: FormField[]
): ChartData {
	// Special handling for time-based grouping (score trends)
	if (config.xAxis === 'submittedAt' && config.groupBy) {
		return aggregateTimeSeriesChart(submissions, config, allFields);
	}

	// Group submissions by X-axis field value
	const grouped = new Map<string, number[]>();

	submissions.forEach((submission) => {
		const xValue = String(extractFieldValue(submission, config.xAxis!));
		const yValue = Number(extractFieldValue(submission, config.yAxis!)) || 0;

		if (!grouped.has(xValue)) {
			grouped.set(xValue, []);
		}
		grouped.get(xValue)!.push(yValue);
	});

	// Aggregate Y values per X category
	const labels: string[] = [];
	const data: number[] = [];

	grouped.forEach((values, label) => {
		labels.push(label);

		if (config.aggregation === 'sum') {
			data.push(values.reduce((a, b) => a + b, 0));
		} else if (config.aggregation === 'count') {
			data.push(values.length);
		} else if (config.aggregation === 'average') {
			data.push(values.reduce((a, b) => a + b, 0) / values.length);
		}
	});

	return {
		labels,
		datasets: [
			{
				label: getFieldLabel(config.yAxis!, allFields),
				data,
				backgroundColor: config.colors?.[0] || '#3b82f6'
			}
		]
	};
}

function aggregateTimeSeriesChart(
	submissions: any[],
	config: ViewConfig,
	allFields: FormField[]
): ChartData {
	// Group by time period (month, week, etc.)
	const grouped = new Map<string, number[]>();

	submissions.forEach((submission) => {
		const timestamp = submission.createdAt || submission.submittedAt;
		if (!timestamp) return;

		const date = new Date(timestamp);
		let periodKey: string;

		// Group by the specified period
		switch (config.groupBy) {
			case 'month':
				periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
				break;
			case 'week':
				// Get week number
				const weekNum = Math.ceil(date.getDate() / 7);
				periodKey = `${date.getFullYear()}-W${weekNum}`;
				break;
			case 'day':
				periodKey = date.toISOString().split('T')[0];
				break;
			default:
				periodKey = date.toISOString().split('T')[0];
		}

		const value = Number(extractFieldValue(submission, config.field!)) || 0;

		if (!grouped.has(periodKey)) {
			grouped.set(periodKey, []);
		}
		grouped.get(periodKey)!.push(value);
	});

	// Sort by period key
	const sortedEntries = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));

	const labels: string[] = [];
	const data: number[] = [];

	sortedEntries.forEach(([period, values]) => {
		labels.push(period);

		if (config.aggregation === 'average') {
			data.push(values.reduce((a, b) => a + b, 0) / values.length);
		} else if (config.aggregation === 'sum') {
			data.push(values.reduce((a, b) => a + b, 0));
		} else if (config.aggregation === 'count') {
			data.push(values.length);
		}
	});

	return {
		labels,
		datasets: [
			{
				label: getFieldLabel(config.field!, allFields),
				data,
				backgroundColor: config.colors?.[0] || '#3b82f6',
				borderColor: config.colors?.[0] || '#3b82f6'
			}
		]
	};
}

function aggregateCategoryChart(
	submissions: any[],
	config: ViewConfig,
	allFields: FormField[]
): ChartData {
	// Special handling for pillar grouping (system views)
	if (config.groupBy === 'pillar') {
		return aggregatePillarChart(submissions, config);
	}

	// Similar to X/Y but for pie/doughnut
	const grouped = new Map<string, number[]>();

	submissions.forEach((submission) => {
		const category = String(extractFieldValue(submission, config.groupBy!));
		const value = Number(extractFieldValue(submission, config.field!)) || 0;

		if (!grouped.has(category)) {
			grouped.set(category, []);
		}
		grouped.get(category)!.push(value);
	});

	const labels: string[] = [];
	const data: number[] = [];

	grouped.forEach((values, label) => {
		labels.push(label);

		if (config.aggregation === 'sum') {
			data.push(values.reduce((a, b) => a + b, 0));
		} else if (config.aggregation === 'count') {
			data.push(values.length);
		} else if (config.aggregation === 'average') {
			data.push(values.reduce((a, b) => a + b, 0) / values.length);
		}
	});

	return {
		labels,
		datasets: [
			{
				label: getFieldLabel(config.field!, allFields),
				data,
				backgroundColor:
					config.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
			}
		]
	};
}

function aggregatePillarChart(submissions: any[], config: ViewConfig): ChartData {
	// Aggregate section scores across submissions
	const pillarTotals = new Map<string, number[]>();

	submissions.forEach((submission) => {
		if (submission.sectionScores) {
			try {
				const sectionScores =
					typeof submission.sectionScores === 'string'
						? JSON.parse(submission.sectionScores)
						: submission.sectionScores;

				Object.entries(sectionScores).forEach(([pillarId, score]) => {
					if (!pillarTotals.has(pillarId)) {
						pillarTotals.set(pillarId, []);
					}
					pillarTotals.get(pillarId)!.push(Number(score) || 0);
				});
			} catch (e) {
				console.error('Error parsing section scores:', e);
			}
		}
	});

	const labels: string[] = [];
	const data: number[] = [];

	pillarTotals.forEach((scores, pillarId) => {
		labels.push(pillarId); // Could map to human-readable names if needed
		const average = scores.reduce((a, b) => a + b, 0) / scores.length;
		data.push(average);
	});

	return {
		labels,
		datasets: [
			{
				label: 'Average Score',
				data,
				backgroundColor: config.colors?.[0] || '#3b82f6'
			}
		]
	};
}

function extractFieldValue(submission: any, fieldId: string): string {
	// Handle special score-related fields (system views)
	if (fieldId === 'overallScore') {
		return submission.overallScore !== undefined && submission.overallScore !== null
			? String(submission.overallScore)
			: '';
	}

	if (fieldId === 'healthStatus') {
		const score = submission.overallScore;
		if (score == null) return 'No Data';
		if (score >= 80) return 'Healthy';
		if (score >= 60) return 'At Risk';
		return 'Critical';
	}

	if (fieldId === 'agentName') {
		return submission.submittedByUser?.name || submission.agentName || 'Unknown';
	}

	if (fieldId === 'submittedAt' || fieldId === 'createdAt') {
		return submission.createdAt || submission.submittedAt || '';
	}

	// Handle both object notation (answers.fieldId) and direct property access
	if (submission.answers) {
		const value = submission.answers[fieldId];
		// Handle array values (like checkbox selections)
		if (Array.isArray(value)) {
			return value.join(', ');
		}
		return value !== undefined && value !== null ? String(value) : '';
	}
	const value = submission[fieldId];
	if (Array.isArray(value)) {
		return value.join(', ');
	}
	return value !== undefined && value !== null ? String(value) : '';
}

function getFieldLabel(fieldId: string, allFields: FormField[]): string {
	return allFields.find((f) => f.id === fieldId)?.label || fieldId;
}

/**
 * Extracts all form fields from multiple forms in a project
 */
export function getAllProjectFields(forms: any[]): FormField[] {
	const fields: FormField[] = [];

	forms.forEach((form) => {
		// Forms from the API store fields inside a JSON-encoded `schema` field.
		// Forms passed directly (e.g. from mock data) may have a `fields` array.
		let formFields: any[] = [];
		if (Array.isArray(form.fields)) {
			formFields = form.fields;
		} else if (typeof form.schema === 'string') {
			try {
				const parsed = JSON.parse(form.schema);
				formFields = Array.isArray(parsed.fields) ? parsed.fields : [];
			} catch {
				formFields = [];
			}
		}

		formFields
			.filter((field: any) => field.type !== 'pageBreak')
			.forEach((field: any) => {
				fields.push({
					id: field.id,
					label: field.label,
					type: field.type,
					formId: form.id,
					formName: form.title || form.name
				});
			});
	});

	return fields;
}

/**
 * Filters fields to only numeric types for aggregation
 */
export function getNumericFields(fields: FormField[]): FormField[] {
	return fields.filter((f) => f.type === 'number');
}

/**
 * Gets categorical fields suitable for grouping
 */
export function getCategoricalFields(fields: FormField[]): FormField[] {
	return fields.filter((f) =>
		['text', 'radio', 'select', 'checkbox', 'email', 'phone'].includes(f.type)
	);
}

/**
 * Gets all fields that can be used as axes (both numeric and categorical)
 */
export function getAllAxisFields(fields: FormField[]): FormField[] {
	return fields.filter((f) =>
		['text', 'number', 'radio', 'select', 'checkbox', 'email', 'phone', 'date'].includes(f.type)
	);
}
