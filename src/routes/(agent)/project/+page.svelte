<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { formatDateTime } from '$lib/utils';

	let projects = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let currentUser = $state<any | null>(null);
	let activeTab = $state<'active' | 'ended'>('active');

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		// Load current user
		const { data: userData, error: userError } = await api.getCurrentUser();
		if (userError) {
			error = userError;
			loading = false;
			return;
		}
		currentUser = userData;

		// Load projects assigned to agent
		const { data: projectsData, error: projectsError } = await api.getAgentProjects();
		if (projectsError) {
			error = projectsError;
		} else {
			projects = projectsData || [];
		}

		loading = false;
	}

	function openProject(projectId: number) {
		goto(`/project/${projectId}/submissions`);
	}

	function isProjectActive(project: any): boolean {
		const now = new Date();
		const start = new Date(project.startDate);
		const end = new Date(project.endDate);
		return now >= start && now <= end;
	}

	function isProjectUpcoming(project: any): boolean {
		const now = new Date();
		const start = new Date(project.startDate);
		return now < start;
	}

	function getProjectStatusBadge(project: any) {
		if (isProjectUpcoming(project)) {
			return { variant: 'warning' as const, label: 'Upcoming' };
		} else if (isProjectActive(project)) {
			return { variant: 'success' as const, label: 'Active' };
		} else {
			return { variant: 'default' as const, label: 'Ended' };
		}
	}

	const activeProjects = $derived(projects.filter((p) => isProjectActive(p)));
	const upcomingProjects = $derived(projects.filter((p) => isProjectUpcoming(p)));
	const endedProjects = $derived(
		projects.filter((p) => !isProjectActive(p) && !isProjectUpcoming(p))
	);

	// Combine active and upcoming for display
	const activeAndUpcomingProjects = $derived([...upcomingProjects, ...activeProjects]);
</script>

