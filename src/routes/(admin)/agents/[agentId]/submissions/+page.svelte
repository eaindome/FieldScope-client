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
	import TableFilters from '$lib/components/ui/table-filters.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import { formatDateTime } from '$lib/utils';
	import { icons } from '$lib/components/icons.svelte';

	let agentId = $derived($page.params.agentId);
	let agent = $state<any | null>(null);
	let allSubmissions = $state<any[]>([]);
	let projects = $state<any[]>([]);
	let forms = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filter state
	let searchValue = $state('');
	let selectedProject = $state('All');
	let selectedForm = $state('All');
	let startDate = $state('');
	let endDate = $state('');

	// Pagination state
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	// View Sidebar
	let detailsSidebarOpen = $state(false);
	let formViewOpen = $state(false);
	let selectedSubmission = $state<any | null>(null);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		if (!agentId) {
			error = 'Agent ID is required';
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

		// Load submissions by this agent
		const { data: submissionsData, error: submissionsError } = await api.getUserSubmissions(
			parseInt(agentId),
			{}
		) as { data: any; error: string | null };
		if (submissionsError) {
			error = submissionsError;
		} else {
			const rawSubmissions = submissionsData?.data || submissionsData || [];
			// Parse answers JSON string to object
			allSubmissions = rawSubmissions.map((sub: any) => ({
				...sub,
				answers: typeof sub.answers === 'string' ? JSON.parse(sub.answers) : sub.answers,
				sectionScores: sub.sectionScores && typeof sub.sectionScores === 'string' ? JSON.parse(sub.sectionScores) : sub.sectionScores
			}));
		}

		// Load projects and forms for filters
		const { data: projectsData } = await api.getProjects() as { data: any };
		projects = projectsData?.data || projectsData || [];

		// Load all forms to get field labels
		const uniqueProjectIds = [...new Set(allSubmissions.map((s: any) => s.projectId))];
		for (const projectId of uniqueProjectIds) {
			const { data: formsData } = await api.getProjectForms(projectId);
			if (formsData) {
				forms = [...forms, ...(formsData || [])];
			}
		}

		loading = false;
	}

	const breadcrumbItems = $derived([
		{ label: 'Contributors', href: '/agents' },
		{ label: agent?.email || 'Loading...', href: `/agents/${agentId}` },
		{ label: 'Submissions' }
	]);

	// Client-side filtering
	const filteredSubmissions = $derived.by(() => {
		let filtered = allSubmissions;

		// Filter by project
		if (selectedProject !== 'All') {
			filtered = filtered.filter((sub) => sub.projectId === parseInt(selectedProject));
		}

		// Filter by form
		if (selectedForm !== 'All') {
			filtered = filtered.filter((sub) => sub.formId === parseInt(selectedForm));
		}

		// Filter by date range
		if (startDate) {
			const start = new Date(startDate);
			filtered = filtered.filter((sub) => new Date(sub.createdAt) >= start);
		}
		if (endDate) {
			const end = new Date(endDate);
			filtered = filtered.filter((sub) => new Date(sub.createdAt) <= end);
		}

		// Filter by search (search in answers)
		if (searchValue) {
			const search = searchValue.toLowerCase();
			filtered = filtered.filter((sub) => {
				const answersString = JSON.stringify(sub.answers).toLowerCase();
				return answersString.includes(search);
			});
		}

		return filtered;
	});

	// Paginated data
	const paginatedSubmissions = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredSubmissions.slice(startIndex, endIndex);
	});

	// Reset to page 1 when filters change
	$effect(() => {
		searchValue;
		selectedProject;
		selectedForm;
		startDate;
		endDate;
		currentPage = 1;
	});

	// Get project options for filter
	const projectOptions = $derived([
		{ label: 'All Projects', value: 'All' },
		...projects.map((p) => ({ label: p.name, value: p.id.toString() }))
	]);

	// Get form options for filter based on selected project
	const formOptions = $derived.by(() => {
		// Get unique forms from submissions
		const uniqueForms = new Map();
		allSubmissions.forEach((sub) => {
			if (!uniqueForms.has(sub.formId)) {
				uniqueForms.set(sub.formId, { id: sub.formId, name: sub.formName || `Form ${sub.formId}` });
			}
		});

		return [
			{ label: 'All Forms', value: 'All' },
			...Array.from(uniqueForms.values()).map((f) => ({ label: f.name, value: f.id.toString() }))
		];
	});

	function getProjectName(projectId: number): string {
		const project = projects.find((p) => p.id === projectId);
		return project?.name || `Project ${projectId}`;
	}

	function getFormName(formId: number): string {
		const form = forms.find((f) => f.id === formId);
		return form?.name || `Form ${formId}`;
	}

	function getFieldLabel(formId: number, fieldId: string): string {
		const form = forms.find((f) => f.id === formId);
		if (!form) return fieldId;

		try {
			const schema = JSON.parse(form.schema);
			const field = schema.fields?.find((f: any) => f.id === fieldId);
			return field?.label || fieldId.replace(/field-\d+-/, '').replace(/-/g, ' ');
		} catch {
			return fieldId.replace(/field-\d+-/, '').replace(/-/g, ' ');
		}
	}

	function viewSubmissionDetails(submission: any) {
		selectedSubmission = submission;
		detailsSidebarOpen = true;
	}

	function viewSubmissionForm(submission: any) {
		selectedSubmission = submission;
		formViewOpen = true;
	}

	function backToProfile() {
		goto(`/agents/${agentId}`);
	}

	function getScoreColor(score: number | undefined | null): string {
		if (score == null) return 'text-slate-400';
		if (score >= 80) return 'text-green-600';
		if (score >= 60) return 'text-yellow-600';
		return 'text-red-600';
	}

	function getScoreBgColor(score: number | undefined | null): string {
		if (score == null) return 'bg-slate-100';
		if (score >= 80) return 'bg-green-100';
		if (score >= 60) return 'bg-yellow-100';
		return 'bg-red-100';
	}
