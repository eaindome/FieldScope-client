<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api, ContentStatus } from '$lib/api/client';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import ChartPreview from '$lib/components/views/ChartPreview.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { aggregateSubmissionData, getAllProjectFields } from '$lib/utils/data-aggregation';
	import type { View, ViewDefinition, ChartData, ChartType, FormField } from '$lib/types/views';

	// Get project ID from URL
	const projectId = $derived(Number($page.params.projectId));

	// State
	let loading = $state(true);
	let views = $state<View[]>([]);
	let submissions = $state<any[]>([]);
	let allFields = $state<FormField[]>([]);
	let error = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// Preview Dialog
	let previewDialogOpen = $state(false);
	let previewView = $state<View | null>(null);

	// Delete Dialog
	let deleteDialogOpen = $state(false);
	let viewToDelete = $state<View | null>(null);
	let deleteSubmitting = $state(false);

	onMount(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		const [viewsResult, formsResult, submissionsResult] = await Promise.all([
			api.getProjectViews(projectId),
			api.getProjectForms(projectId),
			api.getProjectSubmissions(projectId)
		]);

		if ('error' in viewsResult && viewsResult.error) {
			error = viewsResult.error;
		} else if (viewsResult.data) {
			views = viewsResult.data;
		}

		if (formsResult.data) {
			allFields = getAllProjectFields(formsResult.data);
		}

		if (submissionsResult.data) {
			submissions = submissionsResult.data;
		}

		loading = false;
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getChartType(view: View): ChartType {
		try {
			return (JSON.parse(view.definition) as ViewDefinition).chartType;
		} catch {
			return 'bar';
		}
	}

	function getChartTypeLabel(view: View): string {
		const type = getChartType(view);
		const labels: Record<string, string> = {
			bar: 'Bar',
			horizontalBar: 'H. Bar',
			line: 'Line',
			pie: 'Pie',
			doughnut: 'Doughnut',
			stackedBar: 'Stacked Bar',
			area: 'Area',
			stackedArea: 'Stacked Area',
			scatter: 'Scatter',
			radar: 'Radar',
			number: 'Number'
		};
		return labels[type] ?? type;
	}

	function getChartTypeIcon(view: View): string {
		const type = getChartType(view);
		switch (type) {
			case 'bar': return icons.BarChart(20);
			case 'horizontalBar': return icons.BarChartH(20);
			case 'line': return icons.TrendingUp(20);
			case 'pie': return icons.PieChart(20);
			case 'doughnut': return icons.Circle(20);
			case 'stackedBar': return icons.BarChart2(20);
			case 'area': return icons.AreaChart(20);
			case 'stackedArea': return icons.AreaChart(20);
			case 'scatter': return icons.Scatter(20);
			case 'radar': return icons.Radar(20);
			case 'number': return icons.Hash(20);
			default: return icons.Activity(20);
		}
	}

	function getChartData(view: View): ChartData {
		try {
			const definition = JSON.parse(view.definition) as ViewDefinition;
			return aggregateSubmissionData(submissions, definition.config, allFields);
		} catch {
			return { labels: [], datasets: [] };
		}
	}

	function openPreview(view: View) {
		previewView = view;
		previewDialogOpen = true;
	}

	function createView() {
		goto(`/projects/${projectId}/views/new`);
	}

	function editView(viewId: number) {
		goto(`/projects/${projectId}/views/${viewId}`);
	}

	function openDeleteDialog(view: View) {
		viewToDelete = view;
		deleteDialogOpen = true;
	}

	async function handleDeleteView() {
		if (!viewToDelete) return;
		deleteSubmitting = true;
		error = null;

		const { error: apiError } = await api.deleteView(viewToDelete.id);

		if (apiError) {
			error = apiError;
			deleteSubmitting = false;
			return;
		}

		deleteSubmitting = false;
		deleteDialogOpen = false;
		toastType = 'success';
		toastMessage = 'View deleted successfully!';
		setTimeout(() => (toastMessage = null), 3000);
		await loadData();
	}

	async function duplicateView(view: View) {
		try {
			const definition: ViewDefinition = JSON.parse(view.definition);

			const { error: apiError } = await api.createView({
				projectId,
				name: `${view.name} (Copy)`,
				description: view.description,
				definition: JSON.stringify(definition),
				metadata: view.metadata
			});

			if (apiError) {
				error = apiError;
				setTimeout(() => (error = null), 5000);
				return;
			}

			toastType = 'success';
		toastMessage = 'View duplicated successfully!';
			setTimeout(() => (toastMessage = null), 3000);
			await loadData();
		} catch (e) {
			error = 'Failed to duplicate view';
			setTimeout(() => (error = null), 5000);
		}
	}

	async function publishView(view: View) {
		// Handle both string and numeric enum values
		const isCurrentlyPublished = typeof view.status === 'string' ?
			view.status === 'Published' :
			view.status === ContentStatus.Published;

		const newStatus = isCurrentlyPublished ? ContentStatus.Draft : ContentStatus.Published;
		const { error: apiError } = await api.updateViewStatus(view.id, newStatus);

		if (apiError) {
			toastType = 'error';
			toastMessage = apiError;
			setTimeout(() => (toastMessage = null), 4000);
		} else {
			toastType = 'success';
			const action = newStatus === ContentStatus.Published ? 'published' : 'unpublished';
			toastMessage = `View ${action} successfully!`;
			setTimeout(() => (toastMessage = null), 3000);
			await loadData();
		}
	}

	async function cloneView(view: View) {
		try {
			const { error: apiError } = await api.cloneView(view.id);

			if (apiError) {
				error = apiError;
				setTimeout(() => (error = null), 5000);
				return;
			}

			toastType = 'success';
			toastMessage = 'View cloned successfully! You can now edit the copy.';
			setTimeout(() => (toastMessage = null), 3000);
			await loadData();
		} catch (e) {
			error = 'Failed to clone view';
			setTimeout(() => (error = null), 5000);
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-slate-900">Views</h2>
			<p class="text-slate-600 mt-1">Create charts and visualizations from your form data</p>
		</div>
		<Button onclick={createView}>
			<span>{@html icons.Plus(16)}</span>
			<span class="ml-2">Create View</span>
		</Button>
	</div>


	<!-- Loading State: card skeletons -->
	{#if loading}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each [1, 2, 3, 4, 5, 6] as _}
				<div class="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
					<div class="flex items-start justify-between">
						<Skeleton class="h-8 w-8 rounded-lg" />
						<Skeleton class="h-5 w-20 rounded-full" />
					</div>
					<div class="space-y-2">
						<Skeleton class="h-5 w-3/4" />
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-2/3" />
					</div>
					<div class="flex items-center justify-between pt-2">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-8 w-28 rounded-lg" />
					</div>
				</div>
			{/each}
		</div>
	{:else if views.length === 0}
		<!-- Empty State -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Activity(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No views yet</h3>
				<p class="text-slate-600 mb-6">
					Create your first view to visualize your data with charts
				</p>
				<Button onclick={createView}>
					<span>{@html icons.Plus(16)}</span>
					<span class="ml-2">Create View</span>
				</Button>
			</div>
		</Card>
	{:else}
		<!-- Card Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each views as view}
				<div class="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
					<!-- Card Header: name + badges -->
					<div class="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
						<h3 class="text-sm font-semibold text-slate-900 line-clamp-1 flex-1">{view.name}</h3>
						<div class="flex items-center gap-1.5 shrink-0">
							{#if view.isSystem}
								<Badge variant="system" class="text-xs">{@html icons.Sparkles(12)} System</Badge>
							{/if}
							<Badge variant="default" class="text-xs">{getChartTypeLabel(view)}</Badge>
						</div>
					</div>

					<!-- Chart Preview -->
					<div class="mx-4 rounded-lg overflow-hidden border border-slate-100" style="height: 160px;">
						<ChartPreview
							chartType={getChartType(view)}
							chartData={getChartData(view)}
							title=""
							compact={true}
						/>
					</div>

					<!-- Card Footer -->
					<div class="px-4 pb-4 pt-3 flex items-center justify-between mt-auto">
						<div>
							{#if view.description}
								<p class="text-xs text-slate-500 line-clamp-1 max-w-35">{view.description}</p>
							{/if}
							<span class="text-xs text-slate-400">{formatDate(view.updatedAt)}</span>
						</div>
						<div class="flex items-center gap-0.5">
							<!-- View full chart button -->
							<div class="relative group/preview">
								<button
									type="button"
									onclick={() => openPreview(view)}
									class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
								>
									{@html icons.Eye(16)}
								</button>
								<span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs font-medium bg-slate-800 text-white rounded whitespace-nowrap opacity-0 group-hover/preview:opacity-100 transition-opacity z-10">
									View full chart
								</span>
							</div>
							<!-- Edit view configuration button (disabled for system views) -->
							{#if !view.isSystem}
								<div class="relative group/edit">
									<button
										type="button"
										onclick={() => editView(view.id)}
										class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
									>
										{@html icons.Edit(16)}
									</button>
									<span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs font-medium bg-slate-800 text-white rounded whitespace-nowrap opacity-0 group-hover/edit:opacity-100 transition-opacity z-10">
										Edit configuration
									</span>
								</div>
							{/if}
							<!-- More actions dropdown -->
							<DropdownMenu align="right">
								{#snippet children({ close }: { close: () => void })}
									{#if view.isSystem}
										<DropdownMenuItem
											icon={icons.Copy(16)}
											onclick={() => {
												cloneView(view);
												close();
											}}
										>
											Clone (Create Copy)
										</DropdownMenuItem>
									{:else}
										<DropdownMenuItem
											icon={icons.RefreshCw(16)}
											onclick={() => {
												duplicateView(view);
												close();
											}}
										>
											Duplicate
										</DropdownMenuItem>
										<DropdownMenuItem
											icon={(typeof view.status === 'string' ? view.status === 'Published' : view.status === ContentStatus.Published) ? icons.FileText(16) : icons.CheckCircle(16)}
											onclick={() => {
												publishView(view);
												close();
											}}
										>
											{(typeof view.status === 'string' ? view.status === 'Published' : view.status === ContentStatus.Published) ? 'Unpublish' : 'Publish'}
										</DropdownMenuItem>
										<DropdownMenuItem
											icon={icons.Trash(16)}
											variant="danger"
											onclick={() => {
												openDeleteDialog(view);
												close();
											}}
										>
											Delete
										</DropdownMenuItem>
									{/if}
								{/snippet}
							</DropdownMenu>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Preview Dialog -->
{#if previewView}
	<Dialog
		bind:open={previewDialogOpen}
		onClose={() => (previewDialogOpen = false)}
		title={previewView.name}
		description={previewView.description || ''}
	>
		<div class="h-96">
			<ChartPreview
				chartType={getChartType(previewView)}
				chartData={getChartData(previewView)}
				title={previewView.name}
			/>
		</div>
		<div class="flex justify-end gap-3 pt-4">
			<Button variant="outline" onclick={() => (previewDialogOpen = false)}>Close</Button>
			<Button onclick={() => { previewDialogOpen = false; editView(previewView!.id); }}>
				<span>{@html icons.Edit(16)}</span>
				<span class="ml-2">Edit View</span>
			</Button>
		</div>
	</Dialog>
{/if}

<!-- Delete Dialog -->
<Dialog
	bind:open={deleteDialogOpen}
	onClose={() => (deleteDialogOpen = false)}
	title="Delete View"
	description="This action cannot be undone"
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Are you sure you want to delete <strong>{viewToDelete?.name}</strong>?
		</p>
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
			<p class="text-yellow-800 text-sm font-medium">Warning</p>
			<p class="text-yellow-700 text-sm mt-1">
				This will permanently delete the view configuration.
			</p>
		</div>
		<div class="flex gap-3 pt-4">
			<Button
				variant="outline"
				class="flex-1"
				onclick={() => (deleteDialogOpen = false)}
				disabled={deleteSubmitting}
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				class="flex-1"
				loading={deleteSubmitting}
				onclick={handleDeleteView}
			>
				Delete View
			</Button>
		</div>
	</div>
</Dialog>

{#if toastMessage}
	<Toast message={toastMessage} type={toastType} onClose={() => (toastMessage = null)} />
{/if}
