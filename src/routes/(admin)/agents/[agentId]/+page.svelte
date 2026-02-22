<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Breadcrumbs from '$lib/components/ui/breadcrumbs.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { formatDateTime } from '$lib/utils';
	import { icons } from '$lib/components/icons.svelte';

	let agentId = $derived($page.params.agentId as string);
	let agent = $state<any | null>(null);
	let agentStats = $state<any | null>(null);
	let projects = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	// Tooltip state for submission activity
	let hoveredDay = $state<{ date: string; count: number; projectName: string } | null>(null);
	let tooltipPosition = $state<{ x: number; y: number }>({ x: 0, y: 0 });

	// Deactivate Dialog
	let deactivateDialogOpen = $state(false);
	let deactivateSubmitting = $state(false);

	onMount(async () => {
		await loadAgentData();
	});

	async function loadAgentData() {
		loading = true;
		error = null;

		if (!agentId) {
			error = 'Agent ID is missing';
			loading = false;
			return;
		}

		// Load agent details
		const { data: agentData, error: agentError } = await api.getUser(parseInt(agentId));
		if (agentError) {
			error = agentError;
			loading = false;
			return;
		}
		agent = agentData;

		// Load agent statistics
		const statsResponse = await api.getAgentStatistics(
			parseInt(agentId),
			'30days'
		);
		if (statsResponse.data) {
			agentStats = statsResponse.data;
		}

		// Load projects list (to show project names for assigned projects)
		const { data: projectsData, error: projectsError } = await api.getProjects();
		if (!projectsError) {
			projects = Array.isArray(projectsData) ? projectsData : [];
		}

		loading = false;
	}

	const breadcrumbItems = $derived([
		{ label: 'Contributors', href: '/agents' },
		{ label: agent?.email || 'Loading...' }
	]);

	// Get assigned project details
	const assignedProjects = $derived(
		projects.filter((p) => agent?.projectsAssigned?.includes(p.id)) || []
	);

	// Color palette for projects
	const projectColors = [
		'#3b82f6', // blue
		'#10b981', // green
		'#f59e0b', // amber
		'#8b5cf6', // purple
		'#ef4444', // red
		'#06b6d4', // cyan
		'#ec4899', // pink
		'#14b8a6' // teal
	];

	// Get color for a specific project
	function getProjectColor(projectId: number) {
		const index = projects.findIndex((p) => p.id === projectId);
		return projectColors[index % projectColors.length];
	}

	// Get organization name from agent data (assuming it will be added to API response)
	const organizationName = $derived(agent?.organizationName || 'Organization')

	function openDeactivateDialog() {
		deactivateDialogOpen = true;
	}

	async function handleToggleStatus() {
		if (!agent) return;
		deactivateSubmitting = true;

		const { error: err } = await api.updateUserStatus(agent.id, !agent.isActive);
		deactivateSubmitting = false;

		if (err) {
			toast = { message: err, type: 'error' };
		} else {
			const action = agent.isActive ? 'deactivated' : 'activated';
			toast = { message: `Contributor ${action} successfully!`, type: 'success' };
			deactivateDialogOpen = false;
			await loadAgentData();
		}

		// Auto-hide toast after 5 seconds
		setTimeout(() => {
			toast = null;
		}, 5000);
	}

	function handleBarHover(e: MouseEvent, day: any, projectName: string) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		tooltipPosition = {
			x: rect.left + rect.width / 2,
			y: rect.top - 10
		};
		hoveredDay = {
			date: day.date,
			count: day.count,
			projectName
		};
	}

	function handleBarLeave() {
		hoveredDay = null;
	}

	function viewSubmissions() {
		goto(`/agents/${agentId}/submissions`);
	}
</script>

