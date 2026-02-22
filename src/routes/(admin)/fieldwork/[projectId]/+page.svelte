<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api, FormStatus } from '$lib/api/client';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import { icons } from '$lib/components/icons.svelte';

	const projectId = $derived(Number($page.params.projectId));

	let loading = $state(true);
	let project = $state<any | null>(null);
	let forms = $state<any[]>([]);
	let error = $state<string | null>(null);

	onMount(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		// Load project details
		const { data: projectData, error: projectError } = await api.getProject(projectId);
		if (projectError) {
			error = projectError;
			loading = false;
			return;
		}
		project = projectData;

		// Load forms
		const { data: formsData, error: formsError } = await api.getProjectForms(projectId);
		if (formsError) {
			error = formsError;
			loading = false;
			return;
		}

		// Filter to only show published forms
		if (formsData) {
			forms = formsData
				.filter((f: any) => f.status === FormStatus.Published || f.status === 'Published')
				.map((form: any) => ({
					id: form.id,
					name: form.name,
					description: form.metadata ? JSON.parse(form.metadata).description : '',
					fields: form.schema ? JSON.parse(form.schema).fields || [] : [],
					createdAt: form.createdAt
				}));
		}

		loading = false;
	}

	function fillForm(formId: number) {
		goto(`/projects/${projectId}/forms/${formId}/fill`);
	}

	function goBack() {
		goto('/fieldwork');
	}
</script>

<div class="space-y-6">
	<!-- Header with Back Button -->
	<div class="flex items-center gap-4">
		<button
			onclick={goBack}
			class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
			title="Back to projects"
		>
			{@html icons.ChevronLeft(20)}
		</button>
		<div class="flex-1">
			{#if loading}
				<Skeleton class="h-8 w-64 mb-2" />
				<Skeleton class="h-4 w-96" />
			{:else if project}
				<h2 class="text-2xl font-bold text-slate-900">{project.name}</h2>
				<p class="text-slate-600 mt-1">Select a form to start collecting data</p>
			{/if}
		</div>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each [1, 2, 3] as _}
				<Card>
					<div class="p-6">
						<Skeleton class="h-6 w-3/4 mb-3" />
						<Skeleton class="h-4 w-full mb-2" />
						<Skeleton class="h-4 w-2/3 mb-4" />
						<Skeleton class="h-10 w-full" />
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
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Error Loading Forms</h3>
				<p class="text-slate-600">{error}</p>
			</div>
		</Card>
	{:else if forms.length === 0}
		<!-- Empty State -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.ClipboardList(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No published forms</h3>
				<p class="text-slate-600">
					There are no published forms in this project yet. Create and publish a form in the
					Projects section.
				</p>
			</div>
		</Card>
	{:else}
		<!-- Forms Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each forms as form}
				<Card class="hover:shadow-lg transition-shadow">
					<div class="p-6">
						<div class="flex items-start gap-4 mb-4">
							<div class="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
								{@html icons.ClipboardList(24)}
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-lg font-semibold text-slate-900 mb-1 truncate">
									{form.name}
								</h3>
								{#if form.description}
									<p class="text-sm text-slate-600 line-clamp-2">{form.description}</p>
								{/if}
							</div>
						</div>

						<div class="flex items-center justify-between mb-4">
							<div class="flex items-center gap-2 text-xs text-slate-500">
								{@html icons.FileText(14)}
								<span>{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}</span>
							</div>
							<Badge variant="success">Published</Badge>
						</div>

						<button
							onclick={() => fillForm(form.id)}
							class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
						>
							{@html icons.Edit(16)}
							<span>Fill Form</span>
						</button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
