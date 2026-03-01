<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Textarea from '$lib/components/ui/textarea.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import Breadcrumbs from '$lib/components/ui/breadcrumbs.svelte';
	import ChartTypeSelector from '$lib/components/views/ChartTypeSelector.svelte';
	import FieldSelector from '$lib/components/views/FieldSelector.svelte';
	import AggregationSelector from '$lib/components/views/AggregationSelector.svelte';
	import ColorCustomizer from '$lib/components/views/ColorCustomizer.svelte';
	import ChartPreview from '$lib/components/views/ChartPreview.svelte';
	import {
		aggregateSubmissionData,
		getAllProjectFields,
		getNumericFields,
		getCategoricalFields,
		getAllAxisFields
	} from '$lib/utils/data-aggregation';
	import { generateSimulatedChartData } from '$lib/utils/chart-simulation';
	import { icons } from '$lib/components/icons.svelte';
	import type {
		ChartType,
		AggregationType,
		ViewConfig,
		ViewDefinition,
		FormField,
		ChartData
	} from '$lib/types/views';

	// Get IDs from URL
	const projectId = $derived(Number($page.params.projectId));
	const viewId = $derived($page.params.viewId);
	const isNewView = $derived(viewId === 'new');

	// State - Basic info
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let viewName = $state('Untitled View');
	let viewDescription = $state('');
	let projectName = $state('Project');

	// State - Configuration
	let chartType = $state<ChartType>('bar');
	let selectedFormId = $state<string>('');
	let selectedField = $state<string>('');
	let selectedGroupBy = $state<string>('');
	let selectedXAxis = $state<string>('');
	let selectedYAxis = $state<string>('');
	let aggregationType = $state<AggregationType>('count');
	let customColors = $state<string[]>([]);

	// Additional fields for advanced chart types
	let selectedSizeField = $state<string>(''); // Bubble chart
	let selectedCategoryField = $state<string>(''); // Tree map, Funnel
	let selectedValueField = $state<string>(''); // Heatmap, Tree map
	let selectedLocationField = $state<string>(''); // Choropleth
	let bucketSize = $state<number>(10); // Histogram
	let gaugeMin = $state<number>(0); // Gauge
	let gaugeMax = $state<number>(100); // Gauge

	// State - Stepper
	let currentStep = $state(1);

	// State - Data
	let forms = $state<any[]>([]);
	let submissions = $state<any[]>([]);
	let allFields = $state<FormField[]>([]);
	let chartData = $state<ChartData>({ labels: [], datasets: [] });

	// Derived - step count by chart type
	const totalSteps = $derived.by(() => {
		// Charts with configuration included in step 2 (2 steps total)
		const twoStepCharts = ['scatter', 'bubble', 'number', 'gauge', 'histogram', 'boxPlot', 'choropleth'];
		if (twoStepCharts.includes(chartType)) return 2;
		// All other charts have aggregation/colors in step 3
		return 3;
	});

	const stepLabels = $derived.by(() => {
		// Two-step charts
		if (chartType === 'scatter' || chartType === 'bubble') return ['Chart Type', 'Data Fields'];
		if (chartType === 'number' || chartType === 'gauge') return ['Chart Type', 'Configuration'];
		if (chartType === 'histogram' || chartType === 'boxPlot') return ['Chart Type', 'Distribution'];
		if (chartType === 'choropleth') return ['Chart Type', 'Map Configuration'];

		// Three-step charts with custom step 3
		if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar')
			return ['Chart Type', 'Data Fields', 'Aggregation & Colors'];
		if (chartType === 'heatmap')
			return ['Chart Type', 'Data Fields', 'Aggregation & Colors'];

		// Default three-step charts
		return ['Chart Type', 'Data Fields', 'Aggregation'];
	});

	// Derived - View configuration
	const viewConfig = $derived<ViewConfig>({
		formId: Number(selectedFormId),
		aggregation: aggregationType,
		field: selectedField || undefined,
		groupBy: selectedGroupBy || undefined,
		xAxis: selectedXAxis || undefined,
		yAxis: selectedYAxis || undefined,
		scatter: chartType === 'scatter' ? true : undefined,
		colors: customColors.length > 0 ? customColors : undefined,
		// Advanced fields
		sizeField: selectedSizeField || undefined,
		categoryField: selectedCategoryField || undefined,
		valueField: selectedValueField || undefined,
		locationField: selectedLocationField || undefined,
		bucketSize: chartType === 'histogram' ? bucketSize : undefined,
		min: chartType === 'gauge' ? gaugeMin : undefined,
		max: chartType === 'gauge' ? gaugeMax : undefined
	});

	// Derived - Filtered fields based on selected form
	const formFields = $derived(
		allFields.filter((f) => !selectedFormId || f.formId === Number(selectedFormId))
	);

	// Derived - Field type filters for chart compatibility
	const numericFields = $derived(getNumericFields(formFields));
	const categoricalFields = $derived(
		getCategoricalFields(formFields).filter((f) => f.type !== 'select')
	); // Exclude 'select' type as per user request
	const allAxisFields = $derived(
		getAllAxisFields(formFields).filter((f) => f.type !== 'select')
	); // Exclude 'select' type

	// Derived - Check if required fields are selected for current chart type
	const hasRequiredFields = $derived.by(() => {
		if (!selectedFormId) return false;

		// Charts using X/Y axes
		if (['bar', 'horizontalBar', 'line', 'area'].includes(chartType)) {
			return !!(selectedXAxis && selectedYAxis);
		}
		// Stacked charts need groupBy too
		if (['stackedBar', 'stackedArea', 'groupedBar'].includes(chartType)) {
			return !!(selectedXAxis && selectedYAxis && selectedGroupBy);
		}
		// Pie, doughnut, radar need category and value
		if (['pie', 'doughnut', 'radar'].includes(chartType)) {
			return !!(selectedGroupBy && selectedField);
		}
		// Scatter needs X and Y numeric fields
		if (chartType === 'scatter') {
			return !!(selectedXAxis && selectedYAxis);
		}
		// Bubble needs X, Y, and Size
		if (chartType === 'bubble') {
			return !!(selectedXAxis && selectedYAxis && selectedSizeField);
		}
		// Histogram needs a numeric field
		if (chartType === 'histogram') {
			return !!selectedField;
		}
		// Box plot needs field and optional groupBy
		if (chartType === 'boxPlot') {
			return !!selectedField;
		}
		// Heatmap needs X, Y, and value field
		if (chartType === 'heatmap') {
			return !!(selectedXAxis && selectedYAxis && selectedValueField);
		}
		// Tree map needs category and value
		if (chartType === 'treeMap') {
			return !!(selectedCategoryField && selectedValueField);
		}
		// Funnel needs category and value field
		if (chartType === 'funnel') {
			return !!(selectedCategoryField && selectedValueField);
		}
		// Waterfall needs X and Y axes
		if (chartType === 'waterfall') {
			return !!(selectedXAxis && selectedYAxis);
		}
		// Gauge needs a numeric field
		if (chartType === 'gauge') {
			return !!selectedField;
		}
		// Choropleth needs location and value
		if (chartType === 'choropleth') {
			return !!(selectedLocationField && selectedValueField);
		}
		// Number chart needs a field
		if (chartType === 'number') {
			return !!selectedField;
		}
		// Sankey needs source, target, and value
		if (chartType === 'sankey') {
			return !!(selectedXAxis && selectedYAxis && selectedValueField);
		}

		return false;
	});

	// Breadcrumbs
	const breadcrumbs = $derived([
		{ label: 'Projects', href: '/projects' },
		{ label: projectName, href: `/projects/${projectId}/forms` },
		{ label: 'Views', href: `/projects/${projectId}/views` },
		{ label: isNewView ? 'New View' : 'Edit View', href: '#' }
	]);

	onMount(() => {
		loadData();
	});

	// Real-time preview updates - only when required fields are selected
	// Always use mock data for preview to help users design their charts
	$effect(() => {
		// Only show preview if we have required fields selected
		if (hasRequiredFields) {
			// Always use simulated/mock data for preview
			chartData = generateSimulatedChartData(chartType, viewConfig);
		} else {
			// Reset to empty when fields not selected
			chartData = { labels: [], datasets: [] };
		}
	});

	// Reset field selections when chart type changes
	$effect(() => {
		// Reset all advanced fields first
		selectedSizeField = '';
		selectedCategoryField = '';
		selectedValueField = '';
		selectedLocationField = '';

		// Then reset based on chart type
		// Charts using X/Y axes
		if (chartType === 'bar' || chartType === 'horizontalBar' || chartType === 'line' || chartType === 'area') {
			selectedField = '';
			selectedGroupBy = '';
		}
		// Charts with grouping
		else if (chartType === 'groupedBar' || chartType === 'stackedBar' || chartType === 'stackedArea') {
			selectedField = '';
		}
		// Charts using categories
		else if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar') {
			selectedXAxis = '';
			selectedYAxis = '';
		}
		// Scatter-like charts
		else if (chartType === 'scatter') {
			selectedField = '';
			selectedGroupBy = '';
		} else if (chartType === 'bubble') {
			selectedField = '';
			selectedGroupBy = '';
		}
		// Distribution charts
		else if (chartType === 'histogram' || chartType === 'boxPlot') {
			selectedXAxis = '';
			selectedYAxis = '';
			selectedGroupBy = '';
		}
		// Heatmap
		else if (chartType === 'heatmap') {
			selectedField = '';
			selectedGroupBy = '';
		}
		// Tree map & Funnel
		else if (chartType === 'treeMap' || chartType === 'funnel') {
			selectedXAxis = '';
			selectedYAxis = '';
			selectedGroupBy = '';
		}
		// Waterfall
		else if (chartType === 'waterfall') {
			selectedField = '';
			selectedGroupBy = '';
		}
		// Sankey
		else if (chartType === 'sankey') {
			selectedField = '';
			selectedGroupBy = '';
		}
		// Gauge, Choropleth, Number
		else if (chartType === 'gauge' || chartType === 'choropleth' || chartType === 'number') {
			selectedXAxis = '';
			selectedYAxis = '';
			selectedGroupBy = '';
		}
	});

	async function loadData() {
		loading = true;
		error = null;

		try {
			// Load project name for breadcrumb
			const { data: projectsData } = await api.getProjects();
			const project = projectsData?.find((p: any) => p.id === projectId);
			if (project) projectName = project.name;

			// Load forms for this project
			const { data: formsData, error: formsError } = await api.getProjectForms(projectId);
			if (formsError) {
				error = formsError;
				loading = false;
				return;
			}
			forms = formsData || [];
			allFields = getAllProjectFields(forms);

			// Load submissions for data aggregation
			const { data: submissionsData, error: submissionsError } =
				await api.getProjectSubmissions(projectId);
			if (submissionsError) {
				error = submissionsError;
				loading = false;
				return;
			}
			submissions = submissionsData || [];

			// If editing existing view, load it
			if (!isNewView) {
				const { data: viewsData, error: viewsError } = await api.getProjectViews(projectId);
				if (viewsError) {
					error = viewsError;
					loading = false;
					return;
				}

				const view = viewsData?.find((v) => v.id === Number(viewId));
				if (view) {
					viewName = view.name;
					viewDescription = view.description || '';

					try {
						const definition: ViewDefinition = JSON.parse(view.definition);
						chartType = definition.chartType;
						selectedFormId = String(definition.config.formId);
						aggregationType = definition.config.aggregation;
						selectedField = definition.config.field || '';
						selectedGroupBy = definition.config.groupBy || '';
						selectedXAxis = definition.config.xAxis || '';
						selectedYAxis = definition.config.yAxis || '';
						customColors = definition.config.colors || [];

						// Load advanced fields
						selectedSizeField = definition.config.sizeField || '';
						selectedCategoryField = definition.config.categoryField || '';
						selectedValueField = definition.config.valueField || '';
						selectedLocationField = definition.config.locationField || '';
						bucketSize = definition.config.bucketSize || 10;
						gaugeMin = definition.config.min || 0;
						gaugeMax = definition.config.max || 100;
					} catch (e) {
						error = 'Failed to parse view definition';
					}
				} else {
					error = 'View not found';
				}
			} else {
				if (forms.length > 0) {
					selectedFormId = String(forms[0].id);
				}
			}
		} catch (e) {
			error = 'Failed to load data';
		}

		loading = false;
	}

	function validateStep(step: number): string | null {
		if (step === 1) {
			if (!viewName.trim()) return 'View name is required';
		}
		if (step === 2) {
			if (!selectedFormId) return 'Please select a form';

			// Bar & Column Charts
			if (chartType === 'bar' || chartType === 'horizontalBar' || chartType === 'line' || chartType === 'area') {
				if (!selectedXAxis) return 'X-axis field is required';
				if (!selectedYAxis) return 'Y-axis field is required';
			} else if (chartType === 'groupedBar' || chartType === 'stackedBar' || chartType === 'stackedArea') {
				if (!selectedXAxis) return 'X-axis field is required';
				if (!selectedYAxis) return 'Y-axis field is required';
				if (!selectedGroupBy) return 'Group by field is required';
			}
			// Pie & Donut
			else if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar') {
				if (!selectedGroupBy) return 'Category field is required';
				if (!selectedField) return 'Value field is required';
			}
			// Scatter & Bubble
			else if (chartType === 'scatter') {
				if (!selectedXAxis) return 'X-axis field is required';
				if (!selectedYAxis) return 'Y-axis field is required';
			} else if (chartType === 'bubble') {
				if (!selectedXAxis) return 'X-axis field is required';
				if (!selectedYAxis) return 'Y-axis field is required';
				if (!selectedSizeField) return 'Size field is required';
			}
			// Distribution & Statistical
			else if (chartType === 'histogram') {
				if (!selectedField) return 'Numeric field is required';
			} else if (chartType === 'boxPlot') {
				if (!selectedField) return 'Numeric field is required';
			}
			// Heatmap & Tree
			else if (chartType === 'heatmap') {
				if (!selectedXAxis) return 'X-axis field is required';
				if (!selectedYAxis) return 'Y-axis field is required';
				if (!selectedValueField) return 'Value field is required';
			} else if (chartType === 'treeMap') {
				if (!selectedCategoryField) return 'Category field is required';
				if (!selectedValueField) return 'Value field is required';
			}
			// Process & Flow
			else if (chartType === 'funnel') {
				if (!selectedCategoryField) return 'Stage field is required';
				if (!selectedValueField) return 'Value field is required';
			} else if (chartType === 'waterfall') {
				if (!selectedXAxis) return 'Category field is required';
				if (!selectedYAxis) return 'Value field is required';
			} else if (chartType === 'sankey') {
				if (!selectedXAxis) return 'Source field is required';
				if (!selectedYAxis) return 'Target field is required';
				if (!selectedValueField) return 'Value field is required';
			}
			// Specialized
			else if (chartType === 'gauge') {
				if (!selectedField) return 'Value field is required';
			} else if (chartType === 'choropleth') {
				if (!selectedLocationField) return 'Location field is required';
				if (!selectedValueField) return 'Value field is required';
			} else if (chartType === 'number') {
				if (!selectedField) return 'Field is required';
			}
		}
		return null;
	}

	function nextStep() {
		const err = validateStep(currentStep);
		if (err) {
			error = err;
			return;
		}
		error = null;
		currentStep = Math.min(currentStep + 1, totalSteps);
	}

	function prevStep() {
		error = null;
		currentStep = Math.max(currentStep - 1, 1);
	}

	async function saveView() {
		// Validate all steps
		for (let s = 1; s <= totalSteps; s++) {
			const err = validateStep(s);
			if (err) {
				error = err;
				currentStep = s;
				return;
			}
		}

		saving = true;
		error = null;

		const viewDefinition: ViewDefinition = {
			chartType,
			description: viewDescription,
			config: viewConfig
		};

		const payload = {
			projectId,
			name: viewName,
			description: viewDescription,
			definition: JSON.stringify(viewDefinition)
		};

		const result = isNewView
			? await api.createView(payload)
			: await api.updateView(Number(viewId), payload);

		if (result.error) {
			error = result.error;
			saving = false;
			return;
		}

		saving = false;
		goto(`/projects/${projectId}/views`);
	}