<div class="space-y-6">
	<!-- Breadcrumbs -->
	<Breadcrumbs items={breadcrumbItems} />

	{#if loading}
		<!-- Loading State -->
		<div class="space-y-6">
			<Card class="p-6">
				<div class="flex items-start gap-6">
					<Skeleton class="h-24 w-24 rounded-full" />
					<div class="flex-1 space-y-3">
						<Skeleton class="h-8 w-64" />
						<Skeleton class="h-4 w-48" />
						<Skeleton class="h-4 w-32" />
					</div>
				</div>
			</Card>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				{#each [1, 2, 3] as _}
					<Card class="p-6">
						<Skeleton class="h-20 w-full" />
					</Card>
				{/each}
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-red-300">
					{@html icons.AlertCircle(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">Error Loading Contributor</h3>
				<p class="text-slate-600 mb-6">{error}</p>
				<Button onclick={() => goto('/agents')}>Back to Contributors</Button>
			</div>
		</Card>
	{:else if agent}
		<!-- Agent Header -->
		<Card>
			<div class="p-6">
				<div class="flex items-start justify-between">
					<div class="flex items-start gap-6">
						<!-- Avatar -->
						<img
							src="https://api.dicebear.com/7.x/notionists/svg?seed={agent.email}"
							alt={agent.name || agent.email}
							class="w-24 h-24 rounded-full bg-slate-100"
						/>

						<!-- Info -->
						<div class="space-y-3">
							<div>
								<h1 class="text-3xl font-bold text-slate-900">
									{agent.email?.split('@')[0] || 'Unnamed Contributor'}
								</h1>
								<p class="text-slate-600 mt-1">{agent.email}</p>
							</div>

							<div class="flex items-center gap-4">
								<Badge variant={agent.isActive ? 'success' : 'danger'}>
									{agent.isActive ? 'Active' : 'Inactive'}
								</Badge>
								<div class="flex items-center gap-1 text-sm text-slate-500">
									<span>{@html icons.Calendar(16)}</span>
									<span>Joined {formatDateTime(agent.createdAt)}</span>
								</div>
								{#if agent.lastActiveAt}
									<div class="flex items-center gap-1 text-sm text-slate-500">
										<span>{@html icons.Clock(16)}</span>
										<span>Last active {formatDateTime(agent.lastActiveAt)}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-2">
						<Button onclick={viewSubmissions}>
							<span>{@html icons.FileText(16)}</span>
							<span class="ml-2">View Submissions</span>
						</Button>
						<!-- <Button
							variant={agent.isActive ? 'destructive' : 'default'}
							onclick={openDeactivateDialog}
						>
							{agent.isActive ? 'Deactivate' : 'Activate'}
						</Button> -->
					</div>
				</div>
			</div>
		</Card>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-slate-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-500 uppercase tracking-wide">
								Total Submissions
							</p>
							<p class="text-3xl font-bold text-slate-900 mt-2">
								{agentStats?.submissions?.total || agent.submissionCount || 0}
							</p>
						</div>
						<div class="p-3 bg-slate-100 rounded-lg text-slate-600">
							{@html icons.FileText(24)}
						</div>
					</div>
				</div>
			</Card>

			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-slate-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-500 uppercase tracking-wide">Last 7 Days</p>
							<p class="text-3xl font-bold text-slate-900 mt-2">
								{agentStats?.submissions?.last7Days || 0}
							</p>
						</div>
						<div class="p-3 bg-slate-100 rounded-lg text-slate-600">
							{@html icons.TrendingUp(24)}
						</div>
					</div>
				</div>
			</Card>

			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-slate-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-500 uppercase tracking-wide">Last 30 Days</p>
							<p class="text-3xl font-bold text-slate-900 mt-2">
								{agentStats?.submissions?.last30Days || 0}
							</p>
						</div>
						<div class="p-3 bg-slate-100 rounded-lg text-slate-600">
							{@html icons.BarChart(24)}
						</div>
					</div>
				</div>
			</Card>

			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-slate-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-500 uppercase tracking-wide">Avg Per Day</p>
							<p class="text-3xl font-bold text-slate-900 mt-2">
								{agentStats?.submissions?.avgPerDay?.toFixed(1) || '0.0'}
							</p>
						</div>
						<div class="p-3 bg-slate-100 rounded-lg text-slate-600">
							{@html icons.Activity(24)}
						</div>
					</div>
				</div>
			</Card>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left Column: Activity & Stats -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Submission Timeline -->
				{#if agentStats?.submissions?.timeline}
					<Card>
						<div class="p-6 space-y-4">
							<h3 class="text-lg font-semibold text-slate-900">Submission Activity (Last 30 Days)</h3>

							<!-- Simple bar chart visualization -->
							<div class="space-y-2 relative">
								{#each agentStats.submissions.timeline.slice(-14) as day}
									{@const projectName = Object.keys(agentStats.submissions.byProject)[0] || 'Unknown Project'}
									{@const project = projects.find((p) => p.name === projectName)}
									{@const barColor = project ? getProjectColor(project.id) : '#3b82f6'}
									<div class="flex items-center gap-3">
										<span class="text-xs text-slate-500 w-20">
											{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
										</span>
										<div class="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden relative">
											<div
												role="button"
												tabindex="0"
												class="h-full rounded-full flex items-center justify-end pr-2 transition-all hover:opacity-90 cursor-pointer"
												style="width: {Math.min((day.count / Math.max(...agentStats.submissions.timeline.map((d: any) => d.count))) * 100, 100)}%; background-color: {barColor}"
												onmouseenter={(e) => handleBarHover(e, day, projectName)}
												onmouseleave={handleBarLeave}
											>
												{#if day.count > 0}
													<span class="text-xs text-white font-medium">{day.count}</span>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</Card>
				{/if}

				<!-- Project Breakdown -->
				{#if agentStats?.submissions?.byProject}
					<Card>
						<div class="p-6 space-y-4">
							<h3 class="text-lg font-semibold text-slate-900">Submissions by Project</h3>
							<div class="space-y-3">
								{#each Object.entries(agentStats.submissions.byProject) as [projectId, count]}
									{@const numCount = Number(count)}
									{@const project = projects.find((p) => p.id === parseInt(projectId))}
									{@const projectColor = getProjectColor(parseInt(projectId))}
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<p class="text-sm font-medium text-slate-900">
												{project?.name || `Project ${projectId}`}
											</p>
											<div class="mt-1 bg-slate-100 rounded-full h-2 overflow-hidden">
												<div
													class="h-full rounded-full"
													style="width: {agentStats.submissions.total > 0 ? (numCount / agentStats.submissions.total) * 100 : 0}%; background-color: {projectColor}"
												></div>
											</div>
										</div>
										<span class="text-sm font-semibold text-slate-900 ml-4">{numCount}</span>
									</div>
								{/each}
							</div>
						</div>
					</Card>
				{/if}
			</div>

			<!-- Right Column: Projects & Info -->
			<div class="space-y-6">
				<!-- Assigned Projects -->
				<Card>
					<div class="p-6 space-y-4">
						<h3 class="text-lg font-semibold text-slate-900">Assigned Projects</h3>

						{#if assignedProjects.length === 0}
							<p class="text-sm text-slate-500">No projects assigned yet</p>
						{:else}
							<div class="space-y-2">
								{#each assignedProjects as project}
									<a
										href={`/projects/${project.id}`}
										class="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
									>
										<div class="flex items-center justify-between">
											<div class="flex-1 min-w-0">
												<p class="text-sm font-medium text-slate-900 truncate">{project.name}</p>
												{#if project.description}
													<p class="text-xs text-slate-500 truncate mt-1">{project.description}</p>
												{/if}
											</div>
											<Badge variant={project.status === 'Active' ? 'success' : 'default'}>
												{project.status}
											</Badge>
										</div>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</Card>

				<!-- Contributor Details -->
				<Card>
					<div class="p-6 space-y-4">
						<h3 class="text-lg font-semibold text-slate-900">Contributor Details</h3>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-xs font-medium text-slate-500 uppercase">Organization</p>
								<p class="text-sm text-slate-900 mt-1">{organizationName}</p>
							</div>
							<div>
								<p class="text-xs font-medium text-slate-500 uppercase">Role</p>
								<Badge variant="info" class="mt-1">{agent.role}</Badge>
							</div>
							<div>
								<p class="text-xs font-medium text-slate-500 uppercase">Status</p>
								<Badge variant={agent.isActive ? 'success' : 'danger'} class="mt-1">
									{agent.isActive ? 'Active' : 'Inactive'}
								</Badge>
							</div>
							{#if agentStats?.activity?.totalActiveDays}
								<div>
									<p class="text-xs font-medium text-slate-500 uppercase">Active Days</p>
									<p class="text-sm text-slate-900 mt-1">{agentStats.activity.totalActiveDays} days</p>
								</div>
							{/if}
						</div>
					</div>
				</Card>
			</div>
		</div>
	{/if}
</div>

<!-- Deactivate/Activate Dialog -->
<Dialog
	bind:open={deactivateDialogOpen}
	onClose={() => (deactivateDialogOpen = false)}
	title={agent?.isActive ? 'Deactivate Contributor' : 'Activate Contributor'}
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Are you sure you want to {agent?.isActive ? 'deactivate' : 'activate'}
			<strong>{agent?.email}</strong>?
		</p>
		{#if agent?.isActive}
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
				<p class="text-yellow-800 text-sm font-medium">Warning</p>
				<p class="text-yellow-700 text-sm mt-1">
					Deactivated contributors will not be able to log in or submit data.
				</p>
			</div>
		{/if}
		<div class="flex gap-3 pt-4">
			<Button
				variant="outline"
				class="flex-1"
				onclick={() => (deactivateDialogOpen = false)}
				disabled={deactivateSubmitting}
			>
				Cancel
			</Button>
			<Button
				variant={agent?.isActive ? 'destructive' : 'default'}
				class="flex-1"
				loading={deactivateSubmitting}
				onclick={handleToggleStatus}
			>
				{agent?.isActive ? 'Deactivate' : 'Activate'}
			</Button>
		</div>
	</div>
</Dialog>

<!-- Custom Tooltip for Submission Activity -->
{#if hoveredDay}
	<div
		class="fixed z-100 pointer-events-none"
		style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px; transform: translate(-50%, -100%);"
	>
		<div class="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg">
			<div class="text-xs font-medium mb-1">
				{new Date(hoveredDay.date).toLocaleDateString('en-US', {
					weekday: 'short',
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})}
			</div>
			<div class="text-sm font-semibold">
				{hoveredDay.count} submission{hoveredDay.count !== 1 ? 's' : ''}
			</div>
			<div class="text-xs text-slate-300 mt-1">
				{hoveredDay.projectName}
			</div>
			<!-- Arrow pointing down -->
			<div class="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full">
				<div class="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-900"></div>
			</div>
		</div>
	</div>
{/if}

<!-- Toast Notification -->
{#if toast}
	<Toast message={toast.message} type={toast.type} onClose={() => (toast = null)} />
{/if}
