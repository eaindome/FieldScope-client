<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import Badge from '$lib/components/ui/badge.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { api } from '$lib/api/client';

	let { children } = $props();

	// Get project ID from URL
	const projectId = $derived(Number($page.params.projectId));
	const currentPath = $derived($page.url.pathname);

	// Project state
	let project = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Load project data
	onMount(() => {
		loadProject();
	});

	async function loadProject() {
		loading = true;
		error = null;

		const response = await api.getProject(projectId);

		if ('error' in response && response.error) {
			error = response.error;
		} else if (response.data) {
			project = response.data;
		}

		loading = false;
	}

	function isActive(href: string) {
		return currentPath.startsWith(href);
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

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="space-y-6">
	<!-- Header with Project Info -->
	<div class="bg-white border border-slate-200 rounded-lg shadow-sm">
		<div class="px-8 py-6">
			<!-- Breadcrumb -->
			<div class="flex items-center gap-2 text-sm text-slate-600 mb-4">
				<a href="/projects" class="hover:text-slate-900 transition-colors">Projects</a>
				<span>{@html icons.ChevronRight(14)}</span>
				<span class="text-slate-900 font-medium">{project?.name || 'Loading...'}</span>
			</div>

			<!-- Project Title and Info -->
			<div class="flex items-start justify-between mb-6">
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-2">
						<h1 class="text-3xl font-bold text-slate-900">{project?.name || 'Loading...'}</h1>
						{#if project}
							<Badge variant={getStatusVariant(project.status)}>
								{getStatusLabel(project.status)}
							</Badge>
						{/if}
					</div>
					{#if project?.description}
						<p class="text-slate-600 max-w-3xl">{project.description}</p>
					{/if}
				</div>
			</div>

			<!-- Project Metadata -->
			{#if project}
				<div class="flex items-center gap-6 text-sm text-slate-600 pb-6 border-b border-slate-200">
					<div class="flex items-center gap-2">
						<span>{@html icons.Calendar(16)}</span>
						<span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
					</div>
					<div class="flex items-center gap-2">
						<span>{@html icons.Clock(16)}</span>
						<span>Created {formatDate(project.createdAt)}</span>
					</div>
				</div>
			{/if}

			<!-- Tab Navigation -->
			<nav class="flex gap-8 -mb-px mt-6">
				<a
					href="/projects/{projectId}/forms"
					class={cn(
						'py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
						isActive(`/projects/${projectId}/forms`)
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
					)}
				>
					<span>{@html icons.ClipboardList(16)}</span>
					<span>Forms</span>
				</a>
				<a
					href="/projects/{projectId}/views"
					class={cn(
						'py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
						isActive(`/projects/${projectId}/views`)
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
					)}
				>
					<span>{@html icons.Eye(16)}</span>
					<span>Views</span>
				</a>
				<a
					href="/projects/{projectId}/dashboards"
					class={cn(
						'py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
						isActive(`/projects/${projectId}/dashboards`)
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
					)}
				>
					<span>{@html icons.Dashboard(16)}</span>
					<span>Dashboards</span>
				</a>
			</nav>
		</div>
	</div>

	<!-- Content Area -->
	<div>
		{@render children()}
	</div>
</div>
