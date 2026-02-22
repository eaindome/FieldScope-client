<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Breadcrumbs from '$lib/components/ui/breadcrumbs.svelte';
	import ViewSelector from '$lib/components/dashboards/ViewSelector.svelte';
	import DashboardCanvas from '$lib/components/dashboards/DashboardCanvas.svelte';
	import { getAllProjectFields } from '$lib/utils/data-aggregation';
	import { icons } from '$lib/components/icons.svelte';
	import { cn } from '$lib/utils';
	import type { DashboardItem, DashboardDefinition } from '$lib/types/dashboards';
	import type { View } from '$lib/types/views';
	import type { FormField } from '$lib/types/views';

	// Get IDs from URL
	const projectId = $derived(Number($page.params.projectId));
	const dashboardId = $derived($page.params.dashboardId);
	const isNewDashboard = $derived(dashboardId === 'new');

	// State - Basic info
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let dashboardName = $state('Untitled Dashboard');
	let dashboardDescription = $state('');
	let projectName = $state('Project');
	let showLayoutSettings = $state(false);

	// State - Layout
	let dashboardItems = $state<DashboardItem[]>([]);
	let selectedItemId = $state<string | null>(null);
	let gridColumns = $state(12);
	let gridRowHeight = $state(120);
	let gridGap = $state(16);

	// State - Data
	let views = $state<View[]>([]);
	let forms = $state<any[]>([]);
	let submissions = $state<any[]>([]);
	let allFields = $state<FormField[]>([]);

	// Breadcrumbs
	const breadcrumbs = $derived([
		{ label: 'Projects', href: '/projects' },
		{ label: projectName, href: `/projects/${projectId}/forms` },
		{ label: 'Dashboards', href: `/projects/${projectId}/dashboards` },
		{ label: isNewDashboard ? 'New Dashboard' : dashboardName }
	]);

	// Derived
	const selectedItem = $derived(dashboardItems.find((item) => item.id === selectedItemId));

	// Preset layouts
	function applyLayout(layoutType: string) {
		if (dashboardItems.length === 0) return;

		switch (layoutType) {
			case 'single':
				dashboardItems = dashboardItems.map((item, index) => ({
					...item,
					x: 0,
					y: index * 3,
					width: gridColumns,
					height: 3
				}));
				break;
			case 'two-column':
				dashboardItems = dashboardItems.map((item, index) => ({
					...item,
					x: (index % 2) * Math.floor(gridColumns / 2),
					y: Math.floor(index / 2) * 3,
					width: Math.floor(gridColumns / 2),
					height: 3
				}));
				break;
			case 'three-column':
				dashboardItems = dashboardItems.map((item, index) => ({
					...item,
					x: (index % 3) * Math.floor(gridColumns / 3),
					y: Math.floor(index / 3) * 3,
					width: Math.floor(gridColumns / 3),
					height: 3
				}));
				break;
			case 'sidebar':
				dashboardItems = dashboardItems.map((item, index) => {
					if (index === 0) {
						return { ...item, x: 0, y: 0, width: Math.floor((gridColumns * 2) / 3), height: 6 };
					} else {
						return {
							...item,
							x: Math.floor((gridColumns * 2) / 3),
							y: (index - 1) * 3,
							width: Math.floor(gridColumns / 3),
							height: 3
						};
					}
				});
				break;
		}
		// Force reactivity
		dashboardItems = [...dashboardItems];
	}

	const presetLayouts = [
		{
			name: 'Single Column',
			icon: icons.List(20),
			type: 'single'
		},
		{
			name: 'Two Columns',
			icon: icons.Grid(20),
			type: 'two-column'
		},
		{
			name: 'Three Columns',
			icon: icons.Grid(20),
			type: 'three-column'
		},
		{
			name: 'Sidebar Layout',
			icon: icons.Layers(20),
			type: 'sidebar'
		}
	];

	onMount(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		try {
			// Load project name for breadcrumb
			const { data: projectsData } = await api.getProjects();
			const project = projectsData?.find((p: any) => p.id === projectId);
			if (project) projectName = project.name;

			// Load views for this project
			const { data: viewsData, error: viewsError } = await api.getProjectViews(projectId);
			if (viewsError) {
				error = viewsError;
				loading = false;
				return;
			}
			views = viewsData || [];

			// Load forms for field extraction
			const { data: formsData, error: formsError } = await api.getProjectForms(projectId);
			if (formsError) {
				error = formsError;
				loading = false;
				return;
			}
			forms = formsData || [];
			allFields = getAllProjectFields(forms);

			// Load submissions for chart data
			const { data: submissionsData, error: submissionsError } =
				await api.getProjectSubmissions(projectId);
			if (submissionsError) {
				error = submissionsError;
				loading = false;
				return;
			}
			submissions = submissionsData || [];

			// If editing existing dashboard, load it
			if (!isNewDashboard) {
				const { data: dashboardsData, error: dashboardsError } =
					await api.getProjectDashboards(projectId);
				if (dashboardsError) {
					error = dashboardsError;
					loading = false;
					return;
				}

				const dashboard = dashboardsData?.find((d) => d.id === Number(dashboardId));
				if (dashboard) {
					dashboardName = dashboard.name;
					dashboardDescription = dashboard.description || '';

					try {
						const definition: DashboardDefinition = JSON.parse(dashboard.definition);
						dashboardItems = definition.layout || [];
						gridColumns = definition.gridColumns || 12;
						gridRowHeight = definition.gridRowHeight || 120;
						gridGap = definition.gridGap || 16;
					} catch (e) {
						error = 'Failed to parse dashboard definition';
					}
				} else {
					error = 'Dashboard not found';
				}
			}
		} catch (e) {
			error = 'Failed to load data';
		}

		loading = false;
	}

	function validateDashboard(): string | null {
		if (!dashboardName.trim()) return 'Dashboard name is required';
		if (dashboardItems.length === 0) return 'Add at least one view to the dashboard';
		return null;
	}

	async function saveDashboard() {
		const validationError = validateDashboard();
		if (validationError) {
			error = validationError;
			return;
		}

		saving = true;
		error = null;

		const dashboardDefinition: DashboardDefinition = {
			layout: dashboardItems,
			gridColumns,
			gridRowHeight,
			gridGap
		};

		const payload = {
			projectId,
			name: dashboardName,
			description: dashboardDescription,
			definition: JSON.stringify(dashboardDefinition)
		};

		const result = isNewDashboard
			? await api.createDashboard(payload)
			: await api.updateDashboard(Number(dashboardId), payload);

		if (result.error) {
			error = result.error;
			saving = false;
			return;
		}

		saving = false;
		goto(`/projects/${projectId}/dashboards`);
	}

	function goBack() {
		goto(`/projects/${projectId}/dashboards`);
	}
