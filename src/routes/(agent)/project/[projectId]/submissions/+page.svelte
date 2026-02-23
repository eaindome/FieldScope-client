<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api } from '$lib/api/client';
	import { getSubmissionsByProject, network } from '$lib/offline';
	import type { LocalSubmission } from '$lib/offline';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Textarea from '$lib/components/ui/textarea.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { formatDateTime } from '$lib/utils';

	const projectId = Number($page.params.projectId);

	let project = $state<any | null>(null);
	let forms = $state<any[]>([]);
	let submissions = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showFormSelector = $state(false);
	let selectedSubmission = $state<any | null>(null);
	let detailDialogOpen = $state(false);
	let selectedFormSchema = $state<any | null>(null);

	onMount(async () => {
		await loadData();
	});

	// ─── Normalise a LocalSubmission (IDB) into the shape the UI expects ─────────
	function normalizeLocalSubmissions(localSubs: LocalSubmission[]) {
		return localSubs.flatMap((sub) =>
			sub.responses.map((resp) => ({
				id: sub.remoteId ?? (sub.localId as any),
				projectId: sub.projectId,
				formId: resp.formId,
				answers: resp.answers,
				localSyncId: sub.localId,
				createdAt: sub.createdAt,
				syncedAt: sub.syncedAt,
				syncStatus: sub.syncStatus,
				isLocalOnly: !sub.remoteId
			}))
		);
	}

	async function loadData() {
		loading = true;
		error = null;

		// Load project details — getAgentProjects() uses IDB cache when offline
		const { data: projectsData, error: projectsError } = await api.getAgentProjects();
		if (projectsError) {
			error = projectsError;
			loading = false;
			return;
		}

		project = (projectsData || []).find((p: any) => p.id === projectId);
		if (!project) {
			error = 'Project not found or you do not have access';
			loading = false;
			return;
		}

		// Load forms for this project — getProjectForms() uses IDB cache when offline
		const { data: formsData, error: formsError } = await api.getProjectForms(projectId);
		if (formsError) {
			error = formsError;
			loading = false;
			return;
		}
		// Filter published forms: handle both string 'Published' and numeric 1 (FormStatus.Published)
		const allForms = formsData || [];
		forms = allForms.filter((f: any) => f.status === 'Published' || f.status === 1);

		// Load submissions ─────────────────────────────────────────────────────────
		if (network.online) {
			// Online: try server, merge local pending submissions on top
			const result = await api.getProjectSubmissions(projectId);
			if ('error' in result && result.error) {
				// API failed despite being online — fall back to IDB
				const localSubs = await getSubmissionsByProject(projectId);
				submissions = normalizeLocalSubmissions(localSubs);
			} else if ('data' in result) {
				const rawSubmissions = result.data || [];
				const serverSubs = rawSubmissions.map((sub: any) => ({
					...sub,
					answers: typeof sub.answers === 'string' ? JSON.parse(sub.answers) : sub.answers,
					sectionScores:
						sub.sectionScores && typeof sub.sectionScores === 'string'
							? JSON.parse(sub.sectionScores)
							: sub.sectionScores
				}));

				// Merge any local submissions that are still pending / errored
				const localSubs = await getSubmissionsByProject(projectId);
				const pendingLocal = localSubs
					.filter((s) => s.syncStatus === 'pending' || s.syncStatus === 'error')
					.flatMap((sub) =>
						sub.responses.map((resp) => ({
							id: sub.localId as any,
							projectId: sub.projectId,
							formId: resp.formId,
							answers: resp.answers,
							localSyncId: sub.localId,
							createdAt: sub.createdAt,
							syncedAt: undefined,
							syncStatus: sub.syncStatus,
							isLocalOnly: true
						}))
					);

				submissions = [...pendingLocal, ...serverSubs];
			}
		} else {
			// Offline: read entirely from IndexedDB
			const localSubs = await getSubmissionsByProject(projectId);
			submissions = normalizeLocalSubmissions(localSubs);
		}

		loading = false;
	}

	function handleAddSubmission() {
		if (forms.length === 0) {
			error = 'No forms available for this project';
			return;
		}

		if (forms.length === 1) {
			// Single form - go directly to form filling
			goto(`/project/${projectId}/forms/${forms[0].id}`);
		} else {
			// Multiple forms - show selector
			showFormSelector = true;
		}
	}

	function selectForm(formId: number) {
		showFormSelector = false;
		goto(`/project/${projectId}/forms/${formId}`);
	}

	function goBack() {
		goto('/project');
	}

	function viewSubmissionDetails(submission: any) {
		selectedSubmission = submission;

		// Load form schema
		const form = forms.find(f => f.id === submission.formId);
		if (form) {
			try {
				selectedFormSchema = JSON.parse(form.schema);
			} catch (e) {
				selectedFormSchema = null;
			}
		}

		detailDialogOpen = true;
	}

	function editSubmission(submission: any) {
		// Navigate to the form page with the submission data
		goto(`/project/${projectId}/forms/${submission.formId}?submissionId=${submission.id}`);
	}

	function getFormName(formId: number): string {
		const form = forms.find((f) => f.id === formId);
		return form?.name || 'Unknown Form';
	}

	function getFieldLabel(formId: number, fieldId: string): string {
		const form = forms.find((f) => f.id === formId);
		if (!form) return fieldId;

		try {
			const schema = JSON.parse(form.schema);
			const field = schema.fields?.find((f: any) => f.id === fieldId);
			return field?.label || fieldId.replace(/_/g, ' ');
		} catch {
			return fieldId.replace(/_/g, ' ');
		}
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

	function formatShortDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		// Format as MMM DD
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function isProjectEnded(): boolean {
		if (!project) return false;
		const now = new Date();
		const endDate = new Date(project.endDate);
		return now > endDate;
	}
</script>

<div class="min-h-screen bg-slate-50 pb-24">
	<!-- Mobile Header -->
	<div class="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
		<div class="flex items-center gap-3 p-4">
			<button
				onclick={goBack}
				class="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors active:bg-slate-200"
			>
				<span class="text-slate-700">{@html icons.ArrowLeft(24)}</span>
			</button>
			<div class="flex-1 min-w-0">
				{#if loading}
					<Skeleton class="h-6 w-48" />
				{:else if project}
					<h1 class="text-lg font-bold text-slate-900 truncate">{project.name}</h1>
					<p class="text-xs text-slate-500">
						{submissions.length} submission{submissions.length !== 1 ? 's' : ''}
					</p>
				{/if}
			</div>
		</div>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="p-4 space-y-3">
			{#each [1, 2, 3] as _}
				<Card class="p-4">
					<Skeleton class="h-24 w-full" />
				</Card>
			{/each}
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="p-4">
			<Card class="p-8">
				<div class="text-center">
					<div class="flex justify-center mb-4 text-red-300">
						{@html icons.AlertCircle(48)}
					</div>
					<h3 class="text-lg font-semibold text-slate-900 mb-2">Error</h3>
					<p class="text-sm text-slate-600 mb-4">{error}</p>
					<Button onclick={loadData} size="sm">Try Again</Button>
				</div>
			</Card>
		</div>
	{:else if submissions.length === 0}
		<!-- Empty State -->
		<div class="flex items-center justify-center p-6" style="min-height: calc(100vh - 200px);">
			<div class="text-center max-w-sm">
				<div class="flex justify-center mb-6 text-slate-300">
					{@html icons.FileText(80)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-3">No Submissions Yet</h3>
				<p class="text-slate-600 mb-8">
					Start collecting data by adding your first submission to this project.
				</p>
				<Button onclick={handleAddSubmission} class="w-full py-6 text-base gap-3">
					<span>{@html icons.Plus(20)}</span>
					<span>Add First Submission</span>
				</Button>
			</div>
		</div>
	{:else}
		<!-- Submissions List -->
		<div class="p-4 space-y-3">
			{#each submissions as submission}
				<Card class="hover:shadow-md transition-shadow active:shadow-lg">
					<button
						type="button"
						onclick={() => viewSubmissionDetails(submission)}
						class="w-full text-left p-4"
					>
						<div class="flex items-start justify-between mb-3">
							<div class="flex-1 min-w-0">
								<h3 class="font-medium text-slate-900 text-sm mb-1">
									{getFormName(submission.formId)}
								</h3>
								<p class="text-xs text-slate-500">
									{formatDateTime(submission.createdAt)}
								</p>
							</div>
							{#if submission.syncedAt}
								<Badge variant="success" class="shrink-0 text-xs">
									<span>{@html icons.CheckCircle(12)}</span>
								<span class="ml-1">Synced</span>
							</Badge>
						{:else if submission.syncStatus === 'error'}
							<Badge variant="danger" class="shrink-0 text-xs">
								<span>{@html icons.AlertCircle(12)}</span>
								<span class="ml-1">Sync Error</span>
								</Badge>
							{:else}
								<Badge variant="warning" class="shrink-0 text-xs">
									<span>{@html icons.Clock(12)}</span>
									<span class="ml-1">Pending</span>
								</Badge>
							{/if}
						</div>

						<!-- Score (if available) -->
						{#if submission.scoreCalculated && submission.overallScore != null}
							<div class="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full {getScoreBgColor(submission.overallScore)}">
								<span class="text-sm font-bold {getScoreColor(submission.overallScore)}">
									{submission.overallScore.toFixed(1)}
								</span>
								<span class="text-xs {getScoreColor(submission.overallScore)}">
									{#if submission.overallScore >= 80}
										🟢 Healthy
									{:else if submission.overallScore >= 60}
										🟡 At Risk
									{:else}
										🔴 Critical
									{/if}
								</span>
							</div>
						{/if}

						<!-- Preview of answers (only first 2 fields) -->
						<div class="space-y-1.5">
							{#each Object.entries(submission.answers).slice(0, 2) as [key, value]}
								<div class="flex gap-2 text-xs">
									<span class="text-slate-500">{getFieldLabel(submission.formId, key)}:</span>
									<span class="text-slate-700 font-medium truncate">{value}</span>
								</div>
							{/each}
							{#if Object.keys(submission.answers).length > 2}
								<p class="text-xs text-slate-400 mt-2">
									+{Object.keys(submission.answers).length - 2} more fields
								</p>
							{/if}
						</div>

						<!-- Chevron arrow -->
						<div class="flex justify-end mt-3">
							<span class="text-slate-400">{@html icons.ChevronRight(16)}</span>
						</div>
					</button>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- Floating Action Button (only show if there are submissions) -->
{#if !loading && !error && submissions.length > 0}
	<button
		onclick={handleAddSubmission}
		class="fixed bottom-24 lg:bottom-6 right-6 h-16 w-16 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all hover:shadow-xl active:scale-95 flex items-center justify-center z-50"
	>
		{@html icons.Plus(28)}
	</button>
{/if}

<!-- Form Selector Dialog -->
{#if showFormSelector}
	<Dialog open={showFormSelector} onClose={() => (showFormSelector = false)}>
		<div class="p-6">
			<div class="flex items-center justify-between mb-2">
				<h2 class="text-xl font-bold text-slate-900">Select a Form</h2>
				<button
					onclick={() => (showFormSelector = false)}
					class="p-2 -mr-2 hover:bg-slate-100 rounded-lg transition-colors"
				>
					<span class="text-slate-500">{@html icons.X(20)}</span>
				</button>
			</div>
			<p class="text-sm text-slate-600 mb-6">Choose which form you want to fill out:</p>

			<div class="space-y-3">
				{#each forms as form}
					<button
						onclick={() => selectForm(form.id)}
						class="w-full p-4 text-left border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all active:bg-blue-100"
					>
						<div class="flex items-center gap-3">
							<div
								class="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"
							>
								{@html icons.FileText(20)}
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-medium text-slate-900 text-sm">{form.name}</h3>
								<p class="text-xs text-slate-500 mt-0.5">Version {form.version}</p>
							</div>
							<span class="text-slate-400">{@html icons.ChevronRight(20)}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</Dialog>
{/if}

<!-- Submission Detail Dialog -->
{#if detailDialogOpen && selectedSubmission}
	<Dialog open={detailDialogOpen} onClose={() => (detailDialogOpen = false)} width="xl">
		<div class="flex flex-col h-full max-h-[80vh] -mx-6 -my-6">
			<!-- Header with close icon -->
			<div class="flex items-center justify-between mb-4 px-6 pt-6">
				<h2 class="text-xl font-bold text-slate-900">
					{getFormName(selectedSubmission.formId)}
				</h2>
				<button
					onclick={() => (detailDialogOpen = false)}
					class="p-2 -mr-2 hover:bg-slate-100 rounded-lg transition-colors"
				>
					<span class="text-slate-500">{@html icons.X(20)}</span>
				</button>
			</div>

			<!-- Meta Info -->
			<div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg mb-4 mx-6">
				<div>
					<p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Submitted</p>
					<p class="text-sm text-slate-900 mt-1">
						{formatShortDate(selectedSubmission.createdAt)}
					</p>
				</div>
				{#if selectedSubmission.syncedAt}
					<div>
						<p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Saved</p>
						<p class="text-sm text-slate-900 mt-1">
							{formatShortDate(selectedSubmission.syncedAt)}
						</p>
					</div>
				{:else}
					<div>
						<p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</p>
						<Badge variant="warning" class="mt-1">Pending</Badge>
					</div>
				{/if}
			</div>

			<!-- View Mode -->
				<div class="flex-1 overflow-y-auto px-6 dialog-content">
					<div class="space-y-4 pb-4">
						<h4 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">
							Form Responses
						</h4>
						<div class="space-y-3">
							{#if selectedFormSchema?.fields}
								{#each selectedFormSchema.fields as field}
									<div class="space-y-1">
										<Label for="view_{field.id}" class="text-sm font-medium">
											{field.label}
										</Label>

										{#if field.type === 'text'}
											<Input
												id="view_{field.id}"
												value={selectedSubmission.answers[field.id] || ''}
												readonly
												class="cursor-default bg-slate-50 pointer-events-none"
											/>
										{:else if field.type === 'textarea'}
											<Textarea
												id="view_{field.id}"
												value={selectedSubmission.answers[field.id] || ''}
												readonly
												rows={4}
												class="cursor-default bg-slate-50 pointer-events-none"
											/>
										{:else if field.type === 'number'}
											<Input
												id="view_{field.id}"
												type="number"
												value={selectedSubmission.answers[field.id] || ''}
												readonly
												class="cursor-default bg-slate-50 pointer-events-none"
											/>
										{:else if field.type === 'email'}
											<Input
												id="view_{field.id}"
												type="email"
												value={selectedSubmission.answers[field.id] || ''}
												readonly
												class="cursor-default bg-slate-50 pointer-events-none"
											/>
										{:else if field.type === 'select' || field.type === 'radio'}
											<Input
												id="view_{field.id}"
												value={selectedSubmission.answers[field.id] || ''}
												readonly
												class="cursor-default bg-slate-50 pointer-events-none"
											/>
										{:else if field.type === 'boolean'}
											<label class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-default pointer-events-none">
												<input
													type="checkbox"
													id="view_{field.id}"
													checked={selectedSubmission.answers[field.id]}
													disabled
													class="h-5 w-5 rounded border-slate-300"
												/>
												<span class="text-sm text-slate-700">
													{field.checkboxLabel || 'Yes'}
												</span>
											</label>
										{:else if field.type === 'datetime' || field.type === 'date'}
											<Input
												id="view_{field.id}"
												value={selectedSubmission.answers[field.id] || ''}
												readonly
												class="cursor-default bg-slate-50 pointer-events-none"
											/>
										{:else}
											<Input
												id="view_{field.id}"
												value={selectedSubmission.answers[field.id] || ''}
												readonly
												class="cursor-default bg-slate-50 pointer-events-none"
											/>
										{/if}
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>

			{#if !isProjectEnded()}
				<!-- Edit Button - Fixed at bottom -->
				<div class="px-6 py-4 border-t border-slate-100 bg-white">
					<Button onclick={() => editSubmission(selectedSubmission)} class="w-full">
						Edit
					</Button>
				</div>
			{/if}
		</div>
	</Dialog>
{/if}
