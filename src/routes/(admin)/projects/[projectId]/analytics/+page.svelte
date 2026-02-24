<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import type { ScoreAnalytics, ScoreTrends } from '$lib/types/analytics';
	import type { FormField } from '$lib/types/forms';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { Chart } from 'chart.js/auto';

	const projectId = Number($page.params.projectId);
	const formIdFromUrl = Number($page.url.searchParams.get('formId'));

	// ─── Data state ───────────────────────────────────────────────────────────
	let project = $state<any | null>(null);
	let form = $state<any | null>(null);       // The specific form being analysed
	let schemaFields = $state<FormField[]>([]); // Parsed non-pageBreak fields
	let analytics = $state<ScoreAnalytics | null>(null);
	let trends = $state<ScoreTrends | null>(null);
	let loading = $state(true);
	let loadingAnalytics = $state(false);
	let error = $state<string | null>(null);

	// ─── Pillar name map (pageBreak id → label) ───────────────────────────────
	// pillarAverages keys are pageBreak field IDs; this maps them to human labels.
	let pillarNameMap = $state<Record<string, string>>({});

	// ─── Dynamic field filter list (max 2, maps to API cluster/vendor pairs) ──
	interface FieldFilter {
		uid: string;  // local unique id
		fieldId: string;
		value: string;
	}
	let fieldFilters = $state<FieldFilter[]>([]);

	// IDs already selected in filters (prevent duplicate field picks)
	const usedFieldIds = $derived(fieldFilters.map((f) => f.fieldId).filter(Boolean));
	// Add button enabled as long as unused filterable fields remain AND budget < 2
	const canAddFilter = $derived(
		fieldFilters.length < 2 &&
		schemaFields.filter((f) => !usedFieldIds.includes(f.id)).length > 0
	);

	// ─── Other filter state ───────────────────────────────────────────────────
	let startDate = $state('');
	let endDate = $state('');
	let groupBy = $state('');
	let filtersOpen = $state(true);

	// True when any filter is actively applied
	const hasActiveFilters = $derived(
		fieldFilters.some((f) => f.fieldId && f.value) ||
		!!startDate || !!endDate || !!groupBy
	);

	// Group-by options derived from form fields (+ "agent" which backend handles specially)
	const groupByOptions = $derived([
		{ value: 'agent', label: 'Agent' },
		...schemaFields
			.filter((f) => f.type === 'radio' || f.type === 'checkbox' || f.type === 'checkbox' || f.type === 'text')
			.slice(0, 6)
			.map((f) => ({ value: f.id, label: f.label }))
	]);

	// ─── Chart refs ───────────────────────────────────────────────────────────
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
		const { data: projectData } = await api.getProject(projectId);
		project = projectData;

		const { data: formsData } = await api.getProjectForms(projectId);
		const allForms = formsData || [];

		// Find the specific form from the URL param
		form = allForms.find((f: any) => f.id === formIdFromUrl) ?? null;

		if (form) {
			try {
				const rawSchema = typeof form.schema === 'string'
					? JSON.parse(form.schema)
					: form.schema;

				const allFields: FormField[] = rawSchema?.fields ?? [];

				// Filterable fields = non-pageBreak fields
				schemaFields = allFields.filter((f) => f.type !== 'pageBreak');

				// Build pillar name map from pageBreak fields
				const nameMap: Record<string, string> = {};
				for (const f of allFields) {
					if (f.type === 'pageBreak') {
						nameMap[f.id] = f.label || f.id;
					}
				}
				pillarNameMap = nameMap;
			} catch {
				schemaFields = [];
				pillarNameMap = {};
			}
		}

		loading = false;
	}

	// ─── Build API filter object from UI state ────────────────────────────────
	function buildFilters() {
		const filters: Record<string, any> = { formId: formIdFromUrl };

		// Map first filter → clusterField/clusterValue
		if (fieldFilters[0]?.fieldId && fieldFilters[0]?.value) {
			filters.clusterField = fieldFilters[0].fieldId;
			filters.clusterValue = fieldFilters[0].value;
		}
		// Map second filter → vendorField/vendorValue
		if (fieldFilters[1]?.fieldId && fieldFilters[1]?.value) {
			filters.vendorField = fieldFilters[1].fieldId;
			filters.vendorValue = fieldFilters[1].value;
		}

		if (startDate) filters.startDate = startDate;
		if (endDate) filters.endDate = endDate;
		if (groupBy) filters.groupBy = groupBy;

		return filters;
	}

	async function loadAnalytics() {
		if (loading) return; // wait for init

		loadingAnalytics = true;
		error = null;

		const { data, error: err } = await api.getScoreAnalytics(projectId, buildFilters());
		if (err) {
			error = err;
		} else {
			analytics = data ?? null;
			setTimeout(updateCharts, 100);
		}

		loadingAnalytics = false;
	}

	async function loadTrends() {
		if (loading) return;

		const { data } = await api.getScoreTrends(
			projectId,
			formIdFromUrl,
			trendGroupBy
		);

		trends = data ?? null;
		setTimeout(updateTrendChart, 100);
	}

	// ─── Filter helpers ───────────────────────────────────────────────────────
	function addFilter() {
		fieldFilters = [
			...fieldFilters,
			{ uid: crypto.randomUUID(), fieldId: '', value: '' }
		];
	}

	function removeFilter(uid: string) {
		fieldFilters = fieldFilters.filter((f) => f.uid !== uid);
	}

	function updateFilterField(uid: string, fieldId: string) {
		fieldFilters = fieldFilters.map((f) =>
			f.uid === uid ? { ...f, fieldId, value: '' } : f
		);
	}

	function updateFilterValue(uid: string, value: string) {
		fieldFilters = fieldFilters.map((f) =>
			f.uid === uid ? { ...f, value } : f
		);
	}

	/** Options for a given field's value picker (when field is radio/checkbox). */
	function getFieldOptions(fieldId: string) {
		const field = schemaFields.find((f) => f.id === fieldId);
		return field?.options ?? null; // null means free-text
	}

	function updateCharts() {
		if (!analytics) return;
		buildGaugeChart();
		buildBarChart();
	}

	function buildGaugeChart() {
		if (!gaugeCanvas || analytics?.overallAverage == null) return;
		gaugeChart?.destroy();
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
				plugins: { legend: { display: false }, tooltip: { enabled: false } }
			}
		});
	}

	function buildBarChart() {
		if (!barCanvas || !analytics || Object.keys(analytics.pillarAverages).length === 0) return;
		barChart?.destroy();

		// Resolve human-readable pillar names via pillarNameMap
		const labels = Object.keys(analytics.pillarAverages).map(
			(id) => pillarNameMap[id] || id
		);
		const data = Object.values(analytics.pillarAverages) as number[];

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
							label: (context) =>
								`Score: ${context.parsed.y != null ? context.parsed.y.toFixed(1) : 'N/A'}%`
						}
					}
				}
			}
		});
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
		fieldFilters = [];
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

		let csv = 'Metric,Value\n';
		csv += `Form,${form?.name ?? 'N/A'}\n`;
		csv += `Overall Average Score,${analytics.overallAverage?.toFixed(2) ?? 'N/A'}\n`;
		csv += `Total Submissions,${analytics.submissionCount}\n`;
		csv += `Healthy Count,${analytics.distribution.healthy}\n`;
		csv += `At Risk Count,${analytics.distribution.atRisk}\n`;
		csv += `Critical Count,${analytics.distribution.critical}\n\n`;

		// Pillar scores with human-readable names
		csv += 'Pillar,Score\n';
		Object.entries(analytics.pillarAverages).forEach(([id, score]) => {
			csv += `${pillarNameMap[id] || id},${score.toFixed(2)}\n`;
		});

		if (analytics.groupedData && analytics.groupedData.length > 0) {
			csv += `\n${analytics.groupedData[0].groupName},Average Score,Count\n`;
			analytics.groupedData.forEach((group) => {
				csv += `${group.groupValue},${group.averageScore.toFixed(2)},${group.count}\n`;
			});
		}

		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `score-analytics-${form?.name ?? projectId}-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="space-y-6">
	<!-- ─── Page Header ─────────────────────────────────────────────────────── -->
	<div class="flex items-start justify-between">
		<div>
			<button
				onclick={() => goto(`/projects/${projectId}/forms`)}
				class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-3"
			>
				{@html icons.ArrowLeft(14)}
				Back to forms
			</button>

			<h1 class="text-3xl font-bold text-slate-900">Score Analytics</h1>

			{#if project}
				<p class="text-slate-600 mt-1">{project.name}</p>
			{/if}
		</div>

		{#if analytics}
			<Button onclick={exportToCSV} variant="outline" class="gap-2 shrink-0">
				{@html icons.Download(16)}
				<span>Export CSV</span>
			</Button>
		{/if}
	</div>

	<!-- ─── Filter Panel ────────────────────────────────────────────────────── -->
	<Card class="{filtersOpen ? 'p-6' : 'px-6 py-4'} transition-all">
		<div class="flex items-center justify-between {filtersOpen ? 'mb-5' : ''}">
			<h2 class="text-base font-semibold text-slate-900 flex items-center gap-2">
				{@html icons.Filter(18)}
				<span>Filters</span>
				{#if hasActiveFilters}
					<span class="text-xs font-normal text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
						Active
					</span>
				{/if}
			</h2>
			<div class="flex items-center gap-2">
				{#if filtersOpen && hasActiveFilters}
					<Button onclick={resetFilters} variant="outline" size="sm">Reset All</Button>
				{/if}
				<button
					onclick={() => (filtersOpen = !filtersOpen)}
					class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
					title={filtersOpen ? 'Collapse filters' : 'Expand filters'}
				>
					<span class="block transition-transform duration-200 {filtersOpen ? '' : '-rotate-90'}">
						{@html icons.ChevronDown(16)}
					</span>
				</button>
			</div>
		</div>

		{#if filtersOpen}
		<div class="space-y-4">
			<!-- What do filters do? -->
			<p class="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed">
				Filters narrow the pool of <strong>scored submissions</strong> used to compute all metrics below — overall average, pillar scores, distribution, grouped data, and trends. For example, filtering by
				<em>Region = "North"</em> shows analytics only for submissions where agents selected "North" for that question.
			</p>

			<!-- Form name (read-only) -->
			<div>
				<Label>Form</Label>
				<div class="mt-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900">
					{#if loading}
						<div class="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
					{:else}
						{@html icons.FileText(16)}
						<span class="font-medium">{form?.name ?? 'Unknown form'}</span>
						<!-- <Badge variant="default" class="ml-auto text-xs">ID {formIdFromUrl}</Badge> -->
					{/if}
				</div>
			</div>

			<!-- Dynamic field filters -->
			{#if schemaFields.length > 0}
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<Label>Field Filters</Label>
						<button
							onclick={addFilter}
							disabled={!canAddFilter}
							class="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						>
							{@html icons.Plus(14)}
							Add Filter
						</button>
					</div>

					{#if fieldFilters.length === 0}
						<p class="text-xs text-slate-400 italic">
							No field filters applied — click "Add Filter" to narrow results by a specific field value.
						</p>
					{/if}

					{#each fieldFilters as filter (filter.uid)}
						{@const fieldOpts = getFieldOptions(filter.fieldId)}
						<div class="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
							<!-- Field picker -->
							<div class="flex-1 min-w-0">
								<label for="filter-field-{filter.uid}" class="block text-xs text-slate-500 mb-1">Field</label>
								<select
									id="filter-field-{filter.uid}"
									value={filter.fieldId}
									onchange={(e) => updateFilterField(filter.uid, (e.target as HTMLSelectElement).value)}
									class="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">Select a field…</option>
									{#each schemaFields as field}
										<option
											value={field.id}
											disabled={usedFieldIds.includes(field.id) && filter.fieldId !== field.id}
										>
											{field.label}
										</option>
									{/each}
								</select>
							</div>

							<!-- Value picker -->
							<div class="flex-1 min-w-0">
								<label for="filter-value-{filter.uid}" class="block text-xs text-slate-500 mb-1">Value</label>
								{#if filter.fieldId === ''}
									<input
										id="filter-value-{filter.uid}"
										type="text"
										disabled
										placeholder="Select a field first"
										class="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md bg-slate-100 text-slate-400 cursor-not-allowed"
									/>
								{:else if fieldOpts}
									<select
										id="filter-value-{filter.uid}"
										value={filter.value}
										onchange={(e) => updateFilterValue(filter.uid, (e.target as HTMLSelectElement).value)}
										class="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="">Any value</option>
										{#each fieldOpts as opt}
											<option value={opt.value}>{opt.label}</option>
										{/each}
									</select>
								{:else}
									<input
										id="filter-value-{filter.uid}"
										type="text"
										value={filter.value}
										oninput={(e) => updateFilterValue(filter.uid, (e.target as HTMLInputElement).value)}
										placeholder="Filter value…"
										class="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								{/if}
							</div>

							<!-- Remove -->
							<button
								onclick={() => removeFilter(filter.uid)}
								class="mt-5 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
								title="Remove filter"
							>
								{@html icons.X(16)}
							</button>
						</div>
					{/each}

					{#if fieldFilters.length >= 2}
						<p class="text-xs text-slate-400">
							Maximum 2 field filters applied. Remove one to add a different field.
						</p>
					{/if}
				</div>
			{/if}

			<!-- Date range + Group by -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
				<div>
					<Label for="startDate">Start Date</Label>
					<input
						id="startDate"
						type="date"
						bind:value={startDate}
						class="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<Label for="endDate">End Date</Label>
					<input
						id="endDate"
						type="date"
						bind:value={endDate}
						class="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<Label for="groupBy">Group By</Label>
					<select
						id="groupBy"
						value={groupBy}
						onchange={(e) => (groupBy = (e.target as HTMLSelectElement).value)}
						class="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
					>
						<option value="">None</option>
						{#each groupByOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="pt-1">
				<Button onclick={loadAnalytics} class="gap-2" loading={loadingAnalytics}>
					{@html icons.Search(16)}
					Apply Filters
				</Button>
			</div>
		</div>
		{/if}
	</Card>

	{#if error}
		<Card class="p-12">
			<div class="text-center">
				<div class="flex justify-center mb-4 text-red-300">{@html icons.AlertCircle(64)}</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">Error Loading Analytics</h3>
				<p class="text-slate-600 mb-6">{error}</p>
				<Button onclick={() => { error = null; loadAnalytics(); loadTrends(); }}>Try Again</Button>
			</div>
		</Card>
	{:else if loading}
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
		<!-- ── KPI row ─────────────────────────────────────────────────────── -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

			<Card class="p-6">
				<h3 class="text-sm font-medium text-slate-600 mb-4">Score Distribution</h3>
				<div class="space-y-3">
					<div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-green-500 rounded-full"></div>
							<span class="text-sm font-medium text-green-700">Healthy (80–100)</span>
						</div>
						<span class="text-lg font-bold text-green-700">{analytics.distribution.healthy}</span>
					</div>
					<div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
							<span class="text-sm font-medium text-yellow-700">At Risk (60–79)</span>
						</div>
						<span class="text-lg font-bold text-yellow-700">{analytics.distribution.atRisk}</span>
					</div>
					<div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-red-500 rounded-full"></div>
							<span class="text-sm font-medium text-red-700">Critical (0–59)</span>
						</div>
						<span class="text-lg font-bold text-red-700">{analytics.distribution.critical}</span>
					</div>
				</div>
			</Card>

			<Card class="p-6">
				<h3 class="text-sm font-medium text-slate-600 mb-4">Quick Stats</h3>
				<div class="space-y-4">
					<div>
						<div class="text-xs text-slate-500 mb-1">Total Submissions</div>
						<div class="text-2xl font-bold text-slate-900">{analytics.submissionCount}</div>
					</div>
					<div>
						<div class="text-xs text-slate-500 mb-1">Pillars Analysed</div>
						<div class="text-2xl font-bold text-slate-900">
							{Object.keys(analytics.pillarAverages).length}
						</div>
					</div>
					{#if analytics.overallAverage != null}
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

		<!-- ── Pillar Performance ──────────────────────────────────────────── -->
		{#if Object.keys(analytics.pillarAverages).length > 0}
			<Card class="p-6">
				<h3 class="text-lg font-semibold text-slate-900 mb-4">Pillar Performance</h3>
				<div class="h-80">
					<canvas bind:this={barCanvas}></canvas>
				</div>
			</Card>
		{/if}

		<!-- ── Score Trends ───────────────────────────────────────────────── -->
		{#if trends && trends.trends.length > 0}
			<Card class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-slate-900">Score Trends Over Time</h3>
					<select
						value={trendGroupBy}
						onchange={(e) => {
							trendGroupBy = (e.target as HTMLSelectElement).value;
							loadTrends();
						}}
						class="w-36 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

		<!-- ── Grouped Data ───────────────────────────────────────────────── -->
		{#if analytics.groupedData && analytics.groupedData.length > 0}
			<Card class="p-6">
				<h3 class="text-lg font-semibold text-slate-900 mb-4">
					Grouped by: {groupByOptions.find((o) => o.value === groupBy)?.label ?? groupBy}
				</h3>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-slate-50 border-b border-slate-200">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
									{analytics.groupedData[0]?.groupName ?? 'Group'}
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Avg Score</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Count</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
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
				<div class="flex justify-center mb-4 text-slate-300">{@html icons.BarChart(64)}</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No Data Available</h3>
				<p class="text-slate-600">
					No scored submissions found for this form. Make sure scoring is enabled and submissions exist.
				</p>
			</div>
		</Card>
	{/if}
</div>