</script>

{#if loading}
	<!-- Loading Skeleton State -->
	<div class="flex h-screen flex-col bg-slate-50">
		<!-- Top Bar Skeleton -->
		<div class="border-b border-slate-200 bg-white px-6 py-4">
			<div class="flex items-center justify-between">
				<Skeleton class="h-5 w-96" />
				<div class="flex items-center gap-3">
					<Skeleton class="h-9 w-24" />
					<Skeleton class="h-9 w-28" />
				</div>
			</div>
		</div>

		<!-- Two-Panel Layout Skeleton -->
		<div class="flex flex-1 overflow-hidden">
			<!-- CENTER PANEL -->
			<div class="flex-1 p-8">
				<Skeleton class="h-full w-full" />
			</div>

			<!-- RIGHT PANEL -->
			<div class="w-80 border-l border-slate-200 bg-white p-4">
				<Skeleton class="h-5 w-32 mb-4" />
				<div class="space-y-4">
					<Skeleton class="h-20 w-full" />
					<Skeleton class="h-20 w-full" />
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-screen flex-col bg-slate-50">
		<!-- Top Bar -->
		<div class="border-b border-slate-200 bg-white shadow-sm">
			<div class="flex items-center justify-between px-6 py-4">
				<!-- Left Side: Breadcrumbs -->
				<div class="flex items-center gap-6">
					<Breadcrumbs items={breadcrumbs} />
				</div>

				<!-- Right Side: Actions -->
				<div class="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						onclick={() => (showLayoutSettings = !showLayoutSettings)}
					>
						{@html icons.Settings(16)}
						<span class="ml-2">Layout Settings</span>
					</Button>
					<Button variant="outline" size="sm" onclick={goBack}>
						Cancel
					</Button>
					<Button size="sm" onclick={saveDashboard} loading={saving}>
						{isNewDashboard ? 'Create Dashboard' : 'Save Dashboard'}
					</Button>
				</div>
			</div>

			<!-- Error Banner -->
			{#if error}
				<div class="px-6 py-3 bg-red-50 border-t border-red-200">
					<div class="flex items-center gap-2 text-red-800">
						<span>{@html icons.AlertCircle(16)}</span>
						<span class="text-sm font-medium">{error}</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Layout Settings Dialog -->
		{#if showLayoutSettings}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
				onclick={(e) => {
					if (e.target === e.currentTarget) showLayoutSettings = false;
				}}
			>
				<div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col">
					<!-- Header -->
					<div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
						<div>
							<h3 class="text-lg font-semibold text-slate-900">Layout Settings</h3>
							<p class="text-xs text-slate-500 mt-0.5">Configure your dashboard's grid and layout</p>
						</div>
						<button
							class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
							onclick={() => (showLayoutSettings = false)}
						>
							{@html icons.X(20)}
						</button>
					</div>

					<!-- Content -->
					<div class="flex-1 overflow-y-auto">
						<div class="grid grid-cols-2 gap-6 p-6">
							<!-- Left: Settings -->
							<div class="space-y-6">
								<!-- Preset Layouts -->
								<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
									<div class="flex items-center gap-2 mb-4">
										<div class="p-2 bg-blue-600 text-white rounded-lg">
											{@html icons.Layers(18)}
										</div>
										<div>
											<h4 class="text-sm font-semibold text-slate-900">Preset Layouts</h4>
											<p class="text-xs text-slate-600">Quick layout arrangements</p>
										</div>
									</div>

									<div class="grid grid-cols-2 gap-2">
										{#each presetLayouts as preset}
											<button
												onclick={() => applyLayout(preset.type)}
												disabled={dashboardItems.length === 0}
												class="flex items-center gap-2 p-3 rounded-lg border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<div class="text-slate-600">{@html preset.icon}</div>
												<span class="text-xs font-medium text-slate-900">{preset.name}</span>
											</button>
										{/each}
									</div>
									{#if dashboardItems.length > 0}
										<p class="text-xs text-slate-500 mt-3">
											Applies to all {dashboardItems.length} view{dashboardItems.length !== 1
												? 's'
												: ''} on canvas
										</p>
									{:else}
										<p class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 mt-3">
											Add views to the dashboard to use preset layouts
										</p>
									{/if}
								</div>

								<!-- Grid Settings -->
								<div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
									<div class="flex items-center gap-2 mb-4">
										<div class="p-2 bg-purple-600 text-white rounded-lg">
											{@html icons.Grid(18)}
										</div>
										<div>
											<h4 class="text-sm font-semibold text-slate-900">Grid Configuration</h4>
											<p class="text-xs text-slate-600">Customize grid dimensions</p>
										</div>
									</div>

									<div class="space-y-4">
										<div>
											<div class="flex items-center justify-between mb-2">
												<Label for="grid-columns" class="text-xs font-semibold text-slate-700">
													Grid Columns
												</Label>
												<span class="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
													{gridColumns}
												</span>
											</div>
											<input
												id="grid-columns"
												type="range"
												bind:value={gridColumns}
												min="6"
												max="16"
												step="2"
												class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
											/>
											<div class="flex justify-between text-xs text-slate-500 mt-1">
												<span>Fewer (6)</span>
												<span>More (16)</span>
											</div>
										</div>

										<div>
											<div class="flex items-center justify-between mb-2">
												<Label for="row-height" class="text-xs font-semibold text-slate-700">
													Row Height
												</Label>
												<span class="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
													{gridRowHeight}px
												</span>
											</div>
											<input
												id="row-height"
												type="range"
												bind:value={gridRowHeight}
												min="80"
												max="200"
												step="20"
												class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
											/>
											<div class="flex justify-between text-xs text-slate-500 mt-1">
												<span>Compact</span>
												<span>Spacious</span>
											</div>
										</div>

										<div>
											<div class="flex items-center justify-between mb-2">
												<Label for="grid-gap" class="text-xs font-semibold text-slate-700">
													Grid Gap
												</Label>
												<span class="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
													{gridGap}px
												</span>
											</div>
											<input
												id="grid-gap"
												type="range"
												bind:value={gridGap}
												min="8"
												max="32"
												step="4"
												class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
											/>
											<div class="flex justify-between text-xs text-slate-500 mt-1">
												<span>Tight</span>
												<span>Loose</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- Right: Preview -->
							<div>
								<div class="bg-slate-50 rounded-xl p-4 border border-slate-200 sticky top-0">
									<div class="flex items-center gap-2 mb-3">
										<span class="text-slate-600">{@html icons.Eye(16)}</span>
										<h4 class="text-sm font-semibold text-slate-900">Live Preview</h4>
									</div>

									<!-- Grid Preview -->
									<div class="bg-white rounded-lg border border-slate-300 p-3 min-h-96 relative overflow-hidden">
										<!-- Grid visualization -->
										<div
											class="grid"
											style="grid-template-columns: repeat({gridColumns}, 1fr); gap: {Math.max(
												2,
												gridGap / 4
											)}px; height: {gridRowHeight * 3}px;"
										>
											{#each Array(gridColumns * 3) as _, i}
												<div class="bg-slate-100 rounded-sm"></div>
											{/each}
										</div>

										<!-- Sample views overlay -->
										{#if dashboardItems.length > 0}
											<div
												class="absolute inset-3"
												style="display: grid; grid-template-columns: repeat({gridColumns}, 1fr); gap: {Math.max(
													2,
													gridGap / 4
												)}px; grid-auto-rows: {gridRowHeight / 3}px;"
											>
												{#each dashboardItems.slice(0, 6) as item, idx}
													<div
														class="bg-blue-500/20 border-2 border-blue-500 rounded flex items-center justify-center"
														style="grid-column: span {item.width}; grid-row: span {item.height};"
													>
														<span class="text-xs font-semibold text-blue-700">View {idx + 1}</span>
													</div>
												{/each}
											</div>
										{:else}
											<div class="absolute inset-0 flex items-center justify-center">
												<div class="text-center text-slate-400">
													<p class="text-xs">Add views to see preview</p>
												</div>
											</div>
										{/if}
									</div>

									<!-- Stats -->
									<div class="mt-3 grid grid-cols-3 gap-2 text-xs">
										<div class="bg-slate-100 rounded p-2 text-center">
											<div class="font-semibold text-slate-900">{gridColumns}</div>
											<div class="text-slate-600">Columns</div>
										</div>
										<div class="bg-slate-100 rounded p-2 text-center">
											<div class="font-semibold text-slate-900">{gridRowHeight}px</div>
											<div class="text-slate-600">Row Height</div>
										</div>
										<div class="bg-slate-100 rounded p-2 text-center">
											<div class="font-semibold text-slate-900">{gridGap}px</div>
											<div class="text-slate-600">Gap</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Footer -->
					<div class="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
						<div class="flex items-center gap-2 text-xs text-slate-600">
							<span>{@html icons.Info(14)}</span>
							<span>Changes are applied immediately to the canvas</span>
						</div>
						<Button onclick={() => (showLayoutSettings = false)}>
							{@html icons.Check(16)}
							<span class="ml-2">Done</span>
						</Button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Two-Panel Layout -->
		<div class="flex flex-1 overflow-hidden">
			<!-- CENTER PANEL: Dashboard Canvas -->
			<div class="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100/50">
				<div class="p-8">
					<!-- Dashboard Header -->
					<div class="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<Label for="dashboard-name" class="text-sm font-semibold text-slate-700 mb-2">
									Dashboard Name <span class="text-red-500">*</span>
								</Label>
								<Input
									id="dashboard-name"
									type="text"
									bind:value={dashboardName}
									placeholder="e.g., Wildlife Overview"
									class="text-lg font-semibold"
								/>
							</div>
							<div>
								<Label for="dashboard-description" class="text-sm font-semibold text-slate-700 mb-2">
									Description
								</Label>
								<Input
									id="dashboard-description"
									type="text"
									bind:value={dashboardDescription}
									placeholder="Brief description of this dashboard"
								/>
							</div>
						</div>
					</div>

					<!-- Canvas -->
					<div class="bg-white rounded-xl shadow-md border border-slate-200 p-6">
						<div class="mb-4 flex items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold text-slate-900">Dashboard Layout</h3>
								<p class="text-sm text-slate-600 mt-1">
									{dashboardItems.length} view{dashboardItems.length !== 1 ? 's' : ''} added
								</p>
							</div>
							{#if dashboardItems.length > 0}
								<div class="text-xs text-slate-500 flex items-center gap-1">
									<span>{@html icons.Info(14)}</span>
									<span>Drag to move • Resize from edges/corners</span>
								</div>
							{/if}
						</div>

						<DashboardCanvas
							bind:items={dashboardItems}
							{views}
							{submissions}
							{allFields}
							{gridColumns}
							{gridRowHeight}
							{gridGap}
							editMode={true}
						/>
					</div>
				</div>
			</div>

			<!-- RIGHT PANEL: View Selector -->
			<div class="w-80 border-l border-slate-200 bg-slate-50 overflow-y-auto">
				<ViewSelector {views} />
			</div>
		</div>
	</div>
{/if}
