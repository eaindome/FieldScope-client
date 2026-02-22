<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Breadcrumbs from '$lib/components/ui/breadcrumbs.svelte';
	import { icons } from '$lib/components/icons.svelte';

	let fileInput = $state<HTMLInputElement | null>(null);
	let file = $state<File | null>(null);
	let parsedEmails = $state<string[]>([]);
	let projectIds = $state<number[]>([]);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let uploadResults = $state<{
		successful: number;
		failed: number;
		results: any[];
	} | null>(null);

	// Projects for assignment
	let projects = $state<any[]>([]);
	let loadingProjects = $state(true);

	const breadcrumbItems = [
		{ label: 'Contributors', href: '/agents' },
		{ label: 'Bulk Upload' }
	];

	onMount(async () => {
		// Load available projects
		const { data, error: err } = await api.getProjects();
		if (!err) {
			projects = (data as any[]) || [];
		}
		loadingProjects = false;
	});

	// Only show active projects for assignment
	const activeProjects = $derived(projects.filter((p) => p.status?.toLowerCase() === 'active'));

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const selectedFile = target.files?.[0];
		if (!selectedFile) return;

		file = selectedFile;
		error = null;
		parseFile(selectedFile);
	}

	async function parseFile(file: File) {
		try {
			const text = await file.text();
			const lines = text.split('\n').filter((line) => line.trim());
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

			// Parse CSV (simple parsing - assumes email is first column or only column)
			const emails: string[] = [];
			for (const line of lines) {
				// Skip header row if it contains common header text
				if (line.toLowerCase().includes('email') || line.toLowerCase().includes('address')) {
					continue;
				}

				// Split by comma and get first column
				const parts = line.split(',');
				const email = parts[0].trim().replace(/["']/g, ''); // Remove quotes

				// Proper email validation
				if (email && emailRegex.test(email)) {
					emails.push(email);
				}
			}

			if (emails.length === 0) {
				error = 'No valid emails found in file';
				parsedEmails = [];
			} else {
				parsedEmails = emails;
			}
		} catch (err) {
			error = 'Failed to parse file. Please ensure it\'s a valid CSV file.';
			parsedEmails = [];
		}
	}

	function removeEmail(index: number) {
		parsedEmails = parsedEmails.filter((_, i) => i !== index);
	}

	function toggleProject(projectId: number) {
		if (projectIds.includes(projectId)) {
			projectIds = projectIds.filter((id) => id !== projectId);
		} else {
			projectIds = [...projectIds, projectId];
		}
	}

	async function handleUpload() {
		if (parsedEmails.length === 0) {
			error = 'No emails to upload';
			return;
		}

		submitting = true;
		error = null;

		const { data, error: err } = await api.bulkInviteAgents({
			emails: parsedEmails,
			role: 'Agent',
			projectIds: projectIds.length > 0 ? projectIds : undefined
		});

		if (err) {
			error = err;
		} else if (data) {
			// Transform the results to match the expected format
			uploadResults = {
				successful: data.successCount,
				failed: data.failureCount,
				results: data.results.map((r) => ({
					email: r.email,
					success: r.status === 'success',
					token: r.token,
					expiresAt: r.status === 'success' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
					error: r.status !== 'success' ? r.message : undefined
				}))
			};
		}
		submitting = false;
	}

	function reset() {
		file = null;
		parsedEmails = [];
		projectIds = [];
		uploadResults = null;
		error = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function goBack() {
		goto('/agents');
	}

	function downloadTemplate() {
		// Create CSV template
		const csv = 'email\nagent1@example.com\nagent2@example.com\nagent3@example.com';
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'agent-template.csv';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="space-y-6">
	<!-- Breadcrumbs -->
	<Breadcrumbs items={breadcrumbItems} />

	<!-- Header -->
	<div>
		<h1 class="text-4xl font-bold text-slate-900">Bulk Upload Contributors</h1>
		<p class="text-slate-600 mt-2">Upload multiple contributor invitations at once via CSV file</p>
	</div>

	<!-- Results View -->
	{#if uploadResults}
		<Card>
			<div class="p-8 space-y-6">
				<!-- Summary -->
				<div class="flex items-center gap-4">
					<div
						class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0"
					>
						<span class="text-green-600">{@html icons.Check(24)}</span>
					</div>
					<div class="flex-1">
						<h3 class="text-xl font-semibold text-slate-900">Upload Complete!</h3>
						<p class="text-slate-600 mt-1">
							{uploadResults.successful} invitation{uploadResults.successful !== 1 ? 's' : ''} sent successfully,
							{uploadResults.failed} failed
						</p>
					</div>
				</div>

				<!-- Results Table -->
				<div class="border-t border-slate-200 pt-6">
					<h4 class="text-sm font-semibold text-slate-900 mb-4">Upload Results</h4>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-slate-50 border-b border-slate-200">
								<tr>
									<th
										class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
										>Status</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
										>Email</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
										>Details</th
									>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-slate-200">
								{#each uploadResults.results as result}
									<tr>
										<td class="px-4 py-3 whitespace-nowrap">
											{#if result.success}
												<Badge variant="success">Success</Badge>
											{:else}
												<Badge variant="danger">Failed</Badge>
											{/if}
										</td>
										<td class="px-4 py-3 whitespace-nowrap">
											<span class="text-sm text-slate-900">{result.email}</span>
										</td>
										<td class="px-4 py-3">
											{#if result.success}
												<span class="text-xs text-slate-500">
													Invitation sent (expires {new Date(result.expiresAt).toLocaleDateString()})
												</span>
											{:else}
												<span class="text-xs text-red-600">{result.error}</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<div class="flex gap-3 pt-4">
					<Button variant="outline" onclick={goBack} class="flex-1"> Back to Contributors </Button>
					<Button onclick={reset} class="flex-1"> Upload More </Button>
				</div>
			</div>
		</Card>
	{:else}
		<!-- Upload Form -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left Column: Upload Area -->
			<div class="lg:col-span-2 space-y-6">
				<!-- File Upload Card -->
				<Card>
					<div class="p-6 space-y-6">
						<div>
							<h3 class="text-lg font-semibold text-slate-900 mb-4">Upload CSV File</h3>

							{#if !file}
								<!-- Drop Zone -->
								<label
									class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
								>
									<div class="flex flex-col items-center justify-center py-8">
										<div class="text-slate-400 mb-4">{@html icons.Upload(48)}</div>
										<p class="mb-2 text-sm text-slate-700 font-semibold">
											Click to upload or drag and drop
										</p>
										<p class="text-xs text-slate-500">CSV file with contributor emails (MAX. 1000)</p>
									</div>
									<input
										bind:this={fileInput}
										type="file"
										accept=".csv,.txt"
										onchange={handleFileSelect}
										class="hidden"
									/>
								</label>
							{:else}
								<!-- File Selected -->
								<div class="border border-slate-200 rounded-lg p-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<div class="text-blue-600">{@html icons.FileText(24)}</div>
											<div>
												<p class="text-sm font-medium text-slate-900">{file.name}</p>
												<p class="text-xs text-slate-500">
													{(file.size / 1024).toFixed(1)} KB - {parsedEmails.length} email{parsedEmails.length !==
													1
														? 's'
														: ''}
													found
												</p>
											</div>
										</div>
										<Button variant="outline" size="sm" onclick={reset}> Change File </Button>
									</div>
								</div>
							{/if}
						</div>

						<!-- Template Download -->
						<div class="border-t border-slate-200 pt-4">
							<p class="text-sm text-slate-600 mb-2">
								Don't have a CSV file? Download our template
							</p>
							<Button variant="outline" size="sm" onclick={downloadTemplate}>
								<span>{@html icons.Download(16)}</span>
								<span class="ml-2">Download Template</span>
							</Button>
						</div>
					</div>
				</Card>

				<!-- Email Preview -->
				{#if parsedEmails.length > 0}
					<Card>
						<div class="p-6 space-y-4">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold text-slate-900">
									Email Preview ({parsedEmails.length})
								</h3>
								<Button variant="outline" size="sm" onclick={() => (parsedEmails = [])}>
									Clear All
								</Button>
							</div>

							<div class="space-y-2 max-h-96 overflow-y-auto">
								{#each parsedEmails as email, index}
									<div
										class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
									>
										<div class="flex items-center gap-3">
											<div class="text-blue-600">{@html icons.Mail(16)}</div>
											<span class="text-sm text-slate-900">{email}</span>
										</div>
										<button
											onclick={() => removeEmail(index)}
											class="text-slate-400 hover:text-red-600 transition-colors"
										>
											{@html icons.X(16)}
										</button>
									</div>
								{/each}
							</div>
						</div>
					</Card>

					<!-- Project Assignment -->
					<Card>
						<div class="p-6 space-y-4">
							<div>
								<h3 class="text-lg font-semibold text-slate-900">Assign to Projects (Optional)</h3>
								<p class="text-sm text-slate-600 mt-1">
									Select projects all contributors will have access to
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
													<div class="text-xs text-slate-500 truncate mt-0.5">
														{project.description}
													</div>
												{/if}
											</div>
											<Badge variant="success">Active</Badge>
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
				{/if}
			</div>

			<!-- Right Column: Help & Actions -->
			<div class="space-y-6">
				<!-- Error Message -->
				{#if error}
					<Card>
						<div class="p-4 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-red-800 font-medium text-sm">Error</p>
							<p class="text-red-600 text-sm mt-1">{error}</p>
						</div>
					</Card>
				{/if}

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
								<h4 class="text-sm font-semibold text-slate-900">CSV Format Requirements</h4>
								<ul class="text-xs text-slate-600 mt-2 space-y-2">
									<li class="flex items-start gap-2">
										<span class="text-blue-600 mt-0.5">•</span>
										<span>First column should contain email addresses</span>
									</li>
									<li class="flex items-start gap-2">
										<span class="text-blue-600 mt-0.5">•</span>
										<span>One email per row</span>
									</li>
									<li class="flex items-start gap-2">
										<span class="text-blue-600 mt-0.5">•</span>
										<span>Optional header row (will be skipped)</span>
									</li>
									<li class="flex items-start gap-2">
										<span class="text-blue-600 mt-0.5">•</span>
										<span>Maximum 1000 emails per upload</span>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</Card>

				<!-- Actions -->
				{#if parsedEmails.length > 0}
					<Card>
						<div class="p-6 space-y-3">
							<Button
								type="button"
								class="w-full"
								loading={submitting}
								onclick={handleUpload}
								disabled={parsedEmails.length === 0 || submitting}
							>
								Send {parsedEmails.length} Invitation{parsedEmails.length !== 1 ? 's' : ''}
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
				{:else}
					<Card>
						<div class="p-6">
							<Button type="button" variant="outline" class="w-full" onclick={goBack}>
								Back to Contributors
							</Button>
						</div>
					</Card>
				{/if}

				<!-- Example Card -->
				<Card>
					<div class="p-4 bg-slate-50 rounded-lg">
						<p class="text-sm font-medium text-slate-900 mb-2">Example CSV Format</p>
						<div class="text-xs font-mono bg-white p-3 rounded border border-slate-200">
							<div class="text-slate-500">email</div>
							<div class="text-slate-800">agent1@example.com</div>
							<div class="text-slate-800">agent2@example.com</div>
							<div class="text-slate-800">agent3@example.com</div>
						</div>
					</div>
				</Card>
			</div>
		</div>
	{/if}
</div>