</script>

<div class="flex flex-col h-screen bg-slate-50">
	<!-- Toolbar -->
	<div class="border-b border-slate-200 bg-white shadow-sm">
		<div class="flex items-center justify-between px-6 py-4">
			<!-- Left: Breadcrumbs -->
			<Breadcrumbs items={breadcrumbs} />

			<!-- Right: Actions -->
			<div class="flex items-center gap-3">
				<Button variant="outline" size="sm" onclick={() => goto(`/projects/${projectId}/views`)}>
					Cancel
				</Button>
				<Button size="sm" onclick={saveView} loading={saving} disabled={loading}>
					{isNewView ? 'Create View' : 'Save Changes'}
				</Button>
			</div>
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
			<p class="text-red-600 text-sm">{error}</p>
		</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="flex-1 flex items-center justify-center">
			<div class="text-center">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
				<p class="text-slate-600 mt-4">Loading...</p>
			</div>
		</div>
	{:else}
		<!-- Main split layout -->
		<div class="flex-1 grid grid-cols-5 gap-6 p-6 min-h-0">

			<!-- Left: Preview (3 columns) -->
			<div class="col-span-3 min-h-0">
				<Card class="h-full flex flex-col">
					<div class="p-4 border-b border-slate-100 shrink-0">
						<h3 class="text-sm font-semibold text-slate-700">Preview</h3>
						<p class="text-xs text-slate-500 mt-1">Design your chart with mock data. Live data will be shown after saving.</p>
					</div>
					<div class="flex-1 min-h-0 p-1">
						<div class="h-full">
							<ChartPreview {chartType} {chartData} title={viewName} />
						</div>
					</div>
				</Card>
			</div>

			<!-- Right: Stepper (2 columns) -->
			<div class="col-span-2 min-h-0">
				<Card class="h-full flex flex-col">
					<!-- Step Indicator -->
					<div class="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
						<div class="flex items-center gap-2">
							{#each { length: totalSteps } as _, i}
								{@const stepNum = i + 1}
								<button
									type="button"
									class="flex items-center gap-1.5 text-xs font-medium transition-colors shrink-0"
									onclick={() => {
										if (stepNum < currentStep) {
											error = null;
											currentStep = stepNum;
										}
									}}
								>
									<span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors {stepNum === currentStep
										? 'bg-blue-600 text-white'
										: stepNum < currentStep
										? 'bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200'
										: 'bg-slate-200 text-slate-400'}">
										{#if stepNum < currentStep}
											{@html icons.Check(12)}
										{:else}
											{stepNum}
										{/if}
									</span>
									<span class="hidden sm:inline {stepNum === currentStep ? 'text-blue-700' : stepNum < currentStep ? 'text-blue-600' : 'text-slate-400'}">
										{stepLabels[i]}
									</span>
								</button>
								{#if stepNum < totalSteps}
									<div class="flex-1 h-px bg-slate-200 shrink-0"></div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Step Content (scrollable) -->
					<div class="flex-1 overflow-y-auto px-6 py-5 min-h-0">

						<!-- STEP 1: Chart Type + Name -->
						{#if currentStep === 1}
							<div class="space-y-5">
								<ChartTypeSelector bind:value={chartType} />

								<hr class="border-slate-200" />

								<div class="space-y-2">
									<Label for="viewName">
										View Name <span class="text-red-500">*</span>
									</Label>
									<Input
										id="viewName"
										type="text"
										bind:value={viewName}
										placeholder="e.g., Wildlife Sightings by Type"
									/>
								</div>

								<div class="space-y-2">
									<Label for="viewDescription">Description</Label>
									<Textarea
										id="viewDescription"
										bind:value={viewDescription}
										placeholder="Describe what this view shows..."
										rows={3}
									/>
								</div>
							</div>

						<!-- STEP 2: Form + Fields -->
						{:else if currentStep === 2}
							<div class="space-y-5">
								<!-- Data Source -->
								<div class="space-y-2">
									<Label>Data Source <span class="text-red-500">*</span></Label>
									<Select bind:value={selectedFormId}>
										<option value="">-- Select a form --</option>
										{#each forms as form}
											<option value={String(form.id)}>{form.name || form.title}</option>
										{/each}
									</Select>
								</div>

								{#if selectedFormId}
									<hr class="border-slate-200" />

									{#if chartType === 'bar' || chartType === 'horizontalBar' || chartType === 'line' || chartType === 'area'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedXAxis}
											label="X-Axis Field (categorical)"
											placeholder="Select category field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedYAxis}
											label="Y-Axis Field (numeric)"
											placeholder="Select numeric field"
											required={true}
										/>
									{:else if chartType === 'stackedBar' || chartType === 'stackedArea'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedXAxis}
											label="X-Axis Field (categorical)"
											placeholder="Select category field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedYAxis}
											label="Y-Axis Field (numeric)"
											placeholder="Select numeric field"
											required={true}
										/>
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedGroupBy}
											label="Group By Field (categorical)"
											placeholder="Select grouping field"
											required={true}
										/>
									{:else if chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedGroupBy}
											label="Category Field"
											placeholder="Select category field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedField}
											label="Value Field (numeric)"
											placeholder="Select numeric field"
											required={true}
										/>
									{:else if chartType === 'scatter'}
										<FieldSelector
											fields={numericFields}
											bind:value={selectedXAxis}
											label="X-Axis Field (numeric)"
											placeholder="Select X field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedYAxis}
											label="Y-Axis Field (numeric)"
											placeholder="Select Y field"
											required={true}
										/>
									{:else if chartType === 'bubble'}
										<FieldSelector
											fields={numericFields}
											bind:value={selectedXAxis}
											label="X-Axis Field (numeric)"
											placeholder="Select X field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedYAxis}
											label="Y-Axis Field (numeric)"
											placeholder="Select Y field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedSizeField}
											label="Size Field (numeric)"
											placeholder="Select size field"
											required={true}
										/>
									{:else if chartType === 'groupedBar'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedXAxis}
											label="X-Axis Field (categorical)"
											placeholder="Select category field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedYAxis}
											label="Y-Axis Field (numeric)"
											placeholder="Select numeric field"
											required={true}
										/>
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedGroupBy}
											label="Group By Field (categorical)"
											placeholder="Select grouping field"
											required={true}
										/>
									{:else if chartType === 'histogram'}
										<FieldSelector
											fields={numericFields}
											bind:value={selectedField}
											label="Numeric Field"
											placeholder="Select numeric field"
											required={true}
										/>
										<hr class="border-slate-200" />
										<div class="space-y-2">
											<Label for="bucketSize">Bucket Size</Label>
											<Input
												id="bucketSize"
												type="number"
												bind:value={bucketSize}
												placeholder="e.g., 10"
												min={1}
											/>
											<p class="text-xs text-slate-500">Size of each bucket/bin for grouping values</p>
										</div>
									{:else if chartType === 'boxPlot'}
										<FieldSelector
											fields={numericFields}
											bind:value={selectedField}
											label="Numeric Field"
											placeholder="Select numeric field for distribution"
											required={true}
										/>
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedGroupBy}
											label="Group By (optional)"
											placeholder="Group box plots by category"
											required={false}
										/>
									{:else if chartType === 'heatmap'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedXAxis}
											label="X-Axis Field (categorical)"
											placeholder="Select category field"
											required={true}
										/>
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedYAxis}
											label="Y-Axis Field (categorical)"
											placeholder="Select category field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedValueField}
											label="Value Field (numeric)"
											placeholder="Select value field for intensity"
											required={true}
										/>
									{:else if chartType === 'treeMap'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedCategoryField}
											label="Category Field"
											placeholder="Select category/hierarchy field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedValueField}
											label="Value Field (numeric)"
											placeholder="Select value field for size"
											required={true}
										/>
									{:else if chartType === 'funnel'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedCategoryField}
											label="Stage Field"
											placeholder="Select stage/category field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedValueField}
											label="Value Field (numeric)"
											placeholder="Select numeric value field"
											required={true}
										/>
									{:else if chartType === 'waterfall'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedXAxis}
											label="Category Field"
											placeholder="Select category field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedYAxis}
											label="Value Field (numeric)"
											placeholder="Select value field"
											required={true}
										/>
									{:else if chartType === 'sankey'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedXAxis}
											label="Source Field"
											placeholder="Select source node field"
											required={true}
										/>
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedYAxis}
											label="Target Field"
											placeholder="Select target node field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedValueField}
											label="Value Field (numeric)"
											placeholder="Select flow value field"
											required={true}
										/>
									{:else if chartType === 'gauge'}
										<FieldSelector
											fields={numericFields}
											bind:value={selectedField}
											label="Value Field (numeric)"
											placeholder="Select value field"
											required={true}
										/>
										<hr class="border-slate-200" />
										<div class="space-y-4">
											<div class="space-y-2">
												<Label for="gaugeMin">Minimum Value</Label>
												<Input
													id="gaugeMin"
													type="number"
													bind:value={gaugeMin}
													placeholder="e.g., 0"
												/>
											</div>
											<div class="space-y-2">
												<Label for="gaugeMax">Maximum Value</Label>
												<Input
													id="gaugeMax"
													type="number"
													bind:value={gaugeMax}
													placeholder="e.g., 100"
												/>
											</div>
										</div>
										<hr class="border-slate-200" />
										<AggregationSelector bind:value={aggregationType} />
									{:else if chartType === 'choropleth'}
										<FieldSelector
											fields={categoricalFields}
											bind:value={selectedLocationField}
											label="Location Field"
											placeholder="Select location/region field"
											required={true}
										/>
										<FieldSelector
											fields={numericFields}
											bind:value={selectedValueField}
											label="Value Field (numeric)"
											placeholder="Select value field for intensity"
											required={true}
										/>
										<p class="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded p-2">
											Note: Location field should contain region names or codes that match your map data
										</p>
									{:else if chartType === 'number'}
										<FieldSelector
											fields={numericFields}
											bind:value={selectedField}
											label="Field to Aggregate (numeric)"
											placeholder="Select numeric field"
											required={true}
										/>
										<hr class="border-slate-200" />
										<AggregationSelector bind:value={aggregationType} />
									{/if}
								{/if}
							</div>

						<!-- STEP 3: Aggregation + Colors -->
						{:else if currentStep === 3}
							<div class="space-y-5">
								{#if chartType !== 'scatter' && chartType !== 'bubble' && chartType !== 'number' && chartType !== 'gauge'}
									<AggregationSelector bind:value={aggregationType} />
								{/if}

								{#if chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar' || chartType === 'heatmap'}
									<hr class="border-slate-200" />
									<ColorCustomizer bind:colors={customColors} />
								{/if}
							</div>
						{/if}
					</div>

					<!-- Step Navigation -->
					<div class="px-6 py-4 border-t border-slate-100 shrink-0">
						<div class="flex items-center justify-between">
							<Button
								variant="outline"
								onclick={prevStep}
								disabled={currentStep === 1}
							>
								{@html icons.ArrowLeft(16)}
								<span class="ml-1">Back</span>
							</Button>

							<span class="text-xs text-slate-400">Step {currentStep} of {totalSteps}</span>

							{#if currentStep < totalSteps}
								<Button onclick={nextStep}>
									<span class="mr-1">Next</span>
									{@html icons.ArrowRight(16)}
								</Button>
							{:else}
								<Button onclick={saveView} loading={saving}>
									{isNewView ? 'Create View' : 'Save Changes'}
								</Button>
							{/if}
						</div>
					</div>
				</Card>
			</div>
		</div>
	{/if}
</div>
