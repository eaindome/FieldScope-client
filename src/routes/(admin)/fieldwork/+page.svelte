<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Card from '$lib/components/ui/card.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import { icons } from '$lib/components/icons.svelte';

	let loading = $state(true);
	let projects = $state<any[]>([]);
	let error = $state<string | null>(null);

	onMount(() => {
		loadProjects();
	});

	async function loadProjects() {
		loading = true;
		error = null;

		const { data, error: err } = await api.getProjects();

		if (err) {
			error = err;
			projects = [];
		} else if (data) {
			projects = data;
		}

		loading = false;
	}

	function selectProject(projectId: number) {
		goto(`/fieldwork/${projectId}`);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h2 class="text-2xl font-bold text-slate-900">Field Work</h2>
		<p class="text-slate-600 mt-1">Select a project to start collecting data</p>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each [1, 2, 3] as _}
				<Card>
					<div class="p-6">
						<Skeleton class="h-6 w-3/4 mb-3" />
						<Skeleton class="h-4 w-full mb-2" />
						<Skeleton class="h-4 w-2/3" />
					</div>
				</Card>
			{/each}
		</div>
	{:else if error}
		<!-- Error State -->
		<Card>
			<div class="p-8 text-center">
				<div class="flex justify-center mb-4 text-red-500">
					{@html icons.AlertCircle(48)}
				</div>
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Error Loading Projects</h3>
				<p class="text-slate-600">{error}</p>
			</div>
		</Card>
	{:else if projects.length === 0}
		<!-- Empty State -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Folder(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No projects available</h3>
				<p class="text-slate-600">Create a project first to start collecting data</p>
			</div>
		</Card>
	{:else}
		<!-- Projects Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each projects as project}
				<Card class="hover:shadow-lg transition-shadow cursor-pointer" onclick={() => selectProject(project.id)}>
					<div class="p-6">
						<div class="flex items-start gap-4">
							<div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
								{@html icons.Folder(24)}
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-lg font-semibold text-slate-900 mb-1 truncate">
									{project.name}
								</h3>
								{#if project.description}
									<p class="text-sm text-slate-600 line-clamp-2">{project.description}</p>
								{/if}
								<div class="flex items-center gap-2 mt-3 text-xs text-slate-500">
									{@html icons.Calendar(14)}
									<span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
								</div>
							</div>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
