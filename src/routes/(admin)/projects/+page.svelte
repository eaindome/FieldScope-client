<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Sidebar from '$lib/components/ui/sidebar.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Textarea from '$lib/components/ui/textarea.svelte';
	import DatePicker from '$lib/components/ui/date-picker.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import TableFilters from '$lib/components/ui/table-filters.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { formatDateTime } from '$lib/utils';
	import Toast from '$lib/components/ui/toast.svelte';
	import { api } from '$lib/api/client';

	// State
	let allProjects = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// Filter state
	let searchValue = $state('');
	let selectedStatus = $state('All');
	let startDate = $state('');
	let endDate = $state('');

	// Pagination state
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	// View mode
	let viewMode = $state<'table' | 'grid'>('table');

	// Create Sidebar
	let createSidebarOpen = $state(false);
	let createForm = $state({
		name: '',
		description: '',
		startDate: '',
		endDate: ''
	});
	let createSubmitting = $state(false);
	let createError = $state<string | null>(null);

	// Validation: check if create form is valid
	const isCreateFormValid = $derived(
		createForm.name.trim() !== '' &&
		createForm.startDate !== '' &&
		createForm.endDate !== ''
	);

	// View Sidebar
	let viewSidebarOpen = $state(false);
	let selectedProject = $state<any | null>(null);

	// Edit Sidebar
	let editSidebarOpen = $state(false);
	let editForm = $state<any | null>(null);
	let editSubmitting = $state(false);
	let editError = $state<string | null>(null);

	// Delete Dialog
	let deleteDialogOpen = $state(false);
	let projectToDelete = $state<any | null>(null);
	let deleteSubmitting = $state(false);

	// Activate Dialog
	let activateDialogOpen = $state(false);
	let projectToActivate = $state<any | null>(null);
	let activateSubmitting = $state(false);

	onMount(() => {
		loadProjects();
	});

	async function loadProjects() {
		loading = true;
		error = null;

		const { data, error: err } = await api.getProjects();
		if (err) {
			error = err;
			allProjects = [];
		} else if (data && Array.isArray(data)) {
			allProjects = data;
		} else {
			allProjects = [];
		}

		loading = false;
	}

	// Client-side filtering
	const projects = $derived.by(() => {
		let filtered = allProjects;

		// Filter by search (name, description)
		if (searchValue) {
			const search = searchValue.toLowerCase();
			filtered = filtered.filter(
				(p) =>
					p.name.toLowerCase().includes(search) ||
					(p.description && p.description.toLowerCase().includes(search))
			);
		}

		// Filter by status
		if (selectedStatus !== 'All') {
			filtered = filtered.filter((p) => p.status.toLowerCase() === selectedStatus.toLowerCase());
		}

		// Filter by date range
		if (startDate) {
			const start = new Date(startDate);
			filtered = filtered.filter((p) => new Date(p.createdAt) >= start);
		}
		if (endDate) {
			const end = new Date(endDate);
			filtered = filtered.filter((p) => new Date(p.createdAt) <= end);
		}

		return filtered;
	});

	// Paginated data
	const paginatedProjects = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return projects.slice(startIndex, endIndex);
	});

	// Reset to page 1 when filters change
	$effect(() => {
		searchValue;
		selectedStatus;
		startDate;
		endDate;
		currentPage = 1;
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getStatusVariant(status: string) {
		switch (status) {
			case 'active':
				return 'success';
			case 'draft':
				return 'warning';
			case 'closed':
				return 'default';
			default:
				return 'default';
		}
	}

	function getStatusLabel(status: string) {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	function openViewSidebar(project: any) {
		selectedProject = project;
		viewSidebarOpen = true;
	}

	function openProject(project: any) {
		goto(`/projects/${project.id}/forms`);
	}

	function openCreateSidebar() {
		createForm = {
			name: '',
			description: '',
			startDate: '',
			endDate: ''
		};
		createError = null;
		createSidebarOpen = true;
	}

	async function handleCreateProject() {
		if (!createForm.name || !createForm.startDate || !createForm.endDate) {
			createError = 'Please fill in all required fields';
			return;
		}

		createSubmitting = true;
		createError = null;

		const { data, error: err } = await api.createProject({
			name: createForm.name,
			description: createForm.description,
			startDate: createForm.startDate,
			endDate: createForm.endDate
		});

		createSubmitting = false;

		if (err) {
			createError = err;
		} else if (data) {
			createSidebarOpen = false;
			toastType = 'success';
			toastMessage = 'Project created successfully!';
			setTimeout(() => (toastMessage = null), 3000);
			// Reload projects to show the new one
			loadProjects();
		}
	}

	function openEditSidebar(project: any) {
		editForm = {
			name: project.name,
			description: project.description || '',
			startDate: project.startDate.split('T')[0],
			endDate: project.endDate.split('T')[0]
		};
		selectedProject = project;
		editError = null;
		editSidebarOpen = true;
	}

	async function handleUpdateProject() {
		if (!editForm || !selectedProject) return;

		editSubmitting = true;
		editError = null;

		const { data, error: err } = await api.updateProject(selectedProject.id, {
			name: editForm.name,
			description: editForm.description,
			startDate: editForm.startDate,
			endDate: editForm.endDate
		});

		editSubmitting = false;

		if (err) {
			editError = err;
		} else if (data) {
			editSidebarOpen = false;
			toastType = 'success';
			toastMessage = 'Project updated successfully!';
			setTimeout(() => (toastMessage = null), 3000);
			// Reload projects to show the updated one
			loadProjects();
		}
	}

	function openDeleteDialog(project: any) {
		projectToDelete = project;
		deleteDialogOpen = true;
	}

	async function handleDeleteProject() {
		if (!projectToDelete) return;
		deleteSubmitting = true;
		error = null;

		const { error: err } = await api.deleteProject(projectToDelete.id);

		deleteSubmitting = false;

		if (err) {
			error = err;
		} else {
			deleteDialogOpen = false;
			toastType = 'success';
			toastMessage = 'Project deleted successfully!';
			setTimeout(() => (toastMessage = null), 3000);
			// Reload projects to remove the deleted one
			loadProjects();
		}
	}

	async function handleActivateProject() {
		if (!projectToActivate) return;
		activateSubmitting = true;

		const { error: err } = await api.updateProject(projectToActivate.id, { status: 'Active' });

		activateSubmitting = false;

		if (err) {
			toastType = 'error';
			toastMessage = err;
			setTimeout(() => (toastMessage = null), 4000);
		} else {
			activateDialogOpen = false;
			toastType = 'success';
			toastMessage = `"${projectToActivate.name}" is now active!`;
			setTimeout(() => (toastMessage = null), 3000);
			loadProjects();
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-slate-900">Projects</h1>
			<p class="text-slate-600 mt-2">Manage your data collection projects</p>
		</div>
		<div class="flex items-center gap-3">
			<!-- View Toggle -->
			<div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
				<button
					onclick={() => (viewMode = 'table')}
					class={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
						viewMode === 'table'
							? 'bg-white text-slate-900 shadow-sm'
							: 'text-slate-600 hover:text-slate-900'
					}`}
					title="Table View"
				>
					{@html icons.List(16)}
				</button>
				<button
					onclick={() => (viewMode = 'grid')}
					class={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
						viewMode === 'grid'
							? 'bg-white text-slate-900 shadow-sm'
							: 'text-slate-600 hover:text-slate-900'
					}`}
					title="Grid View"
				>
					{@html icons.Grid(16)}
				</button>
			</div>
			<Button onclick={openCreateSidebar}>+ Create Project</Button>
		</div>
	</div>


	<!-- Table Filters -->
	<TableFilters
		searchPlaceholder="Search by name or description..."
		bind:searchValue
		statusOptions={[
			{ label: 'All', value: 'All' },
			{ label: 'Draft', value: 'draft' },
			{ label: 'Active', value: 'active' },
			{ label: 'Closed', value: 'closed' }
		]}
		bind:selectedStatus
		dateRangeEnabled={true}
		bind:startDate
		bind:endDate
		totalItems={projects.length}
		bind:currentPage
		bind:itemsPerPage
		collapsible={true}
		defaultCollapsed={true}
	/>

	<!-- Projects Table/Grid -->
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
								>Project Name</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Duration</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Created</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each [1, 2, 3, 4, 5] as _}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-8 w-32" />
								</td>
								<td class="px-6 py-4">
									<Skeleton class="h-5 w-64" />
									<Skeleton class="h-4 w-48 mt-1" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-40" />
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
	{:else if projects.length === 0}
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Folder(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">
					{#if searchValue || selectedStatus !== 'All' || startDate || endDate}
						No projects found
					{:else}
						No projects yet
					{/if}
				</h3>
				<p class="text-slate-600 mb-6">
					{#if searchValue || selectedStatus !== 'All' || startDate || endDate}
						No projects match your current filters
					{:else}
						Create your first project to start collecting data
					{/if}
				</p>
				<!-- {#if !(searchValue || selectedStatus !== 'All' || startDate || endDate)}
					<Button onclick={openCreateSidebar}>Create Project</Button>
				{/if} -->
			</div>
		</Card>
	{:else if viewMode === 'table'}
		<!-- Table View -->
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
								>Project Name</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Duration</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Created</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each paginatedProjects as project}
							<tr class="hover:bg-slate-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<DropdownMenu align="left">
										{#snippet children({ close }: { close: () => void })}
											<DropdownMenuItem
												icon={icons.Folder(16)}
												onclick={() => {
													openProject(project);
													close();
												}}
											>
												Open Project
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.Eye(16)}
												onclick={() => {
													openViewSidebar(project);
													close();
												}}
											>
												View Details
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.Edit(16)}
												onclick={() => {
													openEditSidebar(project);
													close();
												}}
											>
												Edit
											</DropdownMenuItem>
											{#if project.status === 'Draft'}
												<DropdownMenuItem
													icon={icons.Play(16)}
													onclick={() => {
														projectToActivate = project;
														activateDialogOpen = true;
														close();
													}}
												>
													Activate
												</DropdownMenuItem>
											{/if}
											<DropdownMenuItem
												icon={icons.Trash(16)}
												variant="danger"
												onclick={() => {
													openDeleteDialog(project);
													close();
												}}
											>
												Delete
											</DropdownMenuItem>
										{/snippet}
									</DropdownMenu>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm font-medium text-slate-900">{project.name}</div>
									{#if project.description}
										<div class="text-xs text-slate-500 truncate max-w-xs">{project.description}</div>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{formatDate(project.startDate)} - {formatDate(project.endDate)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Badge variant={getStatusVariant(project.status)}>
										{getStatusLabel(project.status)}
									</Badge>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{formatDate(project.createdAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{:else}
		<!-- Grid View -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each paginatedProjects as project}
				<button
					type="button"
					class="text-left hover:shadow-lg transition-shadow cursor-pointer"
					onclick={() => openProject(project)}
				>
					<Card class="h-full">
						<div class="p-6 space-y-4">
						<!-- Header with Status and Actions -->
						<div class="flex items-start justify-between">
							<Badge variant={getStatusVariant(project.status)}>
								{getStatusLabel(project.status)}
							</Badge>
							<DropdownMenu align="right">
								{#snippet children({ close }: { close: () => void })}
									<DropdownMenuItem
										icon={icons.Folder(16)}
										onclick={() => {
											openProject(project);
											close();
										}}
									>
										Open Project
									</DropdownMenuItem>
									<DropdownMenuItem
										icon={icons.Eye(16)}
										onclick={() => {
											openViewSidebar(project);
											close();
										}}
									>
										View Details
									</DropdownMenuItem>
									<DropdownMenuItem
										icon={icons.Edit(16)}
										onclick={() => {
											openEditSidebar(project);
											close();
										}}
									>
										Edit
									</DropdownMenuItem>
									{#if project.status === 'Draft'}
										<DropdownMenuItem
											icon={icons.Play(16)}
											onclick={() => {
												projectToActivate = project;
												activateDialogOpen = true;
												close();
											}}
										>
											Activate
										</DropdownMenuItem>
									{/if}
									<DropdownMenuItem
										icon={icons.Trash(16)}
										variant="danger"
										onclick={() => {
											openDeleteDialog(project);
											close();
										}}
									>
										Delete
									</DropdownMenuItem>
								{/snippet}
							</DropdownMenu>
						</div>

						<!-- Project Name -->
						<div>
							<h3 class="text-lg font-semibold text-slate-900 mb-1">{project.name}</h3>
							{#if project.description}
								<p class="text-sm text-slate-600 line-clamp-2">{project.description}</p>
							{/if}
						</div>

						<!-- Duration -->
						<div class="flex items-center gap-2 text-sm text-slate-600">
							<span>{@html icons.Calendar(16)}</span>
							<span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
						</div>

						<!-- Created Date -->
						<div class="flex items-center gap-2 text-xs text-slate-500 pt-4 border-t border-slate-200">
							<span>{@html icons.Clock(14)}</span>
							<span>Created {formatDate(project.createdAt)}</span>
						</div>
					</div>
				</Card>
			</button>
			{/each}
		</div>
	{/if}
</div>

<!-- View Project Sidebar -->
<Sidebar
	bind:open={viewSidebarOpen}
	onClose={() => (viewSidebarOpen = false)}
	title={selectedProject?.name || 'Project Details'}
	width="lg"
>
	{#snippet headerExtra()}
		{#if selectedProject}
			<Badge variant={getStatusVariant(selectedProject.status)}>
				{getStatusLabel(selectedProject.status)}
			</Badge>
		{/if}
	{/snippet}

	{#if selectedProject}
		<div class="space-y-4">
			<div class="space-y-1.5">
				<Label>Description</Label>
				<textarea
					class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 cursor-default resize-none focus:outline-none"
					rows={3}
					readonly
					tabindex={-1}
					value={selectedProject.description || 'No description provided'}
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label>Start Date</Label>
					<Input
						value={formatDate(selectedProject.startDate)}
						readonly
						tabindex={-1}
						class="bg-slate-50 cursor-default focus:ring-0 focus:border-slate-200"
					/>
				</div>
				<div class="space-y-1.5">
					<Label>End Date</Label>
					<Input
						value={formatDate(selectedProject.endDate)}
						readonly
						tabindex={-1}
						class="bg-slate-50 cursor-default focus:ring-0 focus:border-slate-200"
					/>
				</div>
			</div>

			<div class="space-y-1.5">
				<Label>Created</Label>
				<Input
					value={formatDate(selectedProject.createdAt)}
					readonly
					tabindex={-1}
					class="bg-slate-50 cursor-default focus:ring-0 focus:border-slate-200"
				/>
			</div>

			<div class="space-y-1.5">
				<Label>Last Updated</Label>
				<Input
					value={formatDate(selectedProject.updatedAt)}
					readonly
					tabindex={-1}
					class="bg-slate-50 cursor-default focus:ring-0 focus:border-slate-200"
				/>
			</div>
		</div>
	{/if}
</Sidebar>

<!-- Edit Project Sidebar -->
<Sidebar
	bind:open={editSidebarOpen}
	onClose={() => (editSidebarOpen = false)}
	title="Edit Project"
	width="lg"
>
	{#snippet footer()}
		<div class="flex flex-col gap-2">
			<Button type="button" class="w-full" loading={editSubmitting} onclick={handleUpdateProject}>
				Save Changes
			</Button>
			<Button
				type="button"
				variant="outline"
				class="w-full"
				onclick={() => (editSidebarOpen = false)}
				disabled={editSubmitting}
			>
				Cancel
			</Button>
		</div>
	{/snippet}

	{#if editForm}
		<div class="space-y-4">
			{#if editError}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3">
					<p class="text-red-800 text-sm font-medium">{editError}</p>
				</div>
			{/if}

			<div>
				<Label for="edit-name">Project Name *</Label>
				<Input
					id="edit-name"
					bind:value={editForm.name}
					placeholder="Project name"
					required
					disabled={editSubmitting}
					class="mt-1"
				/>
			</div>

			<div>
				<Label for="edit-description">Description</Label>
				<Input
					id="edit-description"
					bind:value={editForm.description}
					placeholder="Description"
					disabled={editSubmitting}
					class="mt-1"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="edit-startDate">Start Date *</Label>
					<DatePicker bind:value={editForm.startDate} placeholder="Select start date" />
				</div>
				<div>
					<Label for="edit-endDate">End Date *</Label>
					<DatePicker bind:value={editForm.endDate} placeholder="Select end date" />
				</div>
			</div>
		</div>
	{/if}
</Sidebar>

<!-- Activate Dialog -->
<Dialog
	bind:open={activateDialogOpen}
	onClose={() => (activateDialogOpen = false)}
	title="Activate Project"
	description="Change project status to active"
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Are you sure you want to activate <strong>{projectToActivate?.name}</strong>?
		</p>
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
			<p class="text-blue-800 text-sm font-medium">Note</p>
			<p class="text-blue-700 text-sm mt-1">
				Once activated, this project will be available for data collection. You can deactivate it later if needed.
			</p>
		</div>
		<div class="flex gap-3 pt-4">
			<Button
				variant="outline"
				class="flex-1"
				onclick={() => (activateDialogOpen = false)}
				disabled={activateSubmitting}
			>
				Cancel
			</Button>
			<Button
				class="flex-1"
				loading={activateSubmitting}
				onclick={handleActivateProject}
			>
				Activate Project
			</Button>
		</div>
	</div>
</Dialog>

<!-- Delete Dialog -->
<Dialog
	bind:open={deleteDialogOpen}
	onClose={() => (deleteDialogOpen = false)}
	title="Delete Project"
	description="This action cannot be undone"
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Are you sure you want to delete <strong>{projectToDelete?.name}</strong>?
		</p>
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
			<p class="text-yellow-800 text-sm font-medium">Warning</p>
			<p class="text-yellow-700 text-sm mt-1">
				This will permanently delete all forms, views, dashboards, and submissions associated with
				this project.
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
				onclick={handleDeleteProject}
			>
				Delete Project
			</Button>
		</div>
	</div>
</Dialog>

<!-- Create Project Sidebar -->
<Sidebar
	bind:open={createSidebarOpen}
	onClose={() => (createSidebarOpen = false)}
	title="Create New Project"
	width="lg"
>
	{#snippet footer()}
		<div class="flex flex-col gap-2">
			<Button type="button" class="w-full" loading={createSubmitting} disabled={!isCreateFormValid || createSubmitting} onclick={handleCreateProject}>
				Create Project
			</Button>
			<Button
				type="button"
				variant="outline"
				class="w-full"
				onclick={() => (createSidebarOpen = false)}
				disabled={createSubmitting}
			>
				Cancel
			</Button>
		</div>
	{/snippet}

	<div class="space-y-4">
		{#if createError}
			<div class="bg-red-50 border border-red-200 rounded-lg p-3">
				<p class="text-red-800 text-sm font-medium">{createError}</p>
			</div>
		{/if}

		<div>
			<Label for="name">Project Name *</Label>
			<Input
				id="name"
				bind:value={createForm.name}
				placeholder="e.g., Wildlife Census 2026"
				required
				disabled={createSubmitting}
				class="mt-1"
			/>
		</div>

		<div>
			<Label for="description">Description</Label>
			<Input
				id="description"
				bind:value={createForm.description}
				placeholder="Brief description of the project"
				disabled={createSubmitting}
				class="mt-1"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label for="startDate">Start Date *</Label>
				<DatePicker bind:value={createForm.startDate} placeholder="Select start date" />
			</div>
			<div>
				<Label for="endDate">End Date *</Label>
				<DatePicker bind:value={createForm.endDate} placeholder="Select end date" />
			</div>
		</div>
	</div>
</Sidebar>

{#if toastMessage}
	<Toast message={toastMessage} type={toastType} onClose={() => (toastMessage = null)} />
{/if}
