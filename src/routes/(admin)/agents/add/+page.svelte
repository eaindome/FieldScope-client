<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Breadcrumbs from '$lib/components/ui/breadcrumbs.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { icons } from '$lib/components/icons.svelte';

	let email = $state('');
	let projectIds = $state<number[]>([]);
	let submitting = $state(false);
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	// Projects for assignment
	let projects = $state<any[]>([]);
	let loadingProjects = $state(true);

	// Only show active projects for assignment
	const activeProjects = $derived(projects.filter((p) => p.status?.toLowerCase() === 'active'));

	// Email validation
	const isValidEmail = $derived.by(() => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return email.trim() !== '' && emailRegex.test(email.trim());
	});

	const breadcrumbItems = [
		{ label: 'Contributors', href: '/agents' },
		{ label: 'Invite Contributor' }
	];

	onMount(async () => {
		// Load available projects
		const { data, error: err } = await api.getProjects();
		if (!err) {
			projects = Array.isArray(data) ? data : [];
		}
		loadingProjects = false;
	});

	async function handleInvite(e: Event) {
		e.preventDefault();
		submitting = true;

		const response = await api.createInvitation({
			email,
			role: 'Agent',
			projectIds: projectIds.length > 0 ? projectIds : undefined
		});

		submitting = false;

		if ('error' in response && response.error) {
			toast = { message: response.error, type: 'error' };
		} else if ('data' in response && response.data) {
			const invitedEmail = email;
			toast = {
				message: `Invitation sent successfully to ${invitedEmail}!`,
				type: 'success'
			};
			// Reset form
			email = '';
			projectIds = [];
		}

		// Auto-hide toast after 5 seconds
		setTimeout(() => {
			toast = null;
		}, 5000);
	}

	function toggleProject(projectId: number) {
		if (projectIds.includes(projectId)) {
			projectIds = projectIds.filter((id) => id !== projectId);
		} else {
			projectIds = [...projectIds, projectId];
		}
	}

	function goBack() {
		goto('/agents');
	}
</script>

<div class="space-y-6">
	<!-- Breadcrumbs -->
	<Breadcrumbs items={breadcrumbItems} />

	<!-- Header -->
	<div>
		<h1 class="text-4xl font-bold text-slate-900">Invite Field Contributor</h1>
		<p class="text-slate-600 mt-2">Send an invitation to a field contributor to join your organization</p>
	</div>

	<!-- Invitation Form -->
	<form onsubmit={handleInvite}>
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Left Column: Form -->
				<div class="lg:col-span-2 space-y-6">
					<Card>
						<div class="p-6 space-y-6">
							<div>
								<h3 class="text-lg font-semibold text-slate-900 mb-4">Contributor Information</h3>

								<div class="space-y-4">
									<div>
										<Label for="email">Email Address *</Label>
										<Input
											id="email"
											type="email"
											bind:value={email}
											placeholder="agent@example.com"
											required
											disabled={submitting}
											class="mt-1"
										/>
										<p class="text-xs text-slate-500 mt-1">
											The contributor will receive an invitation email to complete their registration
										</p>
									</div>
								</div>
							</div>
						</div>
					</Card>

					<!-- Project Assignment -->
					<Card>
						<div class="p-6 space-y-4">
							<div>
								<h3 class="text-lg font-semibold text-slate-900">Assign to Projects</h3>
								<p class="text-sm text-slate-600 mt-1">
									Optional: Select projects this contributor will have access to
								</p>
							</div>

							{#if loadingProjects}
								<div class="space-y-2">
									{#each [1, 2, 3] as _}
										<div class="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
									{/each}
								</div>
							{:else if activeProjects.length === 0}
								<div class="text-center py-8 text-slate-500">
									<p class="text-sm">No active projects available</p>
									<p class="text-xs mt-1">Only active projects can be assigned to contributors</p>
								</div>
							{:else}
								<div class="space-y-2 max-h-64 overflow-y-auto">
									{#each activeProjects as project}
										<label
											class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
										>
											<input
												type="checkbox"
												checked={projectIds.includes(project.id)}
												onchange={() => toggleProject(project.id)}
												disabled={submitting}
												class="rounded text-blue-600"
											/>
											<div class="flex-1 min-w-0">
												<div class="text-sm font-medium text-slate-900 truncate">
													{project.name}
												</div>
												{#if project.description}
													<div class="text-xs text-slate-500 truncate">
														{project.description}
													</div>
												{/if}
											</div>
											<Badge variant={project.status === 'Active' ? 'success' : 'default'}>
												{project.status}
											</Badge>
										</label>
									{/each}
								</div>
								{#if projectIds.length > 0}
									<div class="text-sm text-slate-600 pt-2">
										Selected: {projectIds.length} project{projectIds.length !== 1 ? 's' : ''}
									</div>
								{/if}
							{/if}
						</div>
					</Card>
				</div>

				<!-- Right Column: Help & Actions -->
				<div class="space-y-6">
					<!-- Information Card -->
					<Card>
						<div class="p-6 space-y-4">
							<div class="flex items-start gap-3">
								<div
									class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"
								>
									<span class="text-blue-600">{@html icons.Info(20)}</span>
								</div>
								<div>
									<h4 class="text-sm font-semibold text-slate-900">What happens next?</h4>
									<ul class="text-xs text-slate-600 mt-2 space-y-2">
										<li class="flex items-start gap-2">
											<span class="text-blue-600 mt-0.5">•</span>
											<span>Contributor receives invitation email</span>
										</li>
										<li class="flex items-start gap-2">
											<span class="text-blue-600 mt-0.5">•</span>
											<span>They click the link to accept</span>
										</li>
										<li class="flex items-start gap-2">
											<span class="text-blue-600 mt-0.5">•</span>
											<span>Complete registration with password</span>
										</li>
										<li class="flex items-start gap-2">
											<span class="text-blue-600 mt-0.5">•</span>
											<span>Start collecting data immediately</span>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</Card>

					<!-- Actions -->
					<Card>
						<div class="p-6 space-y-3">
							<Button type="submit" class="w-full" loading={submitting} disabled={!isValidEmail || submitting}>
								Send Invitation
							</Button>
							<Button
								type="button"
								variant="outline"
								class="w-full"
								onclick={goBack}
								disabled={submitting}
							>
								Cancel
							</Button>
						</div>
					</Card>

					<!-- Bulk Upload Hint -->
					<Card>
						<div class="p-4 bg-slate-50 rounded-lg">
							<p class="text-sm font-medium text-slate-900">Need to invite multiple contributors?</p>
							<p class="text-xs text-slate-600 mt-1">
								Use the bulk upload feature to invite many contributors at once.
							</p>
							<Button
								variant="outline"
								size="sm"
								class="w-full mt-3"
								onclick={() => goto('/agents/bulk-upload')}
							>
								Go to Bulk Upload
							</Button>
						</div>
					</Card>
				</div>
			</div>
		</form>
</div>

<!-- Toast Notification -->
{#if toast}
	<Toast message={toast.message} type={toast.type} onClose={() => (toast = null)} />
{/if}
