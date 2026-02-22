<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/api/client';
	import type { ScoreAnalytics, ScoreTrends } from '$lib/types/analytics';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { Chart } from 'chart.js/auto';

	const projectId = Number($page.params.projectId);

	// State
	let project = $state<any | null>(null);
	let forms = $state<any[]>([]);
	let analytics = $state<ScoreAnalytics | null>(null);
	let trends = $state<ScoreTrends | null>(null);
	let loading = $state(true);
	let loadingAnalytics = $state(false);
	let error = $state<string | null>(null);

	// Filter state
	let selectedFormId = $state<number | null>(null);
	let clusterField = $state('');
	let clusterValue = $state('');
	let vendorField = $state('');
	let vendorValue = $state('');
	let agentId = $state<number | null>(null);
	let startDate = $state('');
	let endDate = $state('');
	let groupBy = $state('');

	// Chart refs
	let gaugeCanvas = $state<HTMLCanvasElement | undefined>(undefined);
	let barCanvas = $state<HTMLCanvasElement | undefined>(undefined);
	let trendCanvas = $state<HTMLCanvasElement | undefined>(undefined);
	let gaugeChart: Chart | null = null;
	let barChart: Chart | null = null;
	let trendChart: Chart | null = null;

	// Trend filter
	let trendGroupBy = $state('month');

	onMount(async () => {
		await loadInitialData();
		await loadAnalytics();
		await loadTrends();
	});

	async function loadInitialData() {
		// Load project details
		const { data: projectData } = await api.getProject(projectId);
		project = projectData;

		// Load forms — only scoring-enabled forms are relevant for analytics
		const { data: formsData } = await api.getProjectForms(projectId);
		forms = (formsData || []).filter((f: any) => {
			try { return JSON.parse(f.metadata || '{}').scoringEnabled || false; } catch { return false; }
		});

		// Pre-select form from URL params
		const urlFormId = $page.url.searchParams.get('formId');
		if (urlFormId) selectedFormId = Number(urlFormId);

		loading = false;
	}

	async function loadAnalytics() {
		if (!project) return;

		loadingAnalytics = true;
		error = null;

		const filters: any = {};
		if (selectedFormId) filters.formId = selectedFormId;
		if (clusterField && clusterValue) {
			filters.clusterField = clusterField;
			filters.clusterValue = clusterValue;
		}
		if (vendorField && vendorValue) {
			filters.vendorField = vendorField;
			filters.vendorValue = vendorValue;
		}
		if (agentId) filters.agentId = agentId;
		if (startDate) filters.startDate = startDate;
		if (endDate) filters.endDate = endDate;
		if (groupBy) filters.groupBy = groupBy;

		const { data, error: err } = await api.getScoreAnalytics(projectId, filters);
		if (err) {
			error = err;
		} else {
			analytics = data || null;
			// Update charts after analytics loaded
			setTimeout(() => {
				updateCharts();
			}, 100);
		}

		loadingAnalytics = false;
	}

	async function loadTrends() {
		if (!project) return;

		const { data, error: err } = await api.getScoreTrends(
			projectId,
			selectedFormId || undefined,
			trendGroupBy
		);

		if (err) {
			console.error('Error loading trends:', err);
		} else {
			trends = data || null;
			setTimeout(() => {
				updateTrendChart();
			}, 100);
		}
	}

	function updateCharts() {
		if (!analytics) return;

		// Update gauge chart
		if (gaugeCanvas && analytics.overallAverage != null) {
			if (gaugeChart) gaugeChart.destroy();

			const score = analytics.overallAverage;
			gaugeChart = new Chart(gaugeCanvas, {
				type: 'doughnut',
				data: {
					datasets: [{
						data: [score, 100 - score],
						backgroundColor: [
							score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444',
							'#e2e8f0'
						],
						borderWidth: 0
					}]
				},
				options: {
					circumference: 180,
					rotation: -90,
					cutout: '75%',
					plugins: {
						legend: { display: false },
						tooltip: { enabled: false }
					}
				}
			});
		}

		// Update bar chart
		if (barCanvas && Object.keys(analytics.pillarAverages).length > 0) {
			if (barChart) barChart.destroy();

			const labels = Object.keys(analytics.pillarAverages);
			const data = Object.values(analytics.pillarAverages);

			barChart = new Chart(barCanvas, {
				type: 'bar',
				data: {
					labels,
					datasets: [{
						label: 'Pillar Score',
						data,
						backgroundColor: data.map((score: number) =>
							score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
						),
						borderRadius: 8
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						y: {
							beginAtZero: true,
							max: 100,
							ticks: {
								callback: (value) => value + '%'
							}
						}
					},
					plugins: {
						legend: { display: false },
						tooltip: {
							callbacks: {
								label: (context) => `Score: ${context.parsed.y != null ? context.parsed.y.toFixed(1) : 'N/A'}`
							}
						}
					}
				}
			});
		}
	}

	function updateTrendChart() {
		if (!trends || !trendCanvas || trends.trends.length === 0) return;

		if (trendChart) trendChart.destroy();

		const labels = trends.trends.map(t => t.period);
		const data = trends.trends.map(t => t.averageScore);

		trendChart = new Chart(trendCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [{
					label: 'Average Score',
					data,
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)',
					fill: true,
					tension: 0.4,
					pointRadius: 4,
					pointHoverRadius: 6
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						max: 100,
						ticks: {
							callback: (value) => value + '%'
						}
					}
				},
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: (context) => `Score: ${context.parsed.y != null ? context.parsed.y.toFixed(1) : 'N/A'}%`
						}
					}
				}
			}
		});
	}

	function resetFilters() {
		selectedFormId = null;
		clusterField = '';
		clusterValue = '';
		vendorField = '';
		vendorValue = '';
		agentId = null;
		startDate = '';
		endDate = '';
		groupBy = '';
		loadAnalytics();
		loadTrends();
	}

	function getHealthStatus(score: number | null): string {
		if (score == null) return 'No Data';
		if (score >= 80) return 'Healthy';
		if (score >= 60) return 'At Risk';
		return 'Critical';
	}

	function getHealthColor(score: number | null): string {
		if (score == null) return 'text-slate-500';
		if (score >= 80) return 'text-green-600';
		if (score >= 60) return 'text-yellow-600';
		return 'text-red-600';
	}

	function exportToCSV() {
		if (!analytics) return;

		// Build CSV content
		let csv = 'Metric,Value\n';
		csv += `Overall Average Score,${analytics.overallAverage?.toFixed(2) || 'N/A'}\n`;
		csv += `Total Submissions,${analytics.submissionCount}\n`;
		csv += `Healthy Count,${analytics.distribution.healthy}\n`;
		csv += `At Risk Count,${analytics.distribution.atRisk}\n`;
		csv += `Critical Count,${analytics.distribution.critical}\n\n`;

		// Add pillar scores
		csv += 'Pillar,Score\n';
		Object.entries(analytics.pillarAverages).forEach(([pillar, score]) => {
			csv += `${pillar},${score.toFixed(2)}\n`;
		});

		// Add grouped data if available
		if (analytics.groupedData && analytics.groupedData.length > 0) {
			csv += `\n${analytics.groupedData[0].groupName},Average Score,Count\n`;
			analytics.groupedData.forEach((group) => {
				csv += `${group.groupValue},${group.averageScore.toFixed(2)},${group.count}\n`;
			});
		}

		// Download CSV
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `score-analytics-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-slate-900">Score Analytics</h1>
			<p class="text-slate-600 mt-2">
				{project?.name || 'Loading...'}
			</p>
		</div>
		{#if analytics}
			<Button onclick={exportToCSV} variant="outline" class="gap-2">
				{@html icons.Download(16)}
				<span>Export CSV</span>
			</Button>
		{/if}
	</div>

	<!-- Filter Panel -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
				{@html icons.Filter(20)}
				<span>Filters</span>
			</h2>
			<Button onclick={resetFilters} variant="outline" size="sm">
				Reset All
			</Button>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<!-- Form Filter -->
			<div>
				<Label for="form">Form</Label>
				<select
					id="form"
					value={selectedFormId?.toString() || ''}
					onchange={(e: Event) => {
						const val = (e.target as HTMLSelectElement).value;
						selectedFormId = val ? Number(val) : null;
						loadAnalytics();
					}}
					class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="">All Forms</option>
					{#each forms as form}
						<option value={form.id}>{form.name}</option>
					{/each}
				</select>
			</div>

			<!-- Cluster Field -->
			<div>
				<Label for="clusterField">Cluster Field ID</Label>
				<Input
					id="clusterField"
					bind:value={clusterField}
					placeholder="e.g., cluster"
				/>
			</div>

			<!-- Cluster Value -->
			<div>
				<Label for="clusterValue">Cluster Value</Label>
				<Input
					id="clusterValue"
					bind:value={clusterValue}
					placeholder="e.g., Accra Region"
					disabled={!clusterField}
				/>
			</div>

			<!-- Vendor Field -->
			<div>
				<Label for="vendorField">Vendor Field ID</Label>
				<Input
					id="vendorField"
					bind:value={vendorField}
					placeholder="e.g., vendor"
				/>
			</div>

			<!-- Vendor Value -->
			<div>
				<Label for="vendorValue">Vendor Value</Label>
				<Input
					id="vendorValue"
					bind:value={vendorValue}
					placeholder="e.g., Vendor ABC"
					disabled={!vendorField}
				/>
			</div>

			<!-- Date Range -->
			<div>
				<Label for="startDate">Start Date</Label>
				<input
					id="startDate"
					type="date"
					bind:value={startDate}
					class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<div>
				<Label for="endDate">End Date</Label>
				<input
					id="endDate"
					type="date"
					bind:value={endDate}
					class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<!-- Group By -->
			<div>
				<Label for="groupBy">Group By</Label>
				<select
					id="groupBy"
					value={groupBy}
					onchange={(e: Event) => {
						groupBy = (e.target as HTMLSelectElement).value;
					}}
					class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="">None</option>
					<option value="cluster">Cluster</option>
					<option value="vendor">Vendor</option>
					<option value="agent">Agent</option>
				</select>
			</div>

			<div class="flex items-end">
				<Button onclick={loadAnalytics} class="w-full" loading={loadingAnalytics}>
					Apply Filters
				</Button>
			</div>
		</div>
	</Card>

	{#if error}
		<!-- Error State -->
		<Card class="p-12">
			<div class="text-center">
				<div class="flex justify-center mb-4 text-red-300">
					{@html icons.AlertCircle(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">Error Loading Analytics</h3>
				<p class="text-slate-600 mb-6">{error}</p>
				<Button onclick={() => { error = null; loadAnalytics(); loadTrends(); }}>
					Try Again
				</Button>
			</div>
		</Card>
	{:else if loading}
		<!-- Loading State -->
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Skeleton class="h-64" />
				<Skeleton class="h-64" />
				<Skeleton class="h-64" />
			</div>
			<Skeleton class="h-96" />
			<Skeleton class="h-64" />
		</div>
	{:else if analytics}
		<!-- Analytics Dashboard -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Overall Health Score Gauge -->
			<Card class="p-6">
				<h3 class="text-sm font-medium text-slate-600 mb-4">Overall Health Score</h3>
				<div class="relative">
					<canvas bind:this={gaugeCanvas} class="max-h-48"></canvas>
					{#if analytics.overallAverage != null}
						<div class="absolute inset-0 flex flex-col items-center justify-center" style="top: 40%;">
							<div class="text-4xl font-bold {getHealthColor(analytics.overallAverage)}">
								{analytics.overallAverage.toFixed(1)}
							</div>
							<div class="text-sm {getHealthColor(analytics.overallAverage)} font-medium mt-1">
								{getHealthStatus(analytics.overallAverage)}
							</div>
						</div>
					{/if}
				</div>
				<div class="mt-4 text-center text-sm text-slate-600">
					{analytics.submissionCount} submission{analytics.submissionCount !== 1 ? 's' : ''}
				</div>
			</Card>

			<!-- Score Distribution -->
			<Card class="p-6">
				<h3 class="text-sm font-medium text-slate-600 mb-4">Score Distribution</h3>
				<div class="space-y-3">
					<div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-green-500 rounded-full"></div>
							<span class="text-sm font-medium text-green-700">Healthy (80-100)</span>
						</div>
						<span class="text-lg font-bold text-green-700">{analytics.distribution.healthy}</span>
					</div>
					<div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
							<span class="text-sm font-medium text-yellow-700">At Risk (60-79)</span>
						</div>
						<span class="text-lg font-bold text-yellow-700">{analytics.distribution.atRisk}</span>
					</div>
					<div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-red-500 rounded-full"></div>
							<span class="text-sm font-medium text-red-700">Critical (0-59)</span>
						</div>
						<span class="text-lg font-bold text-red-700">{analytics.distribution.critical}</span>
					</div>
				</div>
			</Card>

			<!-- Quick Stats -->
			<Card class="p-6">
				<h3 class="text-sm font-medium text-slate-600 mb-4">Quick Stats</h3>
				<div class="space-y-4">
					<div>
						<div class="text-xs text-slate-500 mb-1">Total Submissions</div>
						<div class="text-2xl font-bold text-slate-900">{analytics.submissionCount}</div>
					</div>
					<div>
						<div class="text-xs text-slate-500 mb-1">Pillars Analyzed</div>
						<div class="text-2xl font-bold text-slate-900">
							{Object.keys(analytics.pillarAverages).length}
						</div>
					</div>
					{#if analytics.overallAverage}
						<div>
							<div class="text-xs text-slate-500 mb-1">Avg Score</div>
							<div class="text-2xl font-bold {getHealthColor(analytics.overallAverage)}">
								{analytics.overallAverage.toFixed(1)}%
							</div>
						</div>
					{/if}
				</div>
			</Card>
		</div>

		<!-- Pillar Performance Bar Chart -->
		<Card class="p-6">
			<h3 class="text-lg font-semibold text-slate-900 mb-4">Pillar Performance</h3>
			<div class="h-80">
				<canvas bind:this={barCanvas}></canvas>
			</div>
		</Card>

		<!-- Trend Chart -->
		{#if trends && trends.trends.length > 0}
			<Card class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-slate-900">Score Trends Over Time</h3>
					<select
						value={trendGroupBy}
						onchange={(e: Event) => {
							trendGroupBy = (e.target as HTMLSelectElement).value;
							loadTrends();
						}}
						class="w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="day">Daily</option>
						<option value="week">Weekly</option>
						<option value="month">Monthly</option>
						<option value="quarter">Quarterly</option>
					</select>
				</div>
				<div class="h-64">
					<canvas bind:this={trendCanvas}></canvas>
				</div>
			</Card>
		{/if}

		<!-- Grouped Data (if groupBy is set) -->
		{#if analytics.groupedData && analytics.groupedData.length > 0}
			<Card class="p-6">
				<h3 class="text-lg font-semibold text-slate-900 mb-4">
					Grouped Results: {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
				</h3>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-slate-50 border-b border-slate-200">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
									{analytics.groupedData[0]?.groupName || 'Group'}
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
									Avg Score
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
									Count
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
									Status
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-200">
							{#each analytics.groupedData as group}
								<tr class="hover:bg-slate-50">
									<td class="px-4 py-3 text-sm text-slate-900">{group.groupValue}</td>
									<td class="px-4 py-3">
										<span class="text-sm font-semibold {getHealthColor(group.averageScore)}">
											{group.averageScore.toFixed(1)}
										</span>
									</td>
									<td class="px-4 py-3 text-sm text-slate-600">{group.count}</td>
									<td class="px-4 py-3">
										<span class="text-xs px-2 py-1 rounded-full {group.averageScore >= 80 ? 'bg-green-100 text-green-700' : group.averageScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">
											{getHealthStatus(group.averageScore)}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card>
		{/if}
	{:else}
		<Card class="p-12">
			<div class="text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.BarChart(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No Data Available</h3>
				<p class="text-slate-600">
					No scored submissions found. Make sure your forms have scoring enabled and submissions exist.
				</p>
			</div>
		</Card>
	{/if}
</div>
