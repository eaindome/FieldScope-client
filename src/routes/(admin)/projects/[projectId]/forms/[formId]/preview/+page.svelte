<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';
	import DatePicker from '$lib/components/ui/date-picker.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { cn } from '$lib/utils';
	import { api, FormStatus } from '$lib/api/client';
	import Toast from '$lib/components/ui/toast.svelte';

	const projectId = $derived(Number($page.params.projectId));
	const formId = $derived(Number($page.params.formId));

	let loading = $state(true);
	let formTitle = $state('');
	let formDescription = $state('');
	let formType = $state<'single-page' | 'multi-step'>('single-page');
	let fields = $state<any[]>([]);
	let currentStep = $state(0);
	let formData = $state<Record<string, any>>({});
	let formStatus = $state<FormStatus>(FormStatus.Draft);
	let publishing = $state(false);
	let isNewForm = $derived(isNaN(formId) || formId === 0);
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	let branding = $state({
		logo: {
			url: '',
			position: 'top-center' as 'top-left' | 'top-center' | 'top-right',
			size: 'medium' as 'small' | 'medium' | 'large'
		},
		watermark: {
			url: '',
			position: 'center' as 'center' | 'top-right' | 'bottom-right' | 'bottom-center',
			opacity: 20
		}
	});

	// Calculate steps from page breaks, carrying description through
	const steps = $derived.by(() => {
		if (formType === 'single-page') return [{ title: 'Form', description: '', fields }];

		const result: Array<{ title: string; description: string; fields: any[] }> = [];
		let currentStepFields: any[] = [];
		let stepTitle = 'Step 1';
		let stepDescription = '';

		fields.forEach((field) => {
			if (field.type === 'pageBreak') {
				if (currentStepFields.length > 0) {
					result.push({ title: stepTitle, description: stepDescription, fields: currentStepFields });
					currentStepFields = [];
				}
				stepTitle = field.label || `Step ${result.length + 2}`;
				stepDescription = field.description || '';
			} else {
				currentStepFields.push(field);
			}
		});

		if (currentStepFields.length > 0) {
			result.push({ title: stepTitle, description: stepDescription, fields: currentStepFields });
		}

		return result.length > 0 ? result : [{ title: 'Step 1', description: '', fields: [] }];
	});

	onMount(async () => {
		// Try loading from localStorage first (for new forms not saved yet)
		const previewData = localStorage.getItem('formPreviewData');
		if (previewData) {
			const data = JSON.parse(previewData);
			formTitle = data.title;
			formDescription = data.description;
			formType = data.formType;
			fields = data.fields;
			if (data.branding) {
				branding = data.branding;
			}
			data.fields.forEach((f: any) => {
				if (f.type !== 'pageBreak') formData[f.id] = '';
			});
			localStorage.removeItem('formPreviewData');
			loading = false;
		} else {
			// Load from API for saved forms
			const { data, error } = await api.getForm(formId);
			if (data) {
				formTitle = data.name;
				// Determine form status based on isActive property
				formStatus = data.isActive ? FormStatus.Published : FormStatus.Draft;

				const schema = JSON.parse(data.schema);
				fields = schema.fields || [];

				if (data.metadata) {
					const metadata = JSON.parse(data.metadata);
					formDescription = metadata.description || '';
					formType = metadata.formType || 'single-page';
					if (metadata.branding) {
						branding = metadata.branding;
					}
				}

				fields.forEach((f: any) => {
					if (f.type !== 'pageBreak') formData[f.id] = '';
				});
			}
			loading = false;
		}
	});

	function nextStep() {
		if (currentStep < steps.length - 1) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function handleSubmit() {
		alert('Form submitted! (This is a preview)');
	}

	async function handlePublish() {
		publishing = true;
		const newStatus = formStatus === FormStatus.Published ? FormStatus.Draft : FormStatus.Published;
		const { error } = await api.updateFormStatus(formId, newStatus);
		publishing = false;

		if (error) {
			toast = { message: error, type: 'error' };
			setTimeout(() => (toast = null), 4000);
		} else {
			formStatus = newStatus;
			const action = newStatus === FormStatus.Published ? 'published' : 'unpublished';
			toast = { message: `Form ${action} successfully!`, type: 'success' };
			setTimeout(() => (toast = null), 3000);
		}
	}
</script>

<div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-8">
	<div class="max-w-3xl mx-auto px-4">
		<!-- Preview Badge -->
		<div class="mb-6 flex items-center justify-between">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
				{@html icons.Eye(16)}
				<span>Preview Mode</span>
			</div>
			<div class="flex items-center gap-3">
				{#if !isNewForm}
					<Button
						variant={formStatus === FormStatus.Published ? 'outline' : 'default'}
						size="sm"
						loading={publishing}
						onclick={handlePublish}
					>
						{formStatus === FormStatus.Published ? 'Unpublish' : 'Publish'}
					</Button>
				{/if}
				<button
					onclick={() => window.close()}
					class="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
				>
					Close Preview
				</button>
			</div>
		</div>

		<!-- Form Card -->
		{#if loading}
			<div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
				<div class="px-10 pt-10 pb-6 border-b border-slate-100">
					<Skeleton class="h-8 w-64 mb-3" />
					<Skeleton class="h-4 w-96" />
				</div>
				<div class="px-10 py-8 space-y-6">
					{#each [1, 2, 3, 4] as _}
						<div class="space-y-2">
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-12 w-full" />
						</div>
					{/each}
				</div>
			</div>
		{:else}
		<div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
			<!-- Watermark Overlay -->
			{#if branding.watermark.url}
				<div class="absolute inset-0 pointer-events-none z-0">
					<img
						src={branding.watermark.url}
						alt="Watermark"
						class="absolute object-contain {
							branding.watermark.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2' :
							branding.watermark.position === 'top-right' ? 'top-8 right-8 w-1/3' :
							branding.watermark.position === 'bottom-right' ? 'bottom-8 right-8 w-1/3' :
							'bottom-8 left-1/2 -translate-x-1/2 w-1/3'
						}"
						style="opacity: {branding.watermark.opacity / 100}"
					/>
				</div>
			{/if}

			<!-- Form Header -->
			<div class="px-10 pt-10 pb-6 border-b border-slate-100 relative z-10">
				<!-- Logo -->
				{#if branding.logo.url}
					<div class="mb-6 flex {branding.logo.position === 'top-left' ? 'justify-start' : branding.logo.position === 'top-right' ? 'justify-end' : 'justify-center'}">
						<img
							src={branding.logo.url}
							alt="Organization logo"
							class="{branding.logo.size === 'small' ? 'h-8' : branding.logo.size === 'large' ? 'h-20' : 'h-12'} object-contain"
						/>
					</div>
				{/if}

				<h1 class="text-3xl font-bold text-slate-900 mb-2">{formTitle}</h1>
				{#if formDescription}
					<p class="text-slate-600">{formDescription}</p>
				{/if}
			</div>

			{#if formType === 'multi-step' && steps.length > 0}
				<!-- Stepper Progress Bar -->
				<div class="px-10 py-6 bg-slate-50 border-b border-slate-100 relative z-10">
					<!-- Step circles + connectors -->
					<div class="flex items-center">
						{#each steps as step, i}
							<div class="flex items-center flex-1 {i === steps.length - 1 ? 'flex-none' : ''}">
								<!-- Circle -->
								<div class="flex flex-col items-center gap-1.5 shrink-0">
									<div
										class={cn(
											'flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-200',
											i < currentStep
												? 'bg-blue-600 text-white'
												: i === currentStep
													? 'bg-blue-600 text-white ring-4 ring-blue-100'
													: 'bg-white text-slate-400 border-2 border-slate-200'
										)}
									>
										{#if i < currentStep}
											{@html icons.Check(14)}
										{:else}
											{i + 1}
										{/if}
									</div>
									<span
										class={cn(
											'text-xs font-medium text-center max-w-18 leading-tight',
											i === currentStep ? 'text-blue-700' : i < currentStep ? 'text-slate-500' : 'text-slate-400'
										)}
									>
										{step.title}
									</span>
								</div>
								<!-- Connector line -->
								{#if i < steps.length - 1}
									<div class="flex-1 mx-2 mb-5">
										<div class="h-0.5 rounded-full transition-all duration-300 {i < currentStep ? 'bg-blue-600' : 'bg-slate-200'}"></div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
					<!-- Progress text -->
					<div class="mt-4 flex items-center justify-between">
						<div>
							<p class="text-base font-semibold text-slate-900">{steps[currentStep]?.title}</p>
							{#if steps[currentStep]?.description}
								<p class="text-sm text-slate-500 mt-0.5">{steps[currentStep].description}</p>
							{/if}
						</div>
						<span class="text-xs text-slate-400 font-medium shrink-0 ml-4">
							{currentStep + 1} / {steps.length}
						</span>
					</div>
				</div>

				<!-- Current Step Fields -->
				<div class="px-10 py-8 relative z-10">
					<div class="space-y-6 mb-8">
						{#each steps[currentStep]?.fields || [] as field}
							{#if field.type !== 'pageBreak'}
								<div>
									<label for="field-{field.id}" class="block text-sm font-semibold text-slate-900 mb-2">
										{field.label}
										{#if field.required}<span class="text-red-500 ml-0.5">*</span>{/if}
									</label>
									{#if field.description}
										<p class="text-sm text-slate-500 mb-3">{field.description}</p>
									{/if}

									{#if field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'url'}
										<input
											id="field-{field.id}"
											type="text"
											bind:value={formData[field.id]}
											placeholder={field.placeholder || 'Your answer'}
											class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									{:else if field.type === 'textarea'}
										<textarea
											id="field-{field.id}"
											bind:value={formData[field.id]}
											placeholder={field.placeholder || 'Your answer'}
											rows="4"
											class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										></textarea>
									{:else if field.type === 'number'}
										<input
											id="field-{field.id}"
											type="number"
											bind:value={formData[field.id]}
											placeholder={field.placeholder || '0'}
											class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									{:else if field.type === 'date'}
										<DatePicker
											bind:value={formData[field.id]}
											placeholder="Select a date"
										/>
									{:else if field.type === 'radio' && field.options}
										<fieldset class="space-y-3">
											<legend class="sr-only">{field.label}</legend>
											{#each field.options as option}
												<label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
													<input
														type="radio"
														bind:group={formData[field.id]}
														value={option.value}
														class="text-blue-600 w-4 h-4"
													/>
													<span class="text-sm font-medium">{option.label}</span>
												</label>
											{/each}
										</fieldset>
									{:else if field.type === 'checkbox' && field.options}
										<p class="text-xs text-slate-500 italic mb-3">Check all that apply</p>
										<fieldset class="space-y-3">
											<legend class="sr-only">{field.label}</legend>
											{#each field.options as option}
												<label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
													<input type="checkbox" class="text-blue-600 rounded w-4 h-4" />
													<span class="text-sm font-medium">{option.label}</span>
												</label>
											{/each}
										</fieldset>
									{:else if field.type === 'file'}
										<div class="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
											<div class="flex justify-center text-slate-400 mb-3">{@html icons.Upload(32)}</div>
											<div class="text-slate-600 text-sm font-medium mb-1">Click to upload or drag and drop</div>
											{#if field.allowedFormats}
												<div class="text-xs text-slate-500">Allowed: {field.allowedFormats}</div>
											{/if}
											{#if field.maxSizeMB}
												<div class="text-xs text-slate-500">Max size: {field.maxSizeMB}MB</div>
											{/if}
										</div>
									{:else if field.type === 'location'}
										<div class="border border-slate-300 rounded-lg p-4 bg-slate-50 flex items-center gap-2">
											<span class="text-slate-500">{@html icons.MapPin(18)}</span>
											<div class="text-sm text-slate-600">GPS Location will be captured</div>
										</div>
									{/if}
								</div>
							{/if}
						{/each}
					</div>

					<!-- Navigation Buttons -->
					<div class="flex items-center justify-between gap-4 pt-6 border-t border-slate-100">
						<Button variant="outline" onclick={prevStep} disabled={currentStep === 0} class="flex-1">
							{@html icons.ArrowLeft(16)}
							<span class="ml-2">Previous</span>
						</Button>
						{#if currentStep === steps.length - 1}
							<Button onclick={handleSubmit} class="flex-1">Submit Form</Button>
						{:else}
							<Button onclick={nextStep} class="flex-1">
								<span class="mr-2">Next</span>
								{@html icons.ArrowRight(16)}
							</Button>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Single Page Form Preview -->
				<div class="px-10 py-8 relative z-10">
					<div class="space-y-6 mb-8">
						{#each fields as field}
							{#if field.type !== 'pageBreak'}
								<div>
									<label for="field-{field.id}" class="block text-sm font-semibold text-slate-900 mb-2">
										{field.label}
										{#if field.required}<span class="text-red-500 ml-0.5">*</span>{/if}
									</label>
									{#if field.description}
										<p class="text-sm text-slate-500 mb-3">{field.description}</p>
									{/if}

									{#if field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'url'}
										<input
											id="field-{field.id}"
											type="text"
											bind:value={formData[field.id]}
											placeholder={field.placeholder || 'Your answer'}
											class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									{:else if field.type === 'textarea'}
										<textarea
											id="field-{field.id}"
											bind:value={formData[field.id]}
											placeholder={field.placeholder || 'Your answer'}
											rows="4"
											class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										></textarea>
									{:else if field.type === 'number'}
										<input
											id="field-{field.id}"
											type="number"
											bind:value={formData[field.id]}
											placeholder={field.placeholder || '0'}
											class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									{:else if field.type === 'date'}
										<DatePicker
											bind:value={formData[field.id]}
											placeholder="Select a date"
										/>
									{:else if field.type === 'radio' && field.options}
										<fieldset class="space-y-3">
											<legend class="sr-only">{field.label}</legend>
											{#each field.options as option}
												<label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
													<input
														type="radio"
														bind:group={formData[field.id]}
														value={option.value}
														class="text-blue-600 w-4 h-4"
													/>
													<span class="text-sm font-medium">{option.label}</span>
												</label>
											{/each}
										</fieldset>
									{:else if field.type === 'checkbox' && field.options}
										<p class="text-xs text-slate-500 italic mb-3">Check all that apply</p>
										<fieldset class="space-y-3">
											<legend class="sr-only">{field.label}</legend>
											{#each field.options as option}
												<label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
													<input type="checkbox" class="text-blue-600 rounded w-4 h-4" />
													<span class="text-sm font-medium">{option.label}</span>
												</label>
											{/each}
										</fieldset>
									{:else if field.type === 'file'}
										<div class="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
											<div class="flex justify-center text-slate-400 mb-3">{@html icons.Upload(32)}</div>
											<div class="text-slate-600 text-sm font-medium mb-1">Click to upload or drag and drop</div>
											{#if field.allowedFormats}
												<div class="text-xs text-slate-500">Allowed: {field.allowedFormats}</div>
											{/if}
											{#if field.maxSizeMB}
												<div class="text-xs text-slate-500">Max size: {field.maxSizeMB}MB</div>
											{/if}
										</div>
									{:else if field.type === 'location'}
										<div class="border border-slate-300 rounded-lg p-4 bg-slate-50 flex items-center gap-2">
											<span class="text-slate-500">{@html icons.MapPin(18)}</span>
											<div class="text-sm text-slate-600">GPS Location will be captured</div>
										</div>
									{/if}
								</div>
							{/if}
						{/each}
					</div>

					<div class="flex justify-end pt-6 border-t border-slate-100">
						<Button onclick={handleSubmit}>Submit Form</Button>
					</div>
				</div>
			{/if}
		</div>
		{/if}
	</div>
</div>

<!-- Toast Notification -->
{#if toast}
	<Toast message={toast.message} type={toast.type} onClose={() => (toast = null)} />
{/if}
