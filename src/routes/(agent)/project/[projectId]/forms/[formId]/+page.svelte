<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api } from '$lib/api/client';
	import { createSubmission } from '$lib/offline/submissions';
	import { network } from '$lib/stores/network.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { icons } from '$lib/components/icons.svelte';

	const projectId = Number($page.params.projectId);
	const formId = Number($page.params.formId);
	const submissionId = $derived($page.url.searchParams.get('submissionId'));
	const isEditMode = $derived(!!submissionId);

	let project = $state<any | null>(null);
	let form = $state<any | null>(null);
	let schema = $state<any | null>(null);
	let existingSubmission = $state<any | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let submitting = $state(false);
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	// Form answers (field_id -> value)
	let answers = $state<Record<string, any>>({});
	let validationErrors = $state<Record<string, string>>({});

	// Multi-step support
	let formType = $state<'single-page' | 'multi-step'>('single-page');
	let currentStep = $state(0);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		// Load project details
		const { data: projectsData, error: projectsError } = await api.getAgentProjects();
		if (projectsError) {
			error = projectsError;
			loading = false;
			return;
		}

		project = (projectsData || []).find((p: any) => p.id === projectId);
		if (!project) {
			error = 'Project not found';
			loading = false;
			return;
		}

		// Load forms
		const { data: formsData, error: formsError } = await api.getProjectForms(projectId);
		if (formsError) {
			error = formsError;
			loading = false;
			return;
		}

		form = (formsData || []).find((f: any) => f.id === formId);
		if (!form) {
			error = 'Form not found';
			loading = false;
			return;
		}

		// Parse schema
		try {
			schema = JSON.parse(form.schema);

			// Parse metadata for formType and other settings
			if (form.metadata) {
				try {
					const meta = JSON.parse(form.metadata);
					formType = meta.formType || 'single-page';
				} catch {
					formType = 'single-page';
				}
			}

			// If in edit mode, load existing submission
			if (isEditMode && submissionId) {
				const result = await api.getProjectSubmissions(projectId);
				if ('data' in result && result.data) {
					const rawSubmissions = result.data || [];
					const submission = rawSubmissions.find((s: any) => s.id === parseInt(submissionId));

					if (submission) {
						existingSubmission = submission;
						// Parse answers if they're a JSON string
						const parsedAnswers = typeof submission.answers === 'string'
							? JSON.parse(submission.answers)
							: submission.answers;
						answers = { ...parsedAnswers };
					} else {
						error = 'Submission not found';
						loading = false;
						return;
					}
				}
			}

			// Initialize answers with default values for each field (if not editing)
			if (schema?.fields) {
				for (const field of schema.fields) {
					if (field.type === 'pageBreak') continue;
					if (answers[field.id] === undefined) {
						if (field.type === 'checkbox') {
							answers[field.id] = [];
						} else if (field.type === 'boolean') {
							answers[field.id] = false;
						} else if (field.type === 'number') {
							answers[field.id] = '';
						} else {
							answers[field.id] = '';
						}
					}
				}
			}
		} catch (e) {
			error = 'Invalid form schema';
			loading = false;
			return;
		}

		loading = false;
	}

	// Derive steps from fields - groups fields between page breaks
	const steps = $derived.by(() => {
		if (!schema?.fields) return [{ title: 'Form', description: '', fields: [] }];

		if (formType === 'single-page') {
			return [{
				title: form?.name || 'Form',
				description: '',
				fields: schema.fields.filter((f: any) => f.type !== 'pageBreak')
			}];
		}

		const result: Array<{ title: string; description: string; fields: any[] }> = [];
		let currentFields: any[] = [];
		let stepTitle = 'Step 1';
		let stepDescription = '';

		schema.fields.forEach((field: any) => {
			if (field.type === 'pageBreak') {
				if (currentFields.length > 0) {
					result.push({ title: stepTitle, description: stepDescription, fields: currentFields });
					currentFields = [];
				}
				stepTitle = field.label || `Step ${result.length + 2}`;
				stepDescription = field.description || '';
			} else {
				currentFields.push(field);
			}
		});

		if (currentFields.length > 0) {
			result.push({ title: stepTitle, description: stepDescription, fields: currentFields });
		}

		return result.length > 0 ? result : [{ title: 'Step 1', description: '', fields: [] }];
	});

	const currentStepData = $derived(steps[currentStep] || { title: '', description: '', fields: [] });
	const isLastStep = $derived(currentStep === steps.length - 1);

	function validateForm(fieldsToValidate?: any[]): boolean {
		validationErrors = {};
		let isValid = true;

		const fields = fieldsToValidate ?? (schema?.fields?.filter((f: any) => f.type !== 'pageBreak') || []);

		for (const field of fields) {
			const value = answers[field.id];

			// Check required fields
			if (field.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
				validationErrors[field.id] = `${field.label} is required`;
				isValid = false;
				continue;
			}

			// Type-specific validation
			if (value !== undefined && value !== null && value !== '') {
				switch (field.type) {
					case 'number':
						if (isNaN(Number(value))) {
							validationErrors[field.id] = 'Must be a valid number';
							isValid = false;
						}
						break;
					case 'email':
						if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
							validationErrors[field.id] = 'Must be a valid email';
							isValid = false;
						}
						break;
				}
			}
		}

		return isValid;
	}

	function nextStep() {
		if (!validateForm(currentStepData.fields)) {
			toast = { message: 'Please fill in all required fields', type: 'error' };
			setTimeout(() => (toast = null), 3000);
			const firstError = Object.keys(validationErrors)[0];
			if (firstError) document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			return;
		}
		currentStep++;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function prevStep() {
		currentStep--;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function generateUUID(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	async function handleSubmit() {
		// Validate all fields across all steps
		if (!validateForm()) {
			toast = { message: 'Please fill in all required fields', type: 'error' };
			setTimeout(() => (toast = null), 5000);
			const firstErrorField = Object.keys(validationErrors)[0];
			if (firstErrorField) {
				document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			return;
		}

		submitting = true;
		error = null;

		try {
			// Convert Svelte state proxy to plain object
			const plainAnswers = JSON.parse(JSON.stringify(answers));

			if (isEditMode && existingSubmission) {
				// Update existing submission
				const { data, error: updateError } = await api.updateSubmission(existingSubmission.id, {
					answers: plainAnswers
				});

				if (updateError) {
					toast = { message: updateError, type: 'error' };
					setTimeout(() => (toast = null), 5000);
					submitting = false;
					return;
				}

				toast = { message: 'Submission updated successfully', type: 'success' };
				setTimeout(() => {
					toast = null;
					goto(`/project/${projectId}/submissions`);
				}, 1500);
			} else {
				// Create new submission using offline-first approach
				const localId = await createSubmission({
					projectId,
					respondentName: '',
					responses: [
						{
							formId,
							answers: plainAnswers
						}
					]
				});

				await network.refreshPendingCount();

				if (network.online) {
					await network.syncNow();
				}

				toast = { message: network.online ? 'Form submitted and synced!' : 'Form saved offline. Will sync when online.', type: 'success' };
				setTimeout(() => {
					toast = null;
					goto(`/project/${projectId}/submissions`);
				}, 1500);
			}
		} catch (err) {
			console.error('Error saving submission:', err);
			toast = { message: 'Failed to save submission. Please try again.', type: 'error' };
			setTimeout(() => (toast = null), 5000);
			submitting = false;
		}
	}

	function goBack() {
		goto(`/project/${projectId}/submissions`);
	}

	const allAnswerableFields = $derived(
		schema?.fields?.filter((f: any) => f.type !== 'pageBreak') || []
	);
	const completedFields = $derived(
		allAnswerableFields.filter(
			(f: any) => {
				const v = answers[f.id];
				return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
			}
		).length
	);
	const totalFields = $derived(allAnswerableFields.length);
	const progressPercent = $derived(
		totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0
	);
</script>

<div class="min-h-screen bg-slate-50 pb-24 lg:pb-8">
	<!-- Mobile Header -->
	<div class="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm lg:relative lg:z-10">
		<div class="flex items-center gap-3 p-4">
			<button
				onclick={goBack}
				class="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors active:bg-slate-200"
				disabled={submitting}
			>
				<span class="text-slate-700">{@html icons.ArrowLeft(24)}</span>
			</button>
			<div class="flex-1 min-w-0">
				{#if loading}
					<Skeleton class="h-6 w-48" />
				{:else if form}
					<h1 class="text-lg font-bold text-slate-900 truncate">{form.name}</h1>
					{#if formType === 'multi-step' && steps.length > 1}
						<p class="text-xs text-slate-500">Step {currentStep + 1} of {steps.length}</p>
					{:else}
						<p class="text-xs text-slate-500">{completedFields} of {totalFields} complete</p>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Progress Bar -->
		{#if !loading && schema}
			{#if formType === 'multi-step' && steps.length > 1}
				<!-- Step dots progress -->
				<div class="flex items-center gap-1 px-4 pb-3">
					{#each steps as _, i}
						<div class="h-1.5 flex-1 rounded-full transition-all duration-300 {i < currentStep ? 'bg-blue-600' : i === currentStep ? 'bg-blue-400' : 'bg-slate-200'}"></div>
					{/each}
				</div>
			{:else}
				<div class="h-1 bg-slate-200">
					<div
						class="h-full bg-blue-600 transition-all duration-300"
						style="width: {progressPercent}%"
					></div>
				</div>
			{/if}
		{/if}
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="p-4 space-y-4">
			{#each [1, 2, 3, 4] as _}
				<Card class="p-4">
					<Skeleton class="h-4 w-24 mb-2" />
					<Skeleton class="h-12 w-full" />
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
	{:else if form && schema}
		<!-- Step Title (multi-step only) -->
		{#if formType === 'multi-step' && steps.length > 1}
			<div class="px-4 lg:px-10 pt-6 pb-2 bg-white border-b border-slate-100">
				<p class="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
					Step {currentStep + 1} of {steps.length}
				</p>
				<h2 class="text-xl font-bold text-slate-900">{currentStepData.title}</h2>
				{#if currentStepData.description}
					<p class="text-sm text-slate-500 mt-1">{currentStepData.description}</p>
				{/if}
			</div>
		{/if}

		<!-- Form Fields -->
		<form onsubmit={(e) => { e.preventDefault(); isLastStep ? handleSubmit() : nextStep(); }} class="bg-white">
			<div class="px-4 lg:px-10 py-6 lg:py-8 space-y-6">
				{#each currentStepData.fields as field}
					<div class="space-y-2">
						<label for={field.id} class="block text-sm font-semibold text-slate-900">
							{field.label}
							{#if field.required}
								<span class="text-red-500 ml-0.5">*</span>
							{/if}
						</label>

						{#if field.description}
							<p class="text-sm text-slate-500 -mt-1">{field.description}</p>
						{/if}

						{#if field.type === 'text'}
							<input
								id={field.id}
								type="text"
								bind:value={answers[field.id]}
								placeholder={field.placeholder || 'Your answer'}
								required={field.required}
								disabled={submitting}
								class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 {validationErrors[field.id] ? 'border-red-500 focus:ring-red-500' : ''}"
							/>
						{:else if field.type === 'textarea'}
							<textarea
								id={field.id}
								bind:value={answers[field.id]}
								placeholder={field.placeholder || 'Your answer'}
								required={field.required}
								disabled={submitting}
								rows={4}
								class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 {validationErrors[field.id] ? 'border-red-500 focus:ring-red-500' : ''}"
							></textarea>
						{:else if field.type === 'number'}
							<input
								id={field.id}
								type="number"
								bind:value={answers[field.id]}
								placeholder={field.placeholder || '0'}
								required={field.required}
								disabled={submitting}
								class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 {validationErrors[field.id] ? 'border-red-500 focus:ring-red-500' : ''}"
							/>
						{:else if field.type === 'email'}
							<input
								id={field.id}
								type="email"
								bind:value={answers[field.id]}
								placeholder={field.placeholder || 'email@example.com'}
								required={field.required}
								disabled={submitting}
								class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 {validationErrors[field.id] ? 'border-red-500 focus:ring-red-500' : ''}"
							/>
						{:else if field.type === 'phone'}
							<input
								id={field.id}
								type="tel"
								bind:value={answers[field.id]}
								placeholder={field.placeholder || '+233...'}
								required={field.required}
								disabled={submitting}
								class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 {validationErrors[field.id] ? 'border-red-500 focus:ring-red-500' : ''}"
							/>
						{:else if field.type === 'url'}
							<input
								id={field.id}
								type="url"
								bind:value={answers[field.id]}
								placeholder={field.placeholder || 'https://'}
								required={field.required}
								disabled={submitting}
								class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 {validationErrors[field.id] ? 'border-red-500 focus:ring-red-500' : ''}"
							/>
						{:else if field.type === 'date'}
							<input
								id={field.id}
								type="date"
								bind:value={answers[field.id]}
								required={field.required}
								disabled={submitting}
								class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 {validationErrors[field.id] ? 'border-red-500 focus:ring-red-500' : ''}"
							/>
						{:else if field.type === 'radio' && field.options}
							<!-- Radio / Single Choice -->
							<div class="space-y-2" id={field.id}>
								{#each field.options as option}
									<label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors {answers[field.id] === option.value ? 'border-blue-400 bg-blue-50' : ''}">
										<input
											type="radio"
											name={field.id}
											value={option.value}
											bind:group={answers[field.id]}
											disabled={submitting}
											class="text-blue-600 w-4 h-4 shrink-0"
										/>
										<span class="text-sm font-medium text-slate-800">{option.label}</span>
									</label>
								{/each}
							</div>
						{:else if field.type === 'checkbox' && field.options}
							<!-- Checkbox / Multiple Choice -->
							<div class="space-y-2" id={field.id}>
								{#each field.options as option}
									<label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors {Array.isArray(answers[field.id]) && answers[field.id].includes(option.value) ? 'border-blue-400 bg-blue-50' : ''}">
										<input
											type="checkbox"
											value={option.value}
											checked={Array.isArray(answers[field.id]) && answers[field.id].includes(option.value)}
											onchange={(e) => {
												if (!Array.isArray(answers[field.id])) answers[field.id] = [];
												if (e.currentTarget.checked) {
													answers[field.id] = [...answers[field.id], option.value];
												} else {
													answers[field.id] = answers[field.id].filter((v: string) => v !== option.value);
												}
											}}
											disabled={submitting}
											class="text-blue-600 rounded w-4 h-4 shrink-0"
										/>
										<span class="text-sm font-medium text-slate-800">{option.label}</span>
									</label>
								{/each}
							</div>
						{:else if field.type === 'select' && field.options}
							<select
								id={field.id}
								bind:value={answers[field.id]}
								required={field.required}
								disabled={submitting}
								class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 {validationErrors[field.id] ? 'border-red-500 focus:ring-red-500' : ''}"
							>
								<option value="">Select {field.label.toLowerCase()}</option>
								{#each field.options as option}
									<option value={option.value ?? option}>{option.label ?? option}</option>
								{/each}
							</select>
						{:else if field.type === 'boolean'}
							<label class="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
								<input
									type="checkbox"
									id={field.id}
									bind:checked={answers[field.id]}
									disabled={submitting}
									class="text-blue-600 rounded w-4 h-4 disabled:opacity-50"
								/>
								<span class="text-sm font-medium">
									{field.checkboxLabel || 'Yes'}
								</span>
							</label>
						{:else if field.type === 'location'}
							<div class="p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-600 flex items-center gap-2">
								{@html icons.MapPin(18)}
								<span>GPS location will be captured on submit</span>
							</div>
						{:else}
							<!-- Fallback -->
							<input
								id={field.id}
								type="text"
								bind:value={answers[field.id]}
								placeholder={field.placeholder || 'Your answer'}
								required={field.required}
								disabled={submitting}
								class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 {validationErrors[field.id] ? 'border-red-500 focus:ring-red-500' : ''}"
							/>
						{/if}

						{#if validationErrors[field.id]}
							<p class="text-sm text-red-600 flex items-center gap-1">
								<span>{@html icons.AlertCircle(14)}</span>
								<span>{validationErrors[field.id]}</span>
							</p>
						{/if}
					</div>
				{/each}
			</div>
		</form>
	{/if}
</div>

<!-- Bottom Navigation -->
{#if !loading && !error && schema}
	<div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg z-50 lg:relative lg:z-0 lg:border-t-0 lg:shadow-none lg:mt-6">
		{#if formType === 'multi-step' && steps.length > 1}
			<div class="flex gap-3">
				{#if currentStep > 0}
					<Button
						variant="outline"
						onclick={prevStep}
						disabled={submitting}
						class="flex-1 h-14 text-base font-medium"
					>
						<span class="mr-2">{@html icons.ArrowLeft(18)}</span>
						Back
					</Button>
				{/if}
				{#if !isLastStep}
					<Button
						onclick={nextStep}
						disabled={submitting}
						class="flex-1 h-14 text-base font-medium"
					>
						Next
						<span class="ml-2">{@html icons.ChevronRight(18)}</span>
					</Button>
				{:else}
					<Button
						onclick={handleSubmit}
						loading={submitting}
						disabled={submitting}
						class="flex-1 h-14 text-base font-medium gap-3"
					>
						<span>{@html icons.Send(20)}</span>
						<span>{submitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Submission' : 'Submit Form')}</span>
					</Button>
				{/if}
			</div>
		{:else}
			<Button
				onclick={handleSubmit}
				loading={submitting}
				disabled={submitting}
				class="w-full h-14 text-base font-medium gap-3"
			>
				<span>{@html icons.Send(20)}</span>
				<span>{submitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Submission' : 'Submit Form')}</span>
			</Button>
		{/if}
		{#if currentStepData.fields.some((f: any) => f.required)}
			<p class="text-xs text-center text-slate-500 mt-2">
				<span class="text-red-500">*</span> Required fields
			</p>
		{/if}
	</div>
{/if}

<!-- Toast Notification -->
{#if toast}
	<Toast message={toast.message} type={toast.type} onClose={() => (toast = null)} />
{/if}
