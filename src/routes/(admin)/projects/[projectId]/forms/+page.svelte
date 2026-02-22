<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { api, FormStatus } from '$lib/api/client';

	// Get project ID from URL
	const projectId = $derived(Number($page.params.projectId));

	// State
	let loading = $state(true);
	let forms = $state<any[]>([]);
	let error = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// Delete Dialog
	let deleteDialogOpen = $state(false);
	let formToDelete = $state<any | null>(null);
	let deleteSubmitting = $state(false);

	onMount(() => {
		loadForms();
	});

	async function loadForms() {
		loading = true;
		error = null;

		const { data, error: err } = await api.getProjectForms(projectId);

		if (err) {
			error = err;
			forms = [];
		} else if (data) {
			// Transform API response to match the format used by the UI
			forms = data.map((form: any) => {
				// Handle both string and numeric enum values from API
				const statusStr = typeof form.status === 'string' ? form.status.toLowerCase() :
					form.status === FormStatus.Published ? 'published' :
					form.status === FormStatus.Inactive ? 'inactive' : 'draft';

				const statusEnum = typeof form.status === 'string' ?
					(form.status === 'Published' ? FormStatus.Published :
					 form.status === 'Inactive' ? FormStatus.Inactive : FormStatus.Draft) :
					form.status;

				let parsedMeta: any = {};
				try { parsedMeta = form.metadata ? JSON.parse(form.metadata) : {}; } catch (e) {}

				return {
					id: form.id,
					projectId: form.projectId,
					title: form.name,
					description: parsedMeta.description || '',
					formType: parsedMeta.formType || 'single-page',
					scoringEnabled: parsedMeta.scoringEnabled || false,
					fields: form.schema ? JSON.parse(form.schema).fields || [] : [],
					status: statusEnum, // Normalized to numeric enum
					statusLabel: statusStr, // Lowercase string for display
					createdAt: form.createdAt,
					updatedAt: form.createdAt
				};
			});
		}

		loading = false;
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getStatusVariant(statusLabel: string) {
		return statusLabel === 'published' ? 'success' : statusLabel === 'inactive' ? 'danger' : 'warning';
	}

	function getStatusLabel(statusLabel: string) {
		return statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);
	}

	function createForm() {
		goto(`/projects/${projectId}/forms/new`);
	}

	function editForm(formId: number) {
		goto(`/projects/${projectId}/forms/${formId}`);
	}

	function viewForm(form: any) {
		// Open preview in new tab — the preview page loads from the API directly
		window.open(
			`/projects/${projectId}/forms/${form.id}/preview`,
			'_blank',
			'noopener,noreferrer'
		);
	}

	function openDeleteDialog(form: any) {
		formToDelete = form;
		deleteDialogOpen = true;
	}

	async function handleDeleteForm() {
		if (!formToDelete) return;
		deleteSubmitting = true;
		error = null;

		const { error: err } = await api.deleteForm(formToDelete.id);

		deleteSubmitting = false;

		if (err) {
			toastType = 'error';
			toastMessage = err;
			setTimeout(() => (toastMessage = null), 4000);
		} else {
			deleteDialogOpen = false;
			toastType = 'success';
			toastMessage = 'Form deleted successfully!';
			setTimeout(() => (toastMessage = null), 3000);
			// Reload forms to remove the deleted one
			loadForms();
		}
	}

	async function duplicateForm(form: any) {
		// Create a copy of the form by calling the create endpoint with the same data
		const { error: err } = await api.createForm({
			projectId: form.projectId,
			name: `${form.title} (Copy)`,
			description: form.description,
			schema: { fields: form.fields },
			metadata: {
				description: form.description,
				formType: 'single-page',
				scoringEnabled: false
			}
		});

		if (err) {
			toastType = 'error';
			toastMessage = err;
			setTimeout(() => (toastMessage = null), 4000);
		} else {
			toastType = 'success';
			toastMessage = `"${form.title}" duplicated successfully`;
			setTimeout(() => (toastMessage = null), 3000);
			// Reload forms to show the new duplicate
			loadForms();
		}
	}

	async function publishForm(form: any) {
		const newStatus = form.status === FormStatus.Published ? FormStatus.Draft : FormStatus.Published;
		const { error: err } = await api.updateFormStatus(form.id, newStatus);

		if (err) {
			toastType = 'error';
			toastMessage = err;
			setTimeout(() => (toastMessage = null), 4000);
		} else {
			toastType = 'success';
			const action = newStatus === FormStatus.Published ? 'published' : 'unpublished';
			toastMessage = `Form ${action} successfully!`;
			setTimeout(() => (toastMessage = null), 3000);
			// Reload forms to update status
			loadForms();
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-slate-900">Forms</h2>
			<p class="text-slate-600 mt-1">Create and manage data collection forms</p>
		</div>
		<Button onclick={createForm}>
			<span>{@html icons.Plus(16)}</span>
			<span class="ml-2">Create Form</span>
		</Button>
	</div>


	<!-- Loading State -->
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
								>Form Name</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Fields</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Last Updated</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each [1, 2, 3] as _}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-8 w-32" />
								</td>
								<td class="px-6 py-4">
									<Skeleton class="h-5 w-48" />
									<Skeleton class="h-4 w-32 mt-1" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-16" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-6 w-20" />
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
	{:else if forms.length === 0}
		<!-- Empty State -->
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.ClipboardList(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No forms yet</h3>
				<p class="text-slate-600 mb-6">Create your first form to start collecting data</p>
				<!-- <Button onclick={createForm}>
					<span>{@html icons.Plus(16)}</span>
					<span class="ml-2">Create Form</span>
				</Button> -->
			</div>
		</Card>
	{:else}
		<!-- Forms Table -->
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
								>Form Name</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Fields</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Last Updated</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each forms as form}
							<tr class="hover:bg-slate-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<DropdownMenu align="left">
										{#snippet children({ close }: { close: () => void })}
											<DropdownMenuItem
												icon={icons.Eye(16)}
												onclick={() => {
													viewForm(form);
													close();
												}}
											>
												View Form
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.Edit(16)}
												onclick={() => {
													editForm(form.id);
													close();
												}}
											>
												Edit Form
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.RefreshCw(16)}
												onclick={() => {
													duplicateForm(form);
													close();
												}}
											>
												Duplicate
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={form.status === FormStatus.Published ? icons.FileText(16) : icons.CheckCircle(16)}
												onclick={() => {
													publishForm(form);
													close();
												}}
											>
												{form.status === FormStatus.Published ? 'Unpublish' : 'Publish'}
											</DropdownMenuItem>
											{#if form.scoringEnabled}
												<DropdownMenuItem
													icon={icons.BarChart(16)}
													onclick={() => {
														goto(`/projects/${projectId}/analytics?formId=${form.id}`);
														close();
													}}
												>
													Analytics
												</DropdownMenuItem>
											{/if}
											<DropdownMenuItem
												icon={icons.Trash(16)}
												variant="danger"
												onclick={() => {
													openDeleteDialog(form);
													close();
												}}
											>
												Delete
											</DropdownMenuItem>
										{/snippet}
									</DropdownMenu>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm font-medium text-slate-900">{form.title}</div>
									{#if form.description}
										<div class="text-xs text-slate-500 truncate max-w-xs">{form.description}</div>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Badge variant={getStatusVariant(form.statusLabel)}>
										{getStatusLabel(form.statusLabel)}
									</Badge>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{formatDate(form.updatedAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>

<!-- Delete Dialog -->
<Dialog
	bind:open={deleteDialogOpen}
	onClose={() => (deleteDialogOpen = false)}
	title="Delete Form"
	description="This action cannot be undone"
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Are you sure you want to delete <strong>{formToDelete?.title}</strong>?
		</p>
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
			<p class="text-yellow-800 text-sm font-medium">Warning</p>
			<p class="text-yellow-700 text-sm mt-1">
				This will permanently delete the form and all its associated submissions.
			</p>
		</div>
		<div class="flex gap-3 pt-4">
			<Button
				variant="destructive"
				class="flex-1"
				loading={deleteSubmitting}
				onclick={handleDeleteForm}
			>
				Delete Form
			</Button>
			<Button
				variant="outline"
				class="flex-1"
				onclick={() => (deleteDialogOpen = false)}
				disabled={deleteSubmitting}
			>
				Cancel
			</Button>
		</div>
	</div>
</Dialog>

{#if toastMessage}
	<Toast message={toastMessage} type={toastType} onClose={() => (toastMessage = null)} />
{/if}