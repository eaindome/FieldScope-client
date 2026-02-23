<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Breadcrumbs from '$lib/components/ui/breadcrumbs.svelte';
	import { icons } from '$lib/components/icons.svelte';

	let projectId = $state<number>(0);
	let project = $state<any | null>(null);
	let forms = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		// Get projectId from URL params
		const params = $page.params;
		projectId = parseInt(params.projectId || '0');

		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		// Load project details first
		const { data: projectsData, error: projectsError } = await api.getAgentProjects();
		if (projectsError) {
			error = projectsError;
			loading = false;
			return;
		}

		// Find the specific project
		project = (projectsData || []).find((p: any) => p.id === projectId);
		if (!project) {
			error = 'Project not found or you do not have access';
			loading = false;
			return;
		}

		// Load forms for this project
		const { data: formsData, error: formsError } = await api.getProjectForms(projectId);
		if (formsError) {
			error = formsError;
		} else {
			forms = formsData || [];
		}

		loading = false;
	}

	function openForm(formId: number) {
		goto(`/projects/${projectId}/forms/${formId}`);
	}

	function goBack() {
		goto('/projects');
	}

	function parseSchema(schemaJson: string) {
		try {
			return JSON.parse(schemaJson);
		} catch {
			return { fields: [] };
		}
	}

	function parseMetadata(metadataJson: string | undefined) {
		if (!metadataJson) return { icon: '📋', primaryColor: '#6366f1' };
		try {
			return JSON.parse(metadataJson);
		} catch {
			return { icon: '📋', primaryColor: '#6366f1' };
		}
	}

	function getFieldCount(schemaJson: string): number {
		const schema = parseSchema(schemaJson);
		return schema.fields?.length || 0;
	}

	function getRequiredFieldCount(schemaJson: string): number {
		const schema = parseSchema(schemaJson);
		return schema.fields?.filter((f: any) => f.required)?.length || 0;
	}

	const breadcrumbItems = $derived([
		{ label: 'Projects', href: '/projects' },
		{ label: project?.name || 'Loading...' }
	]);

	function isProjectActive(project: any): boolean {
		const now = new Date();
		const start = new Date(project.startDate);
		const end = new Date(project.endDate);
		return now >= start && now <= end;
	}
</script>