<div class="min-h-screen bg-slate-50">
	<!-- Page Header -->
	<div class="bg-white border-b border-slate-200 px-4 lg:px-8 py-6">
		<h1 class="text-2xl lg:text-3xl font-bold text-slate-900">My Projects</h1>
		<p class="text-slate-600 mt-1">View and access your assigned projects</p>
	</div>

	<!-- Tabs Section -->
	<div class="bg-white border-b border-slate-200">
		<!-- Tabs -->
		{#if !loading && !error && projects.length > 0 && (activeAndUpcomingProjects.length > 0 || endedProjects.length > 0)}
			<div class="flex px-4 lg:px-8">
				<button
					type="button"
					onclick={() => (activeTab = 'active')}
					class="flex-1 lg:flex-none lg:px-8 px-4 py-3 text-sm font-medium transition-colors relative {activeTab === 'active'
						? 'text-blue-600'
						: 'text-slate-600 hover:text-slate-900'}"
				>
					Active Projects
					{#if activeTab === 'active'}
						<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
					{/if}
				</button>
				{#if endedProjects.length > 0}
					<button
						type="button"
						onclick={() => (activeTab = 'ended')}
						class="flex-1 lg:flex-none lg:px-8 px-4 py-3 text-sm font-medium transition-colors relative {activeTab === 'ended'
							? 'text-blue-600'
							: 'text-slate-600 hover:text-slate-900'}"
					>
						Ended Projects
						{#if activeTab === 'ended'}
							<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
						{/if}
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="p-4 lg:p-8 space-y-3">
			{#each [1, 2, 3] as _}
				<Card class="p-4">
					<Skeleton class="h-24 w-full" />
				</Card>
			{/each}
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="p-4 lg:p-8">
			<Card class="p-8">
				<div class="text-center">
					<div class="flex justify-center mb-4 text-red-300">
						{@html icons.AlertCircle(48)}
					</div>
					<h3 class="text-lg font-semibold text-slate-900 mb-2">Error Loading Projects</h3>
					<p class="text-sm text-slate-600 mb-6">{error}</p>
					<Button onclick={loadData}>Try Again</Button>
				</div>
			</Card>
		</div>
	{:else if projects.length === 0}
		<!-- Empty State -->
		<div class="flex items-center justify-center p-6" style="min-height: calc(100vh - 150px);">
			<div class="text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Folder(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No Projects Assigned</h3>
				<p class="text-slate-600">
					You don't have any projects assigned yet. Contact your administrator.
				</p>
			</div>
		</div>
	{/if}

	{#if !loading && !error && projects.length > 0}
		<!-- Active Projects -->
		{#if activeTab === 'active' && activeAndUpcomingProjects.length > 0}
			<div class="p-4 lg:p-8">
				<div class="space-y-3">
					{#each activeAndUpcomingProjects as project}
						<Card class="hover:shadow-lg transition-shadow active:shadow-xl">
							<button
								type="button"
								onclick={() => openProject(project.id)}
								class="w-full text-left p-4"
							>
								<div class="flex items-start justify-between mb-3">
									<h3 class="text-base font-semibold text-slate-900 flex-1 pr-2">
										{project.name}
									</h3>
									<Badge variant={getProjectStatusBadge(project).variant} class="shrink-0 text-xs">
										{getProjectStatusBadge(project).label}
									</Badge>
								</div>

								{#if project.description}
									<p class="text-sm text-slate-600 mb-3 line-clamp-2">{project.description}</p>
								{/if}

								<div class="space-y-2 mb-3">
									<div class="flex items-center gap-2 text-xs text-slate-600">
										<span>{@html icons.Calendar(14)}</span>
										<span>
											{new Date(project.startDate).toLocaleDateString()} - {new Date(
												project.endDate
											).toLocaleDateString()}
										</span>
									</div>
									{#if project.submissionCount !== undefined}
										<div class="flex items-center gap-2 text-xs text-slate-600">
											<span>{@html icons.CheckCircle(14)}</span>
											<span
												>{project.submissionCount} submission{project.submissionCount !== 1
													? 's'
													: ''}</span
											>
										</div>
									{/if}
								</div>

								<div class="flex items-center justify-end text-blue-600">
									<span class="text-sm font-medium">Open</span>
									<span class="ml-1">{@html icons.ChevronRight(16)}</span>
								</div>
							</button>
						</Card>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Ended Projects -->
		{#if activeTab === 'ended' && endedProjects.length > 0}
			<div class="p-4">
				<div class="space-y-3">
					{#each endedProjects as project}
						<Card class="hover:shadow-md transition-shadow opacity-75">
							<button
								type="button"
								onclick={() => goto(`/project/${project.id}/submissions`)}
								class="w-full text-left p-4"
							>
								<div class="flex items-start justify-between mb-3">
									<h3 class="text-base font-semibold text-slate-900 flex-1 pr-2">
										{project.name}
									</h3>
									<Badge variant={getProjectStatusBadge(project).variant} class="shrink-0 text-xs">
										{getProjectStatusBadge(project).label}
									</Badge>
								</div>

								{#if project.description}
									<p class="text-sm text-slate-600 mb-3 line-clamp-2">{project.description}</p>
								{/if}

								<div class="space-y-2 mb-3">
									<div class="flex items-center gap-2 text-xs text-slate-600">
										<span>{@html icons.Calendar(14)}</span>
										<span>Ended {new Date(project.endDate).toLocaleDateString()}</span>
									</div>
									{#if project.submissionCount !== undefined}
										<div class="flex items-center gap-2 text-xs text-slate-600">
											<span>{@html icons.CheckCircle(14)}</span>
											<span
												>{project.submissionCount} submission{project.submissionCount !== 1
													? 's'
													: ''}</span
											>
										</div>
									{/if}
								</div>

								<div class="flex items-center justify-end text-slate-600">
									<span class="text-sm font-medium">View Submissions</span>
									<span class="ml-1">{@html icons.ChevronRight(16)}</span>
								</div>
							</button>
						</Card>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
