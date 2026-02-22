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
	import Toast from '$lib/components/ui/toast.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import type { Dashboard, DashboardDefinition } from '$lib/types/dashboards';

	// Get project ID from URL
	const projectId = $derived(Number($page.params.projectId));

	// State
	let loading = $state(true);
	let dashboards = $state<Dashboard[]>([]);
	let error = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// Delete Dialog
	let deleteDialogOpen = $state(false);
	let dashboardToDelete = $state<Dashboard | null>(null);
	let deleteSubmitting = $state(false);

	onMount(() => {
		loadDashboards();
	});

	async function loadDashboards() {
		loading = true;
		error = null;

		const { data, error: apiError } = await api.getProjectDashboards(projectId);

		if (apiError) {
			error = apiError;
		} else if (data) {
			dashboards = data;
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

	function getViewCount(dashboard: Dashboard): number {
		try {
			const definition: DashboardDefinition = JSON.parse(dashboard.definition);
			return definition.layout.length;
		} catch {
			return 0;
		}
	}

	function createDashboard() {
		goto(`/projects/${projectId}/dashboards/new`);
	}

	function editDashboard(dashboardId: number) {
		goto(`/projects/${projectId}/dashboards/${dashboardId}`);
	}

	function openDeleteDialog(dashboard: Dashboard) {
		dashboardToDelete = dashboard;
		deleteDialogOpen = true;
	}

	async function handleDeleteDashboard() {
		if (!dashboardToDelete) return;
		deleteSubmitting = true;
		error = null;

		const { error: apiError } = await api.deleteDashboard(dashboardToDelete.id);

		if (apiError) {
			error = apiError;
			deleteSubmitting = false;
			return;
		}

		deleteSubmitting = false;
		deleteDialogOpen = false;
		toastType = 'success';
		toastMessage = 'Dashboard deleted successfully!';
		setTimeout(() => (toastMessage = null), 3000);
		await loadDashboards();
	}

	async function duplicateDashboard(dashboard: Dashboard) {
		try {
			const definition: DashboardDefinition = JSON.parse(dashboard.definition);

			const { data, error: apiError } = await api.createDashboard({
				projectId,
				name: `${dashboard.name} (Copy)`,
				description: dashboard.description,
				definition: JSON.stringify(definition),
				metadata: dashboard.metadata
			});

			if (apiError) {
				error = apiError;
				setTimeout(() => (error = null), 5000);
				return;
			}

			toastType = 'success';
		toastMessage = 'Dashboard duplicated successfully!';
			setTimeout(() => (toastMessage = null), 3000);
			await loadDashboards();
		} catch (e) {
			error = 'Failed to duplicate dashboard';
			setTimeout(() => (error = null), 5000);
		}
	}

	async function publishDashboard(dashboard: Dashboard) {
		// Handle both string and numeric enum values
		const isCurrentlyPublished = typeof dashboard.status === 'string' ?
			dashboard.status === 'Published' :
			dashboard.status === ContentStatus.Published;

		const newStatus = isCurrentlyPublished ? ContentStatus.Draft : ContentStatus.Published;
		const { error: apiError } = await api.updateDashboardStatus(dashboard.id, newStatus);

		if (apiError) {
			toastType = 'error';
			toastMessage = apiError;
			setTimeout(() => (toastMessage = null), 4000);
		} else {
			toastType = 'success';
			const action = newStatus === ContentStatus.Published ? 'published' : 'unpublished';
			toastMessage = `Dashboard ${action} successfully!`;
			setTimeout(() => (toastMessage = null), 3000);
			await loadDashboards();
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-slate-900">Dashboards</h2>
			<p class="text-slate-600 mt-1">Create custom dashboards by combining multiple views</p>
		</div>
		<Button onclick={createDashboard}>
			<span>{@html icons.Plus(16)}</span>
			<span class="ml-2">Create Dashboard</span>
		</Button>
	</div>


	<!-- Loading State -->
	{#if loading}
		<Card class="overflow-visible">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-50 border-b border-slate-200">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Actions</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Dashboard Name</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Views</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Last Updated</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each [1, 2, 3] as _}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-8 w-32" />
								</td>
								<td class="px-6 py-4">
									<Skeleton class="h-5 w-48" />
									<Skeleton class="h-4 w-32 mt-1" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-6 w-16" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-24" />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{:else if dashboards.length === 0}
		<!-- Empty State -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Dashboard(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No dashboards yet</h3>
				<p class="text-slate-600 mb-6">
					Create your first dashboard to visualize multiple views at once
				</p>
				<Button onclick={createDashboard}>
					<span>{@html icons.Plus(16)}</span>
					<span class="ml-2">Create Dashboard</span>
				</Button>
			</div>
		</Card>
	{:else}
		<!-- Dashboards Table -->
		<Card class="overflow-visible">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-50 border-b border-slate-200">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Actions</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Dashboard Name</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Views</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Last Updated</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each dashboards as dashboard}
							<tr class="hover:bg-slate-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<DropdownMenu align="left">
										{#snippet children({ close }: { close: () => void })}
											<DropdownMenuItem
												icon={icons.Edit(16)}
												onclick={() => {
													editDashboard(dashboard.id);
													close();
												}}
											>
												Edit Dashboard
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.RefreshCw(16)}
												onclick={() => {
													duplicateDashboard(dashboard);
													close();
												}}
											>
												Duplicate
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={(typeof dashboard.status === 'string' ? dashboard.status === 'Published' : dashboard.status === ContentStatus.Published) ? icons.FileText(16) : icons.CheckCircle(16)}
												onclick={() => {
													publishDashboard(dashboard);
													close();
												}}
											>
												{(typeof dashboard.status === 'string' ? dashboard.status === 'Published' : dashboard.status === ContentStatus.Published) ? 'Unpublish' : 'Publish'}
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.Trash(16)}
												variant="danger"
												onclick={() => {
													openDeleteDialog(dashboard);
													close();
												}}
											>
												Delete
											</DropdownMenuItem>
										{/snippet}
									</DropdownMenu>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm font-medium text-slate-900">{dashboard.name}</div>
									{#if dashboard.description}
										<div class="text-xs text-slate-500 truncate max-w-xs">
											{dashboard.description}
										</div>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Badge variant="default">
										{getViewCount(dashboard)} view{getViewCount(dashboard) !== 1 ? 's' : ''}
									</Badge>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{formatDate(dashboard.updatedAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>

<!-- Delete Dialog -->
<Dialog
	bind:open={deleteDialogOpen}
	onClose={() => (deleteDialogOpen = false)}
	title="Delete Dashboard"
	description="This action cannot be undone"
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Are you sure you want to delete <strong>{dashboardToDelete?.name}</strong>?
		</p>
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
			<p class="text-yellow-800 text-sm font-medium">Warning</p>
			<p class="text-yellow-700 text-sm mt-1">
				This will permanently delete the dashboard configuration.
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
				onclick={handleDeleteDashboard}
			>
				Delete Dashboard
			</Button>
		</div>
	</div>
</Dialog>

{#if toastMessage}
	<Toast message={toastMessage} type={toastType} onClose={() => (toastMessage = null)} />
{/if}