<div class="space-y-6 max-w-7xl mx-auto p-6">
	<!-- Breadcrumbs -->
	<Breadcrumbs items={breadcrumbItems} />

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-slate-900">
				{project?.name || 'Project Forms'}
			</h1>
			{#if project}
				<p class="text-slate-600 mt-2">
					{project.description || 'Select a form to start collecting data'}
				</p>
			{/if}
		</div>
		<Button variant="outline" onclick={goBack} class="gap-2">
			<span>{@html icons.ArrowLeft(16)}</span>
			Back to Projects
		</Button>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each [1, 2, 3] as _}
				<Card class="hover:shadow-md transition-shadow">
					<div class="p-6 space-y-4">
						<div class="flex items-start gap-4">
							<Skeleton class="h-12 w-12 rounded-lg" />
							<div class="flex-1 space-y-2">
								<Skeleton class="h-5 w-3/4" />
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-2/3" />
							</div>
						</div>
						<Skeleton class="h-10 w-full" />
					</div>
				</Card>
			{/each}
		</div>
	{:else if error}
		<!-- Error State -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-red-400">
					{@html icons.AlertCircle(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">Error Loading Forms</h3>
				<p class="text-slate-600 mb-6">{error}</p>
				<div class="flex items-center justify-center gap-3">
					<Button onclick={loadData}>Try Again</Button>
					<Button variant="outline" onclick={goBack}>Back to Projects</Button>
				</div>
			</div>
		</Card>
	{:else if !project}
		<!-- Project Not Found -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Briefcase(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">Project Not Found</h3>
				<p class="text-slate-600 mb-6">
					This project does not exist or you do not have access to it
				</p>
				<Button onclick={goBack}>Back to Projects</Button>
			</div>
		</Card>
	{:else if !isProjectActive(project)}
		<!-- Project Not Active -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-orange-400">
					{@html icons.Lock(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">Project Not Active</h3>
				<p class="text-slate-600 mb-6">
					This project is not currently active. Forms can only be filled during the project period.
				</p>
				<div class="bg-slate-50 rounded-lg p-4 mt-4 text-sm">
					<p class="text-slate-700">
						<span class="font-medium">Start Date:</span>
						{new Date(project.startDate).toLocaleDateString()}
					</p>
					<p class="text-slate-700 mt-1">
						<span class="font-medium">End Date:</span>
						{new Date(project.endDate).toLocaleDateString()}
					</p>
				</div>
				<Button onclick={goBack} class="mt-6">Back to Projects</Button>
			</div>
		</Card>
	{:else if forms.length === 0}
		<!-- No Forms -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.FileText(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No Forms Available</h3>
				<p class="text-slate-600 mb-6">
					There are no active forms for this project yet. Check back later or contact your
					administrator.
				</p>
				<Button onclick={goBack}>Back to Projects</Button>
			</div>
		</Card>
	{:else}
		<!-- Forms Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each forms as form}
				{@const schema = parseSchema(form.schema)}
				{@const metadata = parseMetadata(form.metadata)}
				{@const fieldCount = getFieldCount(form.schema)}
				{@const requiredCount = getRequiredFieldCount(form.schema)}

				<Card class="hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
					<button
						type="button"
						onclick={() => openForm(form.id)}
						class="w-full text-left p-6 space-y-4"
					>
						<!-- Form Header -->
						<div class="flex items-start gap-4">
							<!-- Form Icon -->
							<div
								class="h-14 w-14 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110"
								style="background-color: {metadata.primaryColor}20; color: {metadata.primaryColor}"
							>
								{metadata.icon}
							</div>

							<!-- Form Info -->
							<div class="flex-1 min-w-0">
								<h3 class="text-lg font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
									{form.name}
								</h3>
								<div class="flex items-center gap-2 text-sm text-slate-600">
									<span>{fieldCount} field{fieldCount !== 1 ? 's' : ''}</span>
									<span class="text-slate-400">•</span>
									<span>{requiredCount} required</span>
								</div>
								<div class="mt-2">
									<Badge variant="success" class="text-xs">Active</Badge>
								</div>
							</div>
						</div>

						<!-- Form Description (if available in schema) -->
						{#if schema.description}
							<p class="text-sm text-slate-600 line-clamp-2">
								{schema.description}
							</p>
						{/if}

						<!-- Field Preview -->
						<div class="border-t border-slate-100 pt-4 space-y-2">
							<p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Field Types</p>
							<div class="flex flex-wrap gap-1.5">
								{#each schema.fields?.slice(0, 5) || [] as field}
									<span
										class="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium"
									>
										{field.type}
									</span>
								{/each}
								{#if schema.fields?.length > 5}
									<span class="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">
										+{schema.fields.length - 5} more
									</span>
								{/if}
							</div>
						</div>

						<!-- Action Indicator -->
						<div class="flex items-center justify-between pt-2">
							<span class="text-sm text-blue-600 font-medium group-hover:text-blue-700">
								Fill Form
							</span>
							<span class="text-blue-600 group-hover:translate-x-1 transition-transform">
								{@html icons.ChevronRight(20)}
							</span>
						</div>
					</button>
				</Card>
			{/each}
		</div>

		<!-- Footer Actions -->
		<Card class="mt-6">
			<div class="p-4 flex items-center justify-between">
				<div class="text-sm text-slate-600">
					<span class="font-medium text-slate-900">{forms.length}</span>
					form{forms.length !== 1 ? 's' : ''} available for this project
				</div>
				<Button variant="outline" onclick={() => goto(`/projects/${projectId}/submissions`)}>
					<span>{@html icons.FileText(16)}</span>
					<span class="ml-2">View Submissions</span>
				</Button>
			</div>
		</Card>
	{/if}
</div>