</script>

<div class="space-y-6">
	<!-- Breadcrumbs -->
	<Breadcrumbs items={breadcrumbItems} />

	{#if loading}
		<!-- Loading State -->
		<div class="space-y-6">
			<Card class="p-6">
				<Skeleton class="h-24 w-full" />
			</Card>
			<Card class="p-6">
				<Skeleton class="h-96 w-full" />
			</Card>
		</div>
	{:else if error}
		<!-- Error State -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-red-300">
					{@html icons.AlertCircle(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">Error Loading Submissions</h3>
				<p class="text-slate-600 mb-6">{error}</p>
				<Button onclick={backToProfile}>Back to Contributor Profile</Button>
			</div>
		</Card>
	{:else}
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-4xl font-bold text-slate-900">Submissions by {agent?.email}</h1>
				<p class="text-slate-600 mt-2">
					{allSubmissions.length} total submission{allSubmissions.length !== 1 ? 's' : ''}
				</p>
			</div>
			<Button onclick={backToProfile}>
				<span>{@html icons.ArrowLeft(16)}</span>
				<span class="ml-2">Back to Profile</span>
			</Button>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-slate-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-500 uppercase tracking-wide">
								Total Submissions
							</p>
							<p class="text-3xl font-bold text-slate-900 mt-2">{allSubmissions.length}</p>
						</div>
						<div class="p-3 bg-slate-100 rounded-lg">
							{@html icons.FileText(24)}
						</div>
					</div>
				</div>
			</Card>

			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-blue-600 uppercase tracking-wide">Filtered Results</p>
							<p class="text-3xl font-bold text-blue-700 mt-2">{filteredSubmissions.length}</p>
						</div>
						<div class="p-3 bg-blue-100 rounded-lg text-blue-600">
							{@html icons.Filter(24)}
						</div>
					</div>
				</div>
			</Card>

			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-green-600 uppercase tracking-wide">Projects</p>
							<p class="text-3xl font-bold text-green-700 mt-2">
								{new Set(allSubmissions.map((s) => s.projectId)).size}
							</p>
						</div>
						<div class="p-3 bg-green-100 rounded-lg text-green-600">
							{@html icons.Folder(24)}
						</div>
					</div>
				</div>
			</Card>
		</div>

		<!-- Table Filters -->
		<TableFilters
			searchPlaceholder="Search in submission data..."
			bind:searchValue
			statusOptions={projectOptions}
			statusLabel="Project"
			bind:selectedStatus={selectedProject}
			secondaryStatusOptions={formOptions}
			secondaryStatusLabel="Form"
			bind:secondaryStatus={selectedForm}
			dateRangeEnabled={true}
			bind:startDate
			bind:endDate
			totalItems={filteredSubmissions.length}
			bind:currentPage
			bind:itemsPerPage
			collapsible={true}
			defaultCollapsed={true}
		/>

		<!-- Submissions Table -->
		{#if filteredSubmissions.length === 0}
			<Card>
				<div class="p-12 text-center">
					<div class="flex justify-center mb-4 text-slate-300">
						{@html icons.FileText(64)}
					</div>
					<h3 class="text-xl font-semibold text-slate-900 mb-2">No submissions found</h3>
					<p class="text-slate-600">
						{#if searchValue || selectedProject !== 'All' || selectedForm !== 'All' || startDate || endDate}
							No submissions match your current filters
						{:else}
							This contributor hasn't submitted any data yet
						{/if}
					</p>
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
									>Project</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
									>Form</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
									>Score</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
									>Submitted At</th
								>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-slate-200">
							{#each paginatedSubmissions as submission}
								<tr class="hover:bg-slate-50 transition-colors">
									<td class="px-6 py-4 whitespace-nowrap">
										<DropdownMenu align="left">
											{#snippet children({ close }: { close: () => void })}
												<DropdownMenuItem
													icon={icons.Eye(16)}
													onclick={() => {
														viewSubmissionDetails(submission);
														close();
													}}
												>
													View Submission Details
												</DropdownMenuItem>
												<DropdownMenuItem
													icon={icons.FileText(16)}
													onclick={() => {
														viewSubmissionForm(submission);
														close();
													}}
												>
													View Submission Form
												</DropdownMenuItem>
											{/snippet}
										</DropdownMenu>
									</td>
									<td class="px-6 py-4">
										<div class="text-sm text-slate-900">
											{getProjectName(submission.projectId)}
										</div>
									</td>
									<td class="px-6 py-4">
										<div class="text-sm text-slate-900">
											{getFormName(submission.formId)}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if submission.scoreCalculated && submission.overallScore != null}
											<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full {getScoreBgColor(submission.overallScore)}">
												<span class="text-sm font-semibold {getScoreColor(submission.overallScore)}">
													{submission.overallScore.toFixed(1)}
												</span>
												<span class="text-xs {getScoreColor(submission.overallScore)}">
													{#if submission.overallScore >= 80}
														Healthy
													{:else if submission.overallScore >= 60}
														At Risk
													{:else}
														Critical
													{/if}
												</span>
											</div>
										{:else}
											<span class="text-sm text-slate-400">—</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-slate-600">{formatDateTime(submission.createdAt)}</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card>
		{/if}
	{/if}
</div>

<!-- Submission Details Sidebar -->
{#if detailsSidebarOpen}
	<div class="fixed inset-0 z-50 overflow-hidden">
		<!-- Overlay -->
		<button
			type="button"
			class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-all"
			onclick={() => (detailsSidebarOpen = false)}
			aria-label="Close sidebar"
		></button>

		<!-- Sidebar -->
		<div class="absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-xl flex flex-col">
			<!-- Header -->
			<div class="px-6 py-4 border-b border-slate-200">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-slate-900">Submission Details</h2>
					<button
						onclick={() => (detailsSidebarOpen = false)}
						class="text-slate-400 hover:text-slate-600 transition-colors"
					>
						{@html icons.X(20)}
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto px-6 py-4">
				{#if selectedSubmission}
					<div class="space-y-6">
						<!-- Submission Info -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-xs font-medium text-slate-500 uppercase">Project</p>
								<p class="text-sm text-slate-900 mt-1">
									{selectedSubmission.projectName || `Project ${selectedSubmission.projectId}`}
								</p>
							</div>
							<div>
								<p class="text-xs font-medium text-slate-500 uppercase">Form</p>
								<p class="text-sm text-slate-900 mt-1">
									{selectedSubmission.formName || `Form ${selectedSubmission.formId}`}
								</p>
							</div>
							<div>
								<p class="text-xs font-medium text-slate-500 uppercase">Submitted At</p>
								<p class="text-sm text-slate-900 mt-1">
									{formatDateTime(selectedSubmission.createdAt)}
								</p>
							</div>
							<div>
								<p class="text-xs font-medium text-slate-500 uppercase">Synced At</p>
								<p class="text-sm text-slate-900 mt-1">
									{selectedSubmission.syncedAt
										? formatDateTime(selectedSubmission.syncedAt)
										: 'Not synced'}
								</p>
							</div>
						</div>

						<!-- Submission Data -->
						<div class="border-t border-slate-200 pt-4">
							<h4 class="text-sm font-semibold text-slate-900 mb-3">Submission Data</h4>
							<div class="bg-slate-50 rounded-lg p-4 space-y-3">
								{#each Object.entries(selectedSubmission.answers) as [key, value]}
									<div
										class="flex items-start justify-between border-b border-slate-200 pb-2 last:border-0"
									>
										<span class="text-xs font-medium text-slate-700">{getFieldLabel(selectedSubmission.formId, key)}</span>
										<span class="text-sm text-slate-900 text-right max-w-xs wrap-break-words">
											{typeof value === 'object' ? JSON.stringify(value) : value}
										</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>

		</div>
	</div>
{/if}

<!-- Submission Form View Sidebar -->
{#if formViewOpen}
	<div class="fixed inset-0 z-50 overflow-hidden">
		<!-- Overlay -->
		<button
			type="button"
			class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-all"
			onclick={() => (formViewOpen = false)}
			aria-label="Close sidebar"
		></button>

		<!-- Sidebar -->
		<div class="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl flex flex-col">
			<!-- Header -->
			<div class="px-6 py-4 border-b border-slate-200">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-slate-900">Submission Form</h2>
					<button
						onclick={() => (formViewOpen = false)}
						class="text-slate-400 hover:text-slate-600 transition-colors"
					>
						{@html icons.X(20)}
					</button>
				</div>
				{#if selectedSubmission}
					<p class="text-sm text-slate-600 mt-1">
						{selectedSubmission.formName || `Form ${selectedSubmission.formId}`} - Submitted {formatDateTime(
							selectedSubmission.createdAt
						)}
					</p>
				{/if}
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto px-6 py-4">
				{#if selectedSubmission}
					<div class="space-y-6">
						{#each Object.entries(selectedSubmission.answers) as [key, value]}
							<div class="space-y-2">
								<label for={key} class="block text-sm font-medium text-slate-700">
									{getFieldLabel(selectedSubmission.formId, key)}
								</label>
								<div class="relative">
									<input
										id={key}
										type="text"
										value={typeof value === 'object' ? JSON.stringify(value) : value}
										readonly
										class="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 cursor-default select-none"
										style="caret-color: transparent;"
									/>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
