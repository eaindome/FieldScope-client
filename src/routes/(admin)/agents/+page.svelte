<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import TableFilters from '$lib/components/ui/table-filters.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { formatDateTime } from '$lib/utils';
	import { icons } from '$lib/components/icons.svelte';

	// All agents loaded from API
	let allAgents = $state<any[]>([]);
	let loading = $state(true);
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	// Filter state
	let searchValue = $state('');
	let selectedStatus = $state('All');
	let startDate = $state('');
	let endDate = $state('');

	// Pagination state
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	// Deactivate Dialog
	let deactivateDialogOpen = $state(false);
	let agentToDeactivate = $state<any | null>(null);
	let deactivateSubmitting = $state(false);

	// Project Assignment Sidebar
	let assignProjectsSidebarOpen = $state(false);
	let agentForProjectAssignment = $state<any | null>(null);
	let selectedProjectIds = $state<number[]>([]);
	let assigningProjects = $state(false);
	let allProjects = $state<any[]>([]);

	onMount(async () => {
		await loadAgents();
		await loadProjects();
	});

	async function loadAgents() {
		loading = true;
		// Get all users with role "Agent" from the organization
		const { data, error: err } = await api.getUsers();
		if (err) {
			toast = { message: err, type: 'error' };
		} else {
			// Filter only agents
			allAgents = (data || []).filter((user: any) => user.role === 'Agent');
		}
		loading = false;
	}

	async function loadProjects() {
		const { data, error: err } = await api.getProjects();
		if (!err) {
			allProjects = Array.isArray(data) ? data : [];
		}
	}

	// Only show active projects for assignment
	const activeProjects = $derived(allProjects.filter((p) => p.status?.toLowerCase() === 'active'));

	// Client-side filtering
	const filteredAgents = $derived.by(() => {
		let filtered = allAgents;

		// Filter by search
		if (searchValue) {
			const search = searchValue.toLowerCase();
			filtered = filtered.filter(
				(agent) =>
					agent.email.toLowerCase().includes(search) ||
					agent.name?.toLowerCase().includes(search)
			);
		}

		// Filter by status
		if (selectedStatus !== 'All') {
			const isActive = selectedStatus === 'Active';
			filtered = filtered.filter((agent) => agent.isActive === isActive);
		}

		// Filter by date range
		if (startDate) {
			const start = new Date(startDate);
			filtered = filtered.filter((agent) => new Date(agent.createdAt) >= start);
		}
		if (endDate) {
			const end = new Date(endDate);
			filtered = filtered.filter((agent) => new Date(agent.createdAt) <= end);
		}

		return filtered;
	});

	// Paginated data
	const paginatedAgents = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredAgents.slice(startIndex, endIndex);
	});

	// Reset to page 1 when filters change
	$effect(() => {
		searchValue;
		selectedStatus;
		startDate;
		endDate;
		currentPage = 1;
	});

	// Stats based on allAgents
	const stats = $derived({
		total: allAgents.length,
		active: allAgents.filter((a) => a.isActive).length,
		inactive: allAgents.filter((a) => !a.isActive).length
	});

	function viewAgent(agentId: number) {
		goto(`/agents/${agentId}`);
	}

	function viewSubmissions(agentId: number) {
		goto(`/agents/${agentId}/submissions`);
	}

	function openDeactivateDialog(agent: any) {
		agentToDeactivate = agent;
		deactivateDialogOpen = true;
	}

	async function handleDeactivateAgent() {
		if (!agentToDeactivate) return;
		deactivateSubmitting = true;

		// Toggle active status
		const { error: err } = await api.updateUserStatus(
			agentToDeactivate.id,
			!agentToDeactivate.isActive
		);
		if (err) {
			toast = { message: err, type: 'error' };
		} else {
			const action = agentToDeactivate.isActive ? 'deactivated' : 'activated';
			toast = { message: `Contributor ${action} successfully!`, type: 'success' };
			deactivateDialogOpen = false;
			await loadAgents();
			setTimeout(() => (toast = null), 5000);
		}
		deactivateSubmitting = false;
	}

	function addSingleAgent() {
		goto('/agents/add');
	}

	function bulkUploadAgents() {
		goto('/agents/bulk-upload');
	}

	function openAssignProjectsSidebar(agent: any) {
		agentForProjectAssignment = agent;
		selectedProjectIds = agent.projectsAssigned || [];
		assignProjectsSidebarOpen = true;
	}

	function toggleProjectSelection(projectId: number) {
		if (selectedProjectIds.includes(projectId)) {
			selectedProjectIds = selectedProjectIds.filter((id) => id !== projectId);
		} else {
			selectedProjectIds = [...selectedProjectIds, projectId];
		}
	}

	async function handleSaveProjectAssignment() {
		if (!agentForProjectAssignment) return;
		assigningProjects = true;

		const { error: err } = await api.updateAgentProjects(
			agentForProjectAssignment.id,
			selectedProjectIds
		);

		if (err) {
			toast = { message: err, type: 'error' };
		} else {
			toast = { message: `Projects assigned successfully to ${agentForProjectAssignment.email}!`, type: 'success' };
			assignProjectsSidebarOpen = false;
			await loadAgents();
			setTimeout(() => (toast = null), 5000);
		}

		assigningProjects = false;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-slate-900">Contributors</h1>
			<p class="text-slate-600 mt-2">Manage field contributors and their data collection activities</p>
		</div>
		<div class="flex items-center gap-3">
			<Button variant="outline" onclick={bulkUploadAgents} class="gap-2">
				<span>{@html icons.Upload(16)}</span>
				Bulk Upload
			</Button>
			<Button onclick={addSingleAgent} class="gap-2">
				<span>{@html icons.Plus(16)}</span>
				Invite Contributor
			</Button>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		{#if loading}
			{#each [1, 2, 3] as _}
				<Card class="hover:shadow-md transition-shadow">
					<div class="p-6 space-y-3">
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-10 w-20" />
					</div>
				</Card>
			{/each}
		{:else}
			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-slate-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-500 uppercase tracking-wide">
								Total Contributors
							</p>
							<p class="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
						</div>
						<div class="p-3 bg-slate-100 rounded-lg">
							{@html icons.Users(24)}
						</div>
					</div>
				</div>
			</Card>
			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-green-600 uppercase tracking-wide">Active</p>
							<p class="text-3xl font-bold text-green-700 mt-2">{stats.active}</p>
						</div>
						<div class="p-3 bg-green-100 rounded-lg text-green-600">
							{@html icons.CheckCircle(24)}
						</div>
					</div>
				</div>
			</Card>
			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-red-600 uppercase tracking-wide">Inactive</p>
							<p class="text-3xl font-bold text-red-700 mt-2">{stats.inactive}</p>
						</div>
						<div class="p-3 bg-red-100 rounded-lg text-red-600">
							{@html icons.XCircle(24)}
						</div>
					</div>
				</div>
			</Card>
		{/if}
	</div>

	<!-- Table Filters -->
	<TableFilters
		searchPlaceholder="Search by email or name..."
		bind:searchValue
		statusOptions={[
			{ label: 'All', value: 'All' },
			{ label: 'Active', value: 'Active' },
			{ label: 'Inactive', value: 'Inactive' }
		]}
		bind:selectedStatus
		dateRangeEnabled={true}
		bind:startDate
		bind:endDate
		totalItems={filteredAgents.length}
		bind:currentPage
		bind:itemsPerPage
		collapsible={true}
		defaultCollapsed={true}
	/>

	<!-- Agents Table -->
	{#if loading}
		<Card>
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
								>Contributor</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Joined Date</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Submissions</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each [1, 2, 3, 4, 5] as _}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-8 w-32" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-48" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-6 w-16" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-32" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-16" />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{:else if filteredAgents.length === 0}
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Users(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No contributors found</h3>
				<p class="text-slate-600 mb-6">
					{#if searchValue || selectedStatus !== 'All' || startDate || endDate}
						No contributors match your current filters
					{:else}
						Invite field contributors to start collecting data
					{/if}
				</p>
				{#if !(searchValue || selectedStatus !== 'All' || startDate || endDate)}
					<div class="flex items-center justify-center gap-3">
						<Button onclick={addSingleAgent}>Invite Contributor</Button>
						<Button variant="outline" onclick={bulkUploadAgents}>Bulk Upload</Button>
					</div>
				{/if}
			</div>
		</Card>
	{:else}
		<Card>
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
								>Contributor</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Joined Date</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Submissions</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each paginatedAgents as agent}
							<tr class="hover:bg-slate-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<DropdownMenu align="left">
										{#snippet children({ close }: { close: () => void })}
											<DropdownMenuItem
												icon={icons.Eye(16)}
												onclick={() => {
													viewAgent(agent.id);
													close();
												}}
											>
												View Profile
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.FileText(16)}
												onclick={() => {
													viewSubmissions(agent.id);
													close();
												}}
											>
												View Submissions
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.Briefcase(16)}
												onclick={() => {
													openAssignProjectsSidebar(agent);
													close();
												}}
											>
												Assign Projects
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={agent.isActive ? icons.XCircle(16) : icons.CheckCircle(16)}
												variant={agent.isActive ? 'danger' : 'default'}
												onclick={() => {
													openDeactivateDialog(agent);
													close();
												}}
											>
												{agent.isActive ? 'Deactivate' : 'Activate'}
											</DropdownMenuItem>
										{/snippet}
									</DropdownMenu>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<img
											src="https://api.dicebear.com/7.x/notionists/svg?seed={agent.email}"
											alt={agent.name || agent.email}
											class="w-10 h-10 rounded-full bg-slate-100"
										/>
										<div>
											<div class="text-sm font-medium text-slate-900">
												{agent.email?.split('@')[0] || 'Unnamed Contributor'}
											</div>
											<div class="text-xs text-slate-500">{agent.email}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Badge variant={agent.isActive ? 'success' : 'danger'}>
										{agent.isActive ? 'Active' : 'Inactive'}
									</Badge>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{formatDateTime(agent.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{agent.submissionCount || 0}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>

<!-- Deactivate/Activate Dialog -->
<Dialog
	bind:open={deactivateDialogOpen}
	onClose={() => (deactivateDialogOpen = false)}
	title={agentToDeactivate?.isActive ? 'Deactivate Contributor' : 'Activate Contributor'}
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Are you sure you want to {agentToDeactivate?.isActive ? 'deactivate' : 'activate'}
			<strong>{agentToDeactivate?.email}</strong>?
		</p>
		{#if agentToDeactivate?.isActive}
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
				<p class="text-yellow-800 text-sm font-medium">Warning</p>
				<p class="text-yellow-700 text-sm mt-1">
					Deactivated contributors will not be able to log in or submit data.
				</p>
			</div>
		{/if}
		<div class="flex gap-3 pt-4">
			<Button
				variant={agentToDeactivate?.isActive ? 'destructive' : 'default'}
				class="flex-1"
				loading={deactivateSubmitting}
				onclick={handleDeactivateAgent}
			>
				{agentToDeactivate?.isActive ? 'Deactivate' : 'Activate'}
			</Button>
			<Button
				variant="outline"
				class="flex-1"
				onclick={() => (deactivateDialogOpen = false)}
				disabled={deactivateSubmitting}
			>
				Cancel
			</Button>
		</div>
	</div>
</Dialog>

<!-- Assign Projects Sidebar -->
{#if assignProjectsSidebarOpen}
	<div class="fixed inset-0 z-50 overflow-hidden">
		<!-- Overlay -->
		<button
			type="button"
			class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-all"
			onclick={() => (assignProjectsSidebarOpen = false)}
			aria-label="Close sidebar"
		></button>

		<!-- Sidebar -->
		<div class="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-xl flex flex-col">
			<!-- Header -->
			<div class="px-6 py-4 border-b border-slate-200">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-slate-900">
						Assign Projects
					</h2>
					<button
						onclick={() => (assignProjectsSidebarOpen = false)}
						class="text-slate-400 hover:text-slate-600 transition-colors"
					>
						{@html icons.X(20)}
					</button>
				</div>
				<p class="text-sm text-slate-600 mt-1">
					Contributor: <strong>{agentForProjectAssignment?.email}</strong>
				</p>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto px-6 py-4">
				{#if activeProjects.length === 0}
					<div class="text-center py-12">
						<div class="text-slate-300 mb-4">
							{@html icons.Briefcase(48)}
						</div>
						<p class="text-sm text-slate-600">No active projects available</p>
						<p class="text-xs text-slate-500 mt-1">
							Only active projects can be assigned to contributors
						</p>
					</div>
				{:else}
					<div class="space-y-2">
						<p class="text-sm font-medium text-slate-700 mb-3">
							Select projects to assign ({selectedProjectIds.length} selected)
						</p>
						{#each activeProjects as project}
							<label
								class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
							>
								<input
									type="checkbox"
									checked={selectedProjectIds.includes(project.id)}
									onchange={() => toggleProjectSelection(project.id)}
									disabled={assigningProjects}
									class="rounded text-blue-600"
								/>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-slate-900 truncate">
										{project.name}
									</div>
									{#if project.description}
										<div class="text-xs text-slate-500 truncate mt-0.5">
											{project.description}
										</div>
									{/if}
								</div>
								<Badge variant="success">Active</Badge>
							</label>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="px-6 py-4 border-t border-slate-200 space-y-3">
				<Button
					class="w-full"
					onclick={handleSaveProjectAssignment}
					loading={assigningProjects}
					disabled={activeProjects.length === 0 || selectedProjectIds.length === 0 || assigningProjects}
				>
					Save Assignment
				</Button>
				<Button
					variant="outline"
					class="w-full"
					onclick={() => (assignProjectsSidebarOpen = false)}
					disabled={assigningProjects}
				>
					Cancel
				</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Toast Notification -->
{#if toast}
	<Toast message={toast.message} type={toast.type} onClose={() => (toast = null)} />
{/if}
