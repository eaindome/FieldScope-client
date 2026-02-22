<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Breadcrumbs from '$lib/components/ui/breadcrumbs.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { api } from '$lib/api/client';
	import { cn } from '$lib/utils';

	// Get IDs from URL
	const projectId = $derived(Number($page.params.projectId));
	const formIdParam = $derived($page.params.formId);
	const isNewForm = $derived(formIdParam === 'new');
	const formId = $derived(isNewForm ? null : Number(formIdParam));

	// Get project for breadcrumbs
	let projectName = $state<string>('Project');

	// Form state
	let formTitle = $state('Untitled Form');
	let formDescription = $state('');
	let formStatus = $state<'draft' | 'published'>('draft');
	let formType = $state<'single-page' | 'multi-step'>('single-page');
	let scoringEnabled = $state(false);
	let scoringInfoDismissed = $state(false);
	let fields = $state<any[]>([]);

	// Branding state
	let branding = $state({
		logo: {
			url: '',
			position: 'top-center' as 'top-left' | 'top-center' | 'top-right',
			size: 'medium' as 'small' | 'medium' | 'large'
		},
		watermark: {
			url: '',
			position: 'center' as 'center' | 'top-right' | 'bottom-right' | 'bottom-center',
			opacity: 20,
			size: 'medium' as 'small' | 'medium' | 'large'
		}
	});
	let confirmDialog = $state<{
		open: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({ open: false, title: '', message: '', onConfirm: () => {} });

	function showConfirm(title: string, message: string, onConfirm: () => void) {
		confirmDialog = { open: true, title, message, onConfirm };
	}
	function closeConfirm() {
		confirmDialog = { ...confirmDialog, open: false };
	}
	let selectedFieldId = $state<string | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let brandingDialogOpen = $state(false);

	// Predefined file formats grouped by category
	const FILE_FORMATS = {
		Documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
		Images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'],
		Spreadsheets: ['.xls', '.xlsx', '.csv', '.ods'],
		Presentations: ['.ppt', '.pptx', '.odp'],
		Audio: ['.mp3', '.wav', '.ogg', '.m4a'],
		Video: ['.mp4', '.avi', '.mov', '.webm', '.mkv'],
		Archives: ['.zip', '.rar', '.7z', '.tar', '.gz']
	};

	// Track selected predefined formats and custom formats separately for UI
	let selectedFormats = $state<string[]>([]);
	let customFormats = $state('');

	// Drag and drop state
	let draggedFieldId = $state<string | null>(null);
	let dragOverFieldId = $state<string | null>(null);

	const breadcrumbItems = $derived([
		{ label: 'Projects', href: '/projects' },
		{ label: projectName, href: `/projects/${projectId}/forms` },
		{ label: isNewForm ? 'New Form' : formTitle }
	]);

	// Derived state
	const selectedField = $derived(fields.find((f) => f.id === selectedFieldId));

	// Total weight of all page break sections (should sum to 100 when scoring is enabled)
	const totalWeight = $derived(
		fields
			.filter((f: any) => f.type === 'pageBreak')
			.reduce((sum: number, f: any) => sum + (Number(f.weight) || 0), 0)
	);
	const weightWarning = $derived(
		scoringEnabled &&
		fields.some((f: any) => f.type === 'pageBreak') &&
		totalWeight > 0 &&
		totalWeight !== 100
	);

	// Derive sections: group fields that precede each pageBreak, with max achievable score
	const sectionsWithFields = $derived.by(() => {
		const result: Array<{ pageBreakId: string; label: string; fields: any[]; maxScore: number }> = [];
		let currentFields: any[] = [];

		fields.forEach((field: any) => {
			if (field.type === 'pageBreak') {
				const maxScore = currentFields
					.filter((f: any) => f.type === 'radio' || f.type === 'checkbox')
					.reduce((sum: number, f: any) => {
						if (!f.options?.length) return sum;
						const max = Math.max(0, ...f.options.map((o: any) => Number(o.score) || 0));
						return sum + max;
					}, 0);
				result.push({ pageBreakId: field.id, label: field.label, fields: [...currentFields], maxScore });
				currentFields = [];
			} else {
				currentFields.push(field);
			}
		});

		return result;
	});

	// Calculate steps from page breaks
	const steps = $derived.by(() => {
		if (formType === 'single-page') return [{ title: 'Form', fields }];

		const result: Array<{ title: string; fields: any[] }> = [];
		let currentStep: any[] = [];
		let stepTitle = 'Step 1';

		fields.forEach((field) => {
			if (field.type === 'pageBreak') {
				if (currentStep.length > 0) {
					result.push({ title: stepTitle, fields: currentStep });
					currentStep = [];
				}
				stepTitle = field.label || `Step ${result.length + 2}`;
			} else {
				currentStep.push(field);
			}
		});

		if (currentStep.length > 0) {
			result.push({ title: stepTitle, fields: currentStep });
		}

		return result.length > 0 ? result : [{ title: 'Step 1', fields: [] }];
	});

	// Available field types with professional icons
	const baseFieldTypes = [
		{ type: 'text', icon: icons.Type(18), label: 'Short Text', color: 'text-blue-600' },
		{ type: 'textarea', icon: icons.AlignLeft(18), label: 'Long Text', color: 'text-indigo-600' },
		{ type: 'number', icon: icons.Hash(18), label: 'Number', color: 'text-purple-600' },
		{ type: 'date', icon: icons.Calendar(18), label: 'Date', color: 'text-pink-600' },
		{ type: 'radio', icon: icons.Circle(18), label: 'Single Choice', color: 'text-green-600' },
		{
			type: 'checkbox',
			icon: icons.CheckSquare(18),
			label: 'Multiple Choice',
			color: 'text-teal-600'
		},
		{ type: 'file', icon: icons.Upload(18), label: 'File Upload', color: 'text-orange-600' },
		{ type: 'location', icon: icons.MapPin(18), label: 'Location', color: 'text-red-600' },
		{ type: 'email', icon: icons.Mail(18), label: 'Email', color: 'text-cyan-600' },
		{ type: 'phone', icon: icons.Phone(18), label: 'Phone', color: 'text-emerald-600' },
		{ type: 'url', icon: icons.Link(18), label: 'URL', color: 'text-violet-600' }
	];

	const fieldTypes = $derived.by(() => {
		if (formType === 'multi-step') {
			return [
				...baseFieldTypes,
				{
					type: 'pageBreak',
					icon: icons.Scissors(18),
					label: 'Page Break',
					color: 'text-slate-600'
				}
			];
		}
		return baseFieldTypes;
	});

	onMount(() => {
		loadForm();
	});

	// Watch for file field selection to parse allowedFormats
	$effect(() => {
		if (selectedField?.type === 'file') {
			parseAllowedFormats(selectedField.allowedFormats || '');
		}
	});

	async function loadForm() {
		loading = true;

		// Load project info for breadcrumbs
		const { data: projects } = await api.getProjects();
		if (Array.isArray(projects)) {
			const currentProject = projects.find((p: any) => p.id === projectId);
			if (currentProject) {
				projectName = currentProject.name;
			}
		}

		if (!isNewForm && formId) {
			// Load existing form
			const { data: formData, error } = await api.getForm(formId);

			if (error || !formData) {
				console.error('Error loading form:', error);
				loading = false;
				return;
			}

			formTitle = formData.name;
			formStatus = formData.isActive ? 'published' : 'draft';

			// Parse schema JSON
			try {
				const schema = JSON.parse(formData.schema);
				fields = JSON.parse(JSON.stringify(schema.fields || [])); // Deep copy

				// Parse metadata if exists
				if (formData.metadata) {
					const metadata = JSON.parse(formData.metadata);
					formDescription = metadata.description || '';
					scoringEnabled = metadata.scoringEnabled || false;
					formType = metadata.formType || 'single-page';
					if (metadata.branding) {
						branding = JSON.parse(JSON.stringify(metadata.branding));
					}
				}

				// Ensure all optional properties are initialized to prevent undefined binding errors
				fields.forEach((field) => {
					// Initialize description and placeholder if missing
					if (field.description === undefined) field.description = '';
					if (field.placeholder === undefined) field.placeholder = '';

					// Ensure options exist for radio/checkbox fields
					if ((field.type === 'radio' || field.type === 'checkbox') && !field.options) {
						field.options = [];
					}

					// Initialize validation for number fields
					if (field.type === 'number' && !field.validation) {
						field.validation = { min: undefined, max: undefined };
					}

					// Initialize file upload properties
					if (field.type === 'file') {
						if (field.allowedFormats === undefined) field.allowedFormats = '';
						if (field.maxSizeMB === undefined) field.maxSizeMB = 10;
						if (field.allowMultiple === undefined) field.allowMultiple = false;
					}
				});
			} catch (parseError) {
				console.error('Error parsing form schema:', parseError);
			}
		}

		loading = false;
	}

	function generateFieldId() {
		return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// Update allowedFormats string when selections change
	function updateAllowedFormats() {
		if (!selectedField || selectedField.type !== 'file') return;

		const allFormats = [...selectedFormats];
		if (customFormats.trim()) {
			// Split custom formats by comma and trim whitespace
			const custom = customFormats.split(',').map(f => f.trim()).filter(f => f);
			allFormats.push(...custom);
		}

		selectedField.allowedFormats = allFormats.join(', ');
	}

	// Parse allowedFormats string into selectedFormats and customFormats
	function parseAllowedFormats(formats: string) {
		if (!formats) {
			selectedFormats = [];
			customFormats = '';
			return;
		}

		const formatsArray = formats.split(',').map(f => f.trim()).filter(f => f);
		const allPredefined = Object.values(FILE_FORMATS).flat();

		selectedFormats = formatsArray.filter(f => allPredefined.includes(f));
		const custom = formatsArray.filter(f => !allPredefined.includes(f));
		customFormats = custom.join(', ');
	}

	// Toggle format selection
	function toggleFormat(format: string) {
		if (selectedFormats.includes(format)) {
			selectedFormats = selectedFormats.filter(f => f !== format);
		} else {
			selectedFormats = [...selectedFormats, format];
		}
		updateAllowedFormats();
	}

	function addField(type: string) {
		const newField: any = {
			id: generateFieldId(),
			type,
			label: type === 'pageBreak' ? `Step ${fields.filter((f) => f.type === 'pageBreak').length + 2}` : `New ${type} field`,
			description: '',
			placeholder: '',
			required: false,
			order: fields.length + 1
		};

		// Add type-specific defaults
		if (type === 'radio' || type === 'checkbox') {
			newField.options = [
				{
					label: 'Option 1',
					value: 'option1',
					score: scoringEnabled ? 1 : undefined
				},
				{
					label: 'Option 2',
					value: 'option2',
					score: scoringEnabled ? 2 : undefined
				}
			];
		}

		if (type === 'number') {
			newField.validation = { min: undefined, max: undefined };
		}

		if (type === 'file') {
			newField.allowedFormats = '';
			newField.maxSizeMB = 10;
			newField.allowMultiple = false;
		}

		// Add default weight for pageBreak when scoring enabled
		if (type === 'pageBreak' && scoringEnabled) {
			const existingPageBreaks = fields.filter((f) => f.type === 'pageBreak').length;
			// Suggest equal distribution of remaining weight
			const usedWeight = totalWeight;
			const remainingWeight = 100 - usedWeight;
			const suggestedWeight =
				existingPageBreaks > 0
					? Math.round(remainingWeight / (existingPageBreaks + 1))
					: 100;
			newField.weight = suggestedWeight;
		}

		fields = [...fields, newField];
		selectedFieldId = newField.id;
	}

	function selectField(fieldId: string) {
		selectedFieldId = fieldId;
	}

	function deleteField(fieldId: string) {
		fields = fields.filter((f) => f.id !== fieldId);
		if (selectedFieldId === fieldId) {
			selectedFieldId = null;
		}
	}

	function duplicateField(fieldId: string) {
		const field = fields.find((f) => f.id === fieldId);
		if (!field) return;

		const duplicated = {
			...JSON.parse(JSON.stringify(field)),
			id: generateFieldId(),
			label: `${field.label} (Copy)`,
			order: fields.length + 1
		};

		fields = [...fields, duplicated];
		selectedFieldId = duplicated.id;
	}

	function moveFieldUp(index: number) {
		if (index === 0) return;
		const newFields = [...fields];
		[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
		fields = newFields;
	}

	function moveFieldDown(index: number) {
		if (index === fields.length - 1) return;
		const newFields = [...fields];
		[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
		fields = newFields;
	}

	function addOption() {
		if (!selectedField || (selectedField.type !== 'radio' && selectedField.type !== 'checkbox'))
			return;

		// Initialize options array if it doesn't exist
		if (!selectedField.options) {
			selectedField.options = [];
		}

		const optionNum = selectedField.options.length + 1;
		selectedField.options = [
			...selectedField.options,
			{
				label: `Option ${optionNum}`,
				value: `option${optionNum}`,
				score: scoringEnabled ? optionNum : undefined
			}
		];
	}

	function removeOption(index: number) {
		if (!selectedField || !selectedField.options) return;
		selectedField.options = selectedField.options.filter((_: any, i: number) => i !== index);
	}

	// Drag and drop handlers
	function handleDragStart(e: DragEvent, fieldId: string) {
		draggedFieldId = fieldId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', fieldId);
		}
	}

	function handleDragOver(e: DragEvent, fieldId: string) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		dragOverFieldId = fieldId;
	}

	function handleDragLeave() {
		dragOverFieldId = null;
	}

	function handleDrop(e: DragEvent, targetFieldId: string) {
		e.preventDefault();
		dragOverFieldId = null;

		if (!draggedFieldId || draggedFieldId === targetFieldId) {
			draggedFieldId = null;
			return;
		}

		const draggedIndex = fields.findIndex((f) => f.id === draggedFieldId);
		const targetIndex = fields.findIndex((f) => f.id === targetFieldId);

		if (draggedIndex === -1 || targetIndex === -1) {
			draggedFieldId = null;
			return;
		}

		// Reorder fields
		const newFields = [...fields];
		const [draggedField] = newFields.splice(draggedIndex, 1);
		newFields.splice(targetIndex, 0, draggedField);
		fields = newFields;

		draggedFieldId = null;
	}

	function handleDragEnd() {
		draggedFieldId = null;
		dragOverFieldId = null;
	}

	async function saveForm() {
		saving = true;

		// Validation for scoring
		if (scoringEnabled) {
			const pageBreaks = fields.filter((f) => f.type === 'pageBreak');

			// For multi-step: warn if no sections defined
			if (formType === 'multi-step' && pageBreaks.length === 0) {
				saving = false;
				showConfirm(
					'No Sections Defined',
					'Scoring is enabled but no page breaks (sections) are defined. Section weights cannot be assigned. Continue saving anyway?',
					() => { saving = true; doSave(); }
				);
				return;
			}

			// For multi-step with sections: warn if weights don't sum to 100
			if (formType === 'multi-step' && pageBreaks.length > 0 && totalWeight !== 100) {
				saving = false;
				showConfirm(
					'Weights Do Not Sum to 100%',
					`Section weights currently sum to ${totalWeight}%. Saving with unbalanced weights may affect scoring results. Continue saving anyway?`,
					() => {
						const scoredFields2 = fields.filter((f) => f.type === 'radio' || f.type === 'checkbox');
						const missing2 = scoredFields2.filter((f) =>
							f.options?.some((opt: any) => opt.score === undefined || opt.score === null)
						);
						if (missing2.length > 0) {
							showConfirm(
								'Missing Option Scores',
								`${missing2.length} field(s) have options without scores assigned. Continue saving anyway?`,
								() => { saving = true; doSave(); }
							);
						} else {
							saving = true;
							doSave();
						}
					}
				);
				return;
			}

			// Warn if any scored fields have options without scores
			const scoredFields = fields.filter((f) => f.type === 'radio' || f.type === 'checkbox');
			const fieldsWithMissingScores = scoredFields.filter((f) =>
				f.options?.some((opt: any) => opt.score === undefined || opt.score === null)
			);

			if (fieldsWithMissingScores.length > 0) {
				saving = false;
				showConfirm(
					'Missing Option Scores',
					`${fieldsWithMissingScores.length} field(s) have options without scores assigned. Continue saving anyway?`,
					() => { saving = true; doSave(); }
				);
				return;
			}
		}

		doSave();
	}

	async function doSave() {
		saving = true;

		console.log('Saving form with data:', {
			title: formTitle,
			description: formDescription,
			formType,
			scoringEnabled,
			fields,
			branding
		});

		// Prepare schema and metadata as objects (not stringified)
		const schema = {
			fields
		};

		const metadata = {
			formType,
			scoringEnabled,
			description: formDescription,
			branding  // Keep branding as nested object
		};

		try {
			if (isNewForm) {
				// Create new form
				const { data, error } = await api.createForm({
					projectId,
					name: formTitle,
					description: formDescription,  // description is a top-level field
					schema,
					metadata
				});
				if (error || !data) {
					console.error('Error creating form:', error);
					alert(`Failed to create form: ${error || 'Unknown error'}`);
					saving = false;
					return;
				}

				// Redirect to the newly created form (or forms list)
				goto(`/projects/${projectId}/forms`);
			} else if (formId) {
				// Update existing form
				const { data, error } = await api.updateForm(formId, {
					name: formTitle,
					description: formDescription,
					schema,
					metadata
				});

				if (error || !data) {
					console.error('Error updating form:', error);
					alert(`Failed to update form: ${error || 'Unknown error'}`);
					saving = false;
					return;
				}

				goto(`/projects/${projectId}/forms`);
			}
		} catch (err) {
			console.error('Error saving form:', err);
			alert('An unexpected error occurred while saving the form.');
		}

		saving = false;
	}

	function toggleScoring(newValue: boolean) {
		if (!newValue && scoringEnabled) {
			// Turning scoring OFF
			const hasScores = fields.some(
				(f) =>
					(f.type === 'pageBreak' && f.weight) ||
					f.options?.some((opt: any) => opt.score !== undefined)
			);

			if (hasScores) {
				showConfirm(
					'Disable Scoring',
					'Disabling scoring will remove all section weights and option scores. This cannot be undone. Continue?',
					() => {
						// Remove all scores and weights
						fields = fields.map((f) => {
							const newField = { ...f };
							if (f.type === 'pageBreak') {
								delete newField.weight;
							}
							if (f.options) {
								newField.options = f.options.map((opt: any) => {
									const newOpt = { ...opt };
									delete newOpt.score;
									return newOpt;
								});
							}
							return newField;
						});
						scoringEnabled = newValue;
					}
				);
			}
		}

		scoringEnabled = newValue;
	}

	function goBack() {
		goto(`/projects/${projectId}/forms`);
	}

	function getFieldTypeIcon(type: string) {
		const fieldType = fieldTypes.find((ft) => ft.type === type);
		return fieldType?.icon || icons.Type(18);
	}

	function getFieldTypeColor(type: string) {
		const fieldType = fieldTypes.find((ft) => ft.type === type);
		return fieldType?.color || 'text-slate-600';
	}

	function openPreview() {
		// Store current form state in localStorage for preview
		localStorage.setItem(
			'formPreviewData',
			JSON.stringify({
				title: formTitle,
				description: formDescription,
				formType,
				fields,
				branding
			})
		);

		// Open preview in new tab
		window.open(
			`/projects/${projectId}/forms/${formId}/preview`,
			'_blank',
			'noopener,noreferrer'
		);
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (
			(e.key === 'Delete' || e.key === 'Backspace') &&
			selectedFieldId &&
			document.activeElement?.tagName !== 'INPUT' &&
			document.activeElement?.tagName !== 'TEXTAREA' &&
			!(document.activeElement as HTMLElement)?.isContentEditable
		) {
			e.preventDefault();
			deleteField(selectedFieldId);
		}
	}}
/>

{#if loading}
	<!-- Loading Skeleton State -->
	<div class="flex h-screen flex-col bg-slate-50">
		<!-- Top Bar Skeleton -->
		<div class="border-b border-slate-200 bg-white px-6 py-4">
			<div class="flex items-center justify-between">
				<Skeleton class="h-5 w-96" />
				<div class="flex items-center gap-3">
					<Skeleton class="h-9 w-24" />
					<Skeleton class="h-9 w-28" />
				</div>
			</div>
		</div>

		<!-- Three-Panel Layout Skeleton -->
		<div class="flex flex-1 overflow-hidden">
			<!-- LEFT PANEL -->
			<div class="w-64 border-r border-slate-200 bg-white p-4">
				<Skeleton class="h-5 w-24 mb-4" />
				<div class="space-y-2">
					{#each Array(6) as _}
						<Skeleton class="h-10 w-full" />
					{/each}
				</div>
			</div>

			<!-- CENTER PANEL -->
			<div class="flex-1 p-8">
				<div class="max-w-3xl mx-auto">
					<div class="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
						<Skeleton class="h-12 w-3/4 mb-4" />
						<Skeleton class="h-20 w-full mb-8" />
						<div class="space-y-4">
							{#each Array(3) as _}
								<Skeleton class="h-32 w-full" />
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- RIGHT PANEL -->
			<div class="w-80 border-l border-slate-200 bg-white p-4">
				<Skeleton class="h-5 w-32 mb-4" />
				<div class="space-y-4">
					<Skeleton class="h-20 w-full" />
					<Skeleton class="h-20 w-full" />
					<Skeleton class="h-20 w-full" />
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-screen flex-col bg-slate-50">
		<!-- Top Bar -->
		<div class="border-b border-slate-200 bg-white shadow-sm">
			<div class="flex items-center justify-between px-6 py-4">
				<!-- Left Side: Breadcrumbs & Form Settings -->
				<div class="flex items-center gap-6">
					<Breadcrumbs items={breadcrumbItems} />

					<!-- Divider -->
					<div class="h-6 w-px bg-slate-300"></div>

					<!-- Form Type Toggle -->
					<div class="flex items-center gap-1.5">
						<span class="text-xs font-medium text-slate-500 mr-1">Type:</span>
						<div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
							<button
								onclick={() => {
									if (formType === 'multi-step') {
										const pageBreaks = fields.filter((f) => f.type === 'pageBreak');
										if (pageBreaks.length > 0) {
											showConfirm(
												'Switch to Single Page',
												'This will remove all page breaks' + (scoringEnabled ? ' and section weights' : '') + ' from your form. Continue?',
												() => {
													fields = fields.filter((f) => f.type !== 'pageBreak');
													if (selectedFieldId && !fields.find((f) => f.id === selectedFieldId)) {
														selectedFieldId = null;
													}
													formType = 'single-page';
												}
											);
											return;
										}
									}
									formType = 'single-page';
								}}
								class={cn(
									'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
									formType === 'single-page'
										? 'bg-white text-slate-900 shadow-sm'
										: 'text-slate-600 hover:text-slate-900'
								)}
								title="Single Page"
							>
								{@html icons.FileText(14)}
								<span>Single</span>
							</button>
							<button
								onclick={() => (formType = 'multi-step')}
								class={cn(
									'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
									formType === 'multi-step'
										? 'bg-white text-slate-900 shadow-sm'
										: 'text-slate-600 hover:text-slate-900'
								)}
								title="Multi-Step"
							>
								{@html icons.Layers(14)}
								<span>Multi-Step</span>
							</button>
						</div>
					</div>

					<!-- Scoring Toggle -->
					<div class="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
						<input
							type="checkbox"
							id="scoring-enabled-toolbar"
							checked={scoringEnabled}
							onchange={(e) => toggleScoring(e.currentTarget.checked)}
							class="rounded text-blue-600 w-4 h-4 cursor-pointer"
						/>
						<label
							for="scoring-enabled-toolbar"
							class="cursor-pointer text-xs font-medium text-slate-700 flex items-center gap-1.5"
						>
							{@html icons.Award(14)}
							<span>Enable Scoring</span>
						</label>
						{#if scoringEnabled && formType === 'multi-step' && fields.some((f: any) => f.type === 'pageBreak')}
							<div class="h-4 w-px bg-slate-300"></div>
							<span class="text-xs text-blue-600 font-semibold">
								{totalWeight}%
							</span>
						{/if}
					</div>
				</div>

				<!-- Right Side: Actions -->
				<div class="flex items-center gap-3">
					<Button variant="outline" size="sm" onclick={() => brandingDialogOpen = true}>
						{@html icons.Image(16)}
						<span class="ml-2">Branding</span>
					</Button>
					<Button variant="outline" size="sm" onclick={openPreview}>
						{@html icons.Eye(16)}
						<span class="ml-2">Preview</span>
					</Button>
					<Button size="sm" onclick={saveForm} loading={saving}>
						<span class="mr-2">Save Form</span>
					</Button>
				</div>
			</div>
		</div>

		<!-- Three-Panel Layout -->
		<div class="flex flex-1 overflow-hidden">
			<!-- LEFT PANEL: Field Palette -->
			<div class="w-72 border-r border-slate-200 bg-slate-50 p-5 overflow-y-auto">
				<div class="mb-4">
					<h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
						Field Types
					</h3>
					<p class="text-xs text-slate-500">Click to add to your form</p>
				</div>

				<div class="space-y-1.5">
					{#each fieldTypes as { type, icon, label, color }}
						<button
							onclick={() => addField(type)}
							class="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg bg-white hover:bg-blue-50 transition-all border border-slate-200 hover:border-blue-300 hover:shadow-sm text-left group"
						>
							<span
								class={cn(
									'transition-all flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100',
									color
								)}
							>
								{@html icon}
							</span>
							<span class="text-slate-700 font-medium group-hover:text-blue-700">{label}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- CENTER PANEL: Canvas -->
			<div class="flex-1 p-8 overflow-y-auto bg-linear-to-br from-slate-50 to-slate-100/50">
				<div class="max-w-3xl mx-auto">
					<div class="bg-white rounded-xl shadow-md border border-slate-200 p-10 mb-8 relative overflow-hidden">
						<!-- Watermark Overlay -->
						{#if branding.watermark.url}
							<div class="absolute inset-0 pointer-events-none z-0">
								<img
									src={branding.watermark.url}
									alt="Watermark"
									class="absolute object-contain {
										branding.watermark.position === 'center'
											? `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${branding.watermark.size === 'small' ? 'w-1/4' : branding.watermark.size === 'large' ? 'w-3/4' : 'w-1/2'}`
											: branding.watermark.position === 'top-right'
											? `top-8 right-8 ${branding.watermark.size === 'small' ? 'w-1/6' : branding.watermark.size === 'large' ? 'w-1/2' : 'w-1/3'}`
											: branding.watermark.position === 'bottom-right'
											? `bottom-8 right-8 ${branding.watermark.size === 'small' ? 'w-1/6' : branding.watermark.size === 'large' ? 'w-1/2' : 'w-1/3'}`
											: `bottom-8 left-1/2 -translate-x-1/2 ${branding.watermark.size === 'small' ? 'w-1/6' : branding.watermark.size === 'large' ? 'w-1/2' : 'w-1/3'}`
									}"
									style="opacity: {branding.watermark.opacity / 100}"
								/>
							</div>
						{/if}

						<!-- Form Header -->
						<div class="mb-8 pb-6 border-b border-slate-200 relative z-10">
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

							<input
								type="text"
								bind:value={formTitle}
								placeholder="Untitled Form"
								class="text-3xl font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-2 w-full -ml-3 hover:bg-slate-50 transition-colors"
							/>
							<textarea
								bind:value={formDescription}
								placeholder="Form description (optional)"
								class="text-slate-600 mt-3 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-2 w-full -ml-3 resize-none hover:bg-slate-50 transition-colors"
								rows="2"
							></textarea>

							<!-- Weight Warning -->
							{#if weightWarning}
								<div
									class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2"
								>
									<span class="text-amber-600">{@html icons.AlertTriangle(16)}</span>
									<div class="text-sm text-amber-800">
										<strong>Section weights must sum to 100%.</strong>
										Current total: <strong>{totalWeight}%</strong>
										{#if totalWeight < 100}
											— {100 - totalWeight}% remaining
										{:else}
											— {totalWeight - 100}% over limit
										{/if}
									</div>
								</div>
							{/if}

							<!-- No Sections Warning (only relevant for multi-step forms) -->
							{#if scoringEnabled && formType === 'multi-step' && fields.filter((f) => f.type === 'pageBreak').length === 0}
								{#if scoringInfoDismissed}
									<button
										class="mt-3 w-full flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-700 transition-colors"
										onclick={() => (scoringInfoDismissed = false)}
									>
										<span>{@html icons.Info(13)}</span>
										<span>Show scoring tip</span>
									</button>
								{:else}
									<div class="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
										<div class="flex items-start gap-3">
											<span class="text-orange-600 mt-0.5">{@html icons.Info(18)}</span>
											<div class="flex-1">
												<div class="flex items-start justify-between gap-2 mb-1">
													<p class="text-sm font-semibold text-orange-900">
														Sections Required for Scoring
													</p>
													<button
														class="text-orange-400 hover:text-orange-700 transition-colors shrink-0 mt-0.5"
														onclick={() => (scoringInfoDismissed = true)}
														aria-label="Dismiss"
													>
														{@html icons.X(14)}
													</button>
												</div>
												<p class="text-sm text-orange-800 mb-3">
													Scoring requires sections (page breaks) to define weights. Add page breaks from the left panel to create sections.
												</p>
											</div>
										</div>
									</div>
								{/if}
							{/if}
						</div>

						<!-- Fields -->
						<div class="relative z-10">
						{#each fields as field, index (field.id)}
							{#if field.type === 'pageBreak'}
								<!-- Page Break Separator -->
								<div
									draggable="true"
									ondragstart={(e) => handleDragStart(e, field.id)}
									ondragover={(e) => handleDragOver(e, field.id)}
									ondragleave={handleDragLeave}
									ondrop={(e) => handleDrop(e, field.id)}
									ondragend={handleDragEnd}
									class={cn(
										'mb-6 py-4 px-5 rounded-xl border-2 border-dashed transition-all duration-200 cursor-move',
										selectedFieldId === field.id
											? 'border-blue-400 bg-blue-50/50'
											: 'border-slate-300 bg-slate-50/50 hover:border-slate-400',
										draggedFieldId === field.id && 'opacity-50',
										dragOverFieldId === field.id && 'border-blue-500 bg-blue-100/50'
									)}
									onclick={() => selectField(field.id)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											selectField(field.id);
										}
									}}
									role="button"
									tabindex="0"
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<span class="text-slate-500">{@html icons.Scissors(20)}</span>
											<div>
												<div class="font-semibold text-slate-900">{field.label}</div>
												<div class="text-xs text-slate-500 mt-0.5">Step separator</div>
											</div>
										</div>

										<div class="flex items-center gap-3">
											<!-- Section max score badge (only when scoring enabled) -->
											{#if scoringEnabled}
												{@const sectionData = sectionsWithFields.find((s) => s.pageBreakId === field.id)}
												{#if sectionData && sectionData.maxScore > 0}
													<div class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
														Max: {sectionData.maxScore} pts
													</div>
												{/if}
											{/if}
											<!-- Weight badge (only when scoring enabled) -->
											{#if scoringEnabled && field.weight}
												<div
													class="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
												>
													{field.weight}%
												</div>
											{/if}

											<button
												onclick={(e) => {
													e.stopPropagation();
													deleteField(field.id);
												}}
												class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											>
												{@html icons.Trash(16)}
											</button>
										</div>
									</div>
								</div>
							{:else}
								<!-- Regular Field -->
								<div
									draggable="true"
									ondragstart={(e) => handleDragStart(e, field.id)}
									ondragover={(e) => handleDragOver(e, field.id)}
									ondragleave={handleDragLeave}
									ondrop={(e) => handleDrop(e, field.id)}
									ondragend={handleDragEnd}
									class={cn(
										'mb-4 p-5 rounded-xl border transition-all duration-200 cursor-move group',
										selectedFieldId === field.id
											? 'border-blue-400 bg-blue-50/50 shadow-md ring-2 ring-blue-100'
											: 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
										draggedFieldId === field.id && 'opacity-50',
										dragOverFieldId === field.id && 'border-blue-500 bg-blue-100/50 ring-2 ring-blue-200'
									)}
									onclick={() => selectField(field.id)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											selectField(field.id);
										}
									}}
									role="button"
									tabindex="0"
								>
									<div class="flex items-start gap-4">
										<!-- Drag Handle -->
										<div
											class="text-slate-400 cursor-move pt-1 hover:text-slate-600 transition-colors"
										>
											{@html icons.GripVertical(18)}
										</div>

										<div class="flex-1 min-w-0">
											<!-- Field Label with Icon -->
											<div class="flex items-center gap-2 mb-1">
												<span class={getFieldTypeColor(field.type)}>
													{@html getFieldTypeIcon(field.type)}
												</span>
												<div class="font-semibold text-slate-900">
													{field.label}
													{#if field.required}
														<span class="text-red-500">*</span>
													{/if}
												</div>
											</div>

											<!-- Field Description -->
											{#if field.description}
												<div class="text-sm text-slate-500 italic mb-3">({field.description})</div>
											{/if}

											<!-- Field Preview -->
											<div class="mt-3">
												{#if field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'url'}
													<input
														type="text"
														placeholder={field.placeholder || 'Your answer'}
														disabled
														class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50/50"
													/>
												{:else if field.type === 'textarea'}
													<textarea
														placeholder={field.placeholder || 'Your answer'}
														disabled
														rows="3"
														class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50/50"
													></textarea>
												{:else if field.type === 'number'}
													<input
														type="number"
														placeholder="0"
														disabled
														class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50/50"
													/>
												{:else if field.type === 'date'}
													<input
														type="date"
														disabled
														class="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50/50"
													/>
												{:else if field.type === 'radio' && field.options}
													<div class="space-y-2.5">
														{#each field.options as option}
															<label class="flex items-center gap-3">
																<input type="radio" disabled class="text-blue-600" />
																<span class="text-sm text-slate-700">{option.label}</span>
															</label>
														{/each}
													</div>
												{:else if field.type === 'checkbox' && field.options}
													<div class="space-y-2.5">
														{#each field.options as option}
															<label class="flex items-center gap-3">
																<input type="checkbox" disabled class="text-blue-600 rounded" />
																<span class="text-sm text-slate-700">{option.label}</span>
															</label>
														{/each}
													</div>
												{:else if field.type === 'file'}
													<div
														class="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50/50"
													>
														<div class="flex justify-center text-slate-400 mb-2">{@html icons.Upload(24)}</div>
														<div class="text-slate-500 text-sm">Click to upload or drag and drop</div>
													</div>
												{:else if field.type === 'location'}
													<div
														class="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex items-center gap-2"
													>
														<span class="text-slate-500">{@html icons.MapPin(18)}</span>
														<div class="text-sm text-slate-600">GPS Location will be captured</div>
													</div>
												{/if}
											</div>
										</div>

										<!-- Quick Actions -->
										<div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<button
												onclick={(e) => {
													e.stopPropagation();
													moveFieldUp(index);
												}}
												disabled={index === 0}
												class="p-1.5 hover:bg-slate-200 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
												title="Move up"
											>
												<span class="inline-block -rotate-90 text-slate-600">
													{@html icons.ChevronRight(16)}
												</span>
											</button>
											<button
												onclick={(e) => {
													e.stopPropagation();
													moveFieldDown(index);
												}}
												disabled={index === fields.length - 1}
												class="p-1.5 hover:bg-slate-200 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
												title="Move down"
											>
												<span class="inline-block rotate-90 text-slate-600">
													{@html icons.ChevronRight(16)}
												</span>
											</button>
										</div>
									</div>
								</div>
							{/if}
						{/each}

						<!-- Empty State / Add Field Prompt -->
						{#if fields.length === 0}
							<div class="flex flex-col items-center justify-center py-20 text-slate-500">
								<div class="flex items-center justify-center w-16 h-16 mb-4 bg-slate-100 rounded-full">
									<span class="text-slate-400">{@html icons.ClipboardList(32)}</span>
								</div>
								<p class="text-lg font-semibold text-slate-700 mb-2">No fields yet</p>
								<p class="text-sm text-slate-500">Click a field type on the left to add it to your form</p>
							</div>
						{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- RIGHT PANEL: Properties -->
			<div class="w-80 border-l border-slate-200 bg-slate-50 p-5 overflow-y-auto">
				{#if selectedField}
					<div class="mb-5 pb-4 border-b border-slate-300">
						<h3 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
							{selectedField.type === 'pageBreak' ? 'Step Settings' : 'Field Settings'}
						</h3>
						<p class="text-xs text-slate-500">Configure field properties</p>
					</div>

					{#if selectedField.type === 'pageBreak'}
						<!-- Page Break Properties -->
						<div class="space-y-5">
							<div>
								<Label for="step-label" class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Step Title *</Label>
								<Input
									id="step-label"
									bind:value={selectedField.label}
									placeholder="e.g., Personal Information"
									class="mt-1"
								/>
							</div>

							<div>
								<Label for="step-description" class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Step Description</Label>
								<Input
									id="step-description"
									bind:value={selectedField.description}
									placeholder="Optional description"
									class="mt-1"
								/>
							</div>

							<!-- Weight Input (only when scoring enabled) -->
							{#if scoringEnabled}
								{#if selectedField.weight === undefined}{(selectedField.weight = 0) || ''}{/if}
								<div class="border-t border-slate-200 pt-5">
									<Label
										for="section-weight"
										class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2"
									>
										Section Weight (%)
									</Label>
									<div class="flex items-center gap-2 mt-1">
										<Input
											id="section-weight"
											type="number"
											bind:value={selectedField.weight}
											onchange={() => {
												if (selectedField.weight === undefined) selectedField.weight = 0;
											}}
											placeholder="e.g., 25"
											min="0"
											max="100"
											class="flex-1"
										/>
										<span class="text-sm text-slate-600">%</span>
									</div>
									<p class="text-xs text-slate-500 mt-1.5">
										Weight of this section in total score. All sections should sum to 100%.
									</p>
								</div>
							{/if}

							<!-- Section Fields Info (only when scoring enabled) -->
							{#if scoringEnabled}
								{@const sectionData = sectionsWithFields.find((s) => s.pageBreakId === selectedField.id)}
								{#if sectionData}
									<div class="border-t border-slate-200 pt-5">
										<Label class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
											Fields in This Section ({sectionData.fields.length})
										</Label>
										{#if sectionData.fields.length === 0}
											<p class="text-xs text-slate-400 italic mt-2">No fields precede this section break.</p>
										{:else}
											<ul class="mt-2 space-y-1.5 mb-3">
												{#each sectionData.fields as sf}
													<li class="flex items-center gap-1.5 text-xs text-slate-600 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200">
														<span class={getFieldTypeColor(sf.type)}>{@html getFieldTypeIcon(sf.type)}</span>
														<span class="truncate">{sf.label}</span>
													</li>
												{/each}
											</ul>
											<p class="text-xs text-slate-500">
												Max achievable score: <strong class="text-slate-700">{sectionData.maxScore} pts</strong>
											</p>
										{/if}
									</div>
								{/if}
							{/if}

							<div class="border-t border-slate-200 pt-5 mt-6">
								<Button
									variant="destructive"
									class="w-full"
									onclick={() => deleteField(selectedField.id)}
								>
									{@html icons.Trash(16)}
									<span class="ml-2">Remove Page Break</span>
								</Button>
							</div>
						</div>
					{:else}
						<!-- Regular Field Properties -->
						<div class="space-y-5">
							<!-- Label -->
							<div>
								<Label for="field-label" class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Question *</Label>
								<Input
									id="field-label"
									bind:value={selectedField.label}
									placeholder="Enter question"
									class="mt-1"
								/>
							</div>

							<!-- Description -->
							<div>
								<Label for="field-description" class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Help Text</Label>
								<Input
									id="field-description"
									bind:value={selectedField.description}
									placeholder="Optional description"
									class="mt-1"
								/>
							</div>

							<!-- Placeholder (for text-based fields) -->
							{#if ['text', 'textarea', 'email', 'phone', 'url'].includes(selectedField.type)}
								<div>
									<Label for="field-placeholder" class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Placeholder</Label>
									<Input
										id="field-placeholder"
										bind:value={selectedField.placeholder}
										placeholder="Placeholder text"
										class="mt-1"
									/>
								</div>
							{/if}

							<!-- Options (for choice fields) -->
							{#if (selectedField.type === 'radio' || selectedField.type === 'checkbox') && selectedField.options}
								<div>
									<Label class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Options</Label>
									<div class="space-y-2 mt-2">
										{#each selectedField.options as option, i}
											<div class="flex gap-2">
												<Input
													bind:value={option.label}
													placeholder="Option {i + 1}"
													class="flex-1"
												/>

												<!-- Score input (only when scoring enabled) -->
													{#if scoringEnabled}
														<input
															type="number"
															bind:value={option.score}
															placeholder="Score"
															min={0}
															max={100}
															class="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm"
															title="Score for this option"
														/>
													{/if}

												<button
													onclick={() => removeOption(i)}
													class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
													disabled={!selectedField.options || selectedField.options.length <= 2}
												>
													{@html icons.X(16)}
												</button>
											</div>
										{/each}
									</div>

									<!-- Score range hint -->
									{#if scoringEnabled}
										<p class="text-xs text-slate-500 mt-2">
											Assign numeric scores to each option (e.g., 1-5 for Likert scale)
										</p>
									{/if}

									<Button variant="outline" size="sm" onclick={addOption} class="w-full mt-3">
										{@html icons.Plus(16)}
										<span class="ml-2">Add Option</span>
									</Button>
								</div>
							{/if}

							<!-- Number validation -->
							{#if selectedField.type === 'number'}
								<div>
									<Label class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Validation</Label>
									<div class="grid grid-cols-2 gap-3 mt-2">
										<div>
											<Label for="field-min" class="text-xs text-slate-600 mb-1">Min Value</Label>
											<input
												id="field-min"
												type="number"
												bind:value={selectedField.validation.min}
												placeholder="Min"
												class="mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm w-full"
											/>
										</div>
										<div>
											<Label for="field-max" class="text-xs text-slate-600 mb-1">Max Value</Label>
											<input
												id="field-max"
												type="number"
												bind:value={selectedField.validation.max}
												placeholder="Max"
												class="mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm w-full"
											/>
										</div>
									</div>
								</div>
							{/if}

							<!-- File upload configuration -->
							{#if selectedField.type === 'file'}
								<div>
									<Label class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3"
										>File Settings</Label
									>
									<div class="space-y-4 mt-2">
										<div>
											<Label class="text-xs text-slate-600 mb-2">Allowed Formats</Label>

											<!-- Predefined formats by category -->
											<div class="space-y-2 max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2">
												{#each Object.entries(FILE_FORMATS) as [category, formats]}
													<div>
														<p class="text-xs font-semibold text-slate-700 mb-1">{category}</p>
														<div class="grid grid-cols-2 gap-1">
															{#each formats as format}
																<label class="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-slate-50 px-1 py-1 rounded">
																	<input
																		type="checkbox"
																		checked={selectedFormats.includes(format)}
																		onchange={() => toggleFormat(format)}
																		class="rounded text-blue-600 w-3 h-3 shrink-0"
																	/>
																	<span class="font-mono text-slate-700 truncate">{format}</span>
																</label>
															{/each}
														</div>
													</div>
												{/each}
											</div>

											<!-- Selected format chips -->
											{#if selectedFormats.length > 0}
												<div class="mt-2 flex flex-wrap gap-1">
													{#each selectedFormats as fmt}
														<span class="inline-flex items-center gap-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono rounded px-1.5 py-0.5">
															{fmt}
															<button
																class="ml-0.5 text-blue-400 hover:text-blue-700"
																onclick={() => toggleFormat(fmt)}
																aria-label="Remove {fmt}"
															>&#x2715;</button>
														</span>
													{/each}
												</div>
											{/if}

											<!-- Custom formats input -->
											<div class="mt-2">
												<Label for="custom-formats" class="text-xs text-slate-600 mb-1">
													Custom Formats
												</Label>
												<Input
													id="custom-formats"
													type="text"
													bind:value={customFormats}
													onblur={updateAllowedFormats}
													placeholder="e.g., .xyz, .abc"
													class="mt-1 text-xs font-mono"
												/>
												<p class="text-xs text-slate-500 mt-1">
													Add custom formats not in the list (comma-separated)
												</p>
											</div>
										</div>
										
										<div>
											<Label for="file-max-size" class="text-xs text-slate-600 mb-1"
												>Max File Size (MB)</Label
											>
											<input
												id="file-max-size"
												type="number"
												bind:value={selectedField.maxSizeMB}
												placeholder="e.g., 5"
												min="1"
												max="100"
												class="mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm w-full"
											/>
										</div>

										<div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
											<input
												type="checkbox"
												id="file-multiple"
												bind:checked={selectedField.allowMultiple}
												class="rounded text-blue-600"
											/>
											<Label for="file-multiple" class="cursor-pointer text-sm font-medium">
												Allow multiple files
											</Label>
										</div>
									</div>
								</div>
							{/if}

							<!-- Required toggle -->
							<div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
								<input
									type="checkbox"
									id="field-required"
									bind:checked={selectedField.required}
									class="rounded text-blue-600"
								/>
								<Label for="field-required" class="cursor-pointer text-sm font-medium">
									Required field
								</Label>
							</div>

							<!-- Actions -->
							<div class="border-t border-slate-200 pt-5 mt-6 space-y-2">
								<Button
									variant="outline"
									class="w-full"
									onclick={() => duplicateField(selectedField.id)}
								>
									{@html icons.Copy(16)}
									<span class="ml-2">Duplicate Field</span>
								</Button>
								<Button
									variant="destructive"
									class="w-full"
									onclick={() => deleteField(selectedField.id)}
								>
									{@html icons.Trash(16)}
									<span class="ml-2">Delete Field</span>
								</Button>
							</div>
						</div>
					{/if}
				{:else}
					<div class="flex flex-col items-center justify-center mt-20 text-slate-500">
						<div class="flex items-center justify-center w-14 h-14 mb-4 bg-slate-100 rounded-full">
							<span class="text-slate-400">{@html icons.Edit(28)}</span>
						</div>
						<p class="text-sm font-semibold text-slate-700 mb-1">No field selected</p>
						<p class="text-xs text-slate-500">Click on a field to edit its properties</p>
					</div>
				{/if}
			</div>
		</div>

	<!-- Custom Confirm Dialog -->
	{#if confirmDialog.open}
		<div
			class="fixed inset-0 z-100 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
		>
			<div class="absolute inset-0 bg-black/50" onclick={closeConfirm} role="none"></div>
			<div class="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95">
				<h3 class="text-base font-semibold text-slate-900 mb-2">{confirmDialog.title}</h3>
				<p class="text-sm text-slate-600 mb-6">{confirmDialog.message}</p>
				<div class="flex justify-end gap-3">
					<button
						class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
						onclick={closeConfirm}
					>
						Cancel
					</button>
					<button
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
						onclick={() => { closeConfirm(); confirmDialog.onConfirm(); }}
					>
						Continue
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Branding Dialog -->
	{#if brandingDialogOpen}
		<div
			class="fixed inset-0 z-100 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
		>
			<div class="absolute inset-0 bg-black/50" onclick={() => brandingDialogOpen = false} role="none"></div>
			<div class="relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col">
				<!-- Header -->
				<div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
					<div>
						<h3 class="text-lg font-semibold text-slate-900">Form Branding</h3>
						<p class="text-xs text-slate-500 mt-0.5">Customize your form's appearance with logo and watermark</p>
					</div>
					<button
						class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
						onclick={() => brandingDialogOpen = false}
					>
						{@html icons.X(20)}
					</button>
				</div>

				<!-- Content -->
				<div class="flex-1 overflow-y-auto">
					<div class="grid grid-cols-2 gap-6 p-6">
						<!-- Left Column: Settings -->
						<div class="space-y-6">
							<!-- Logo Section -->
							<div class="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
								<div class="flex items-center gap-2 mb-4">
									<div class="p-2 bg-blue-600 text-white rounded-lg">
										{@html icons.Image(18)}
									</div>
									<div>
										<h4 class="text-sm font-semibold text-slate-900">Logo</h4>
										<p class="text-xs text-slate-600">Appears at the top of your form</p>
									</div>
								</div>

								<div class="space-y-4">
									<div>
										<Label for="logo-url" class="text-xs font-semibold text-slate-700 mb-2">
											Image URL
										</Label>
										<Input
											id="logo-url"
											bind:value={branding.logo.url}
											placeholder="https://example.com/logo.png"
											class="mt-1 bg-white"
										/>
									</div>

									<div>
										<Label class="text-xs font-semibold text-slate-700 mb-3 block">
											Position
										</Label>
										<div class="grid grid-cols-3 gap-2">
											<button
												onclick={() => branding.logo.position = 'top-left'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.logo.position === 'top-left'
														? 'border-blue-500 bg-blue-50 text-blue-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Top Left
											</button>
											<button
												onclick={() => branding.logo.position = 'top-center'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.logo.position === 'top-center'
														? 'border-blue-500 bg-blue-50 text-blue-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Center
											</button>
											<button
												onclick={() => branding.logo.position = 'top-right'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.logo.position === 'top-right'
														? 'border-blue-500 bg-blue-50 text-blue-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Top Right
											</button>
										</div>
									</div>

									<div>
										<Label class="text-xs font-semibold text-slate-700 mb-3 block">
											Size
										</Label>
										<div class="grid grid-cols-3 gap-2">
											<button
												onclick={() => branding.logo.size = 'small'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.logo.size === 'small'
														? 'border-blue-500 bg-blue-50 text-blue-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Small
											</button>
											<button
												onclick={() => branding.logo.size = 'medium'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.logo.size === 'medium'
														? 'border-blue-500 bg-blue-50 text-blue-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Medium
											</button>
											<button
												onclick={() => branding.logo.size = 'large'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.logo.size === 'large'
														? 'border-blue-500 bg-blue-50 text-blue-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Large
											</button>
										</div>
									</div>
								</div>
							</div>

							<!-- Watermark Section -->
							<div class="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
								<div class="flex items-center gap-2 mb-4">
									<div class="p-2 bg-purple-600 text-white rounded-lg">
										{@html icons.Droplet(18)}
									</div>
									<div>
										<h4 class="text-sm font-semibold text-slate-900">Watermark</h4>
										<p class="text-xs text-slate-600">Background overlay for branding</p>
									</div>
								</div>

								<div class="space-y-4">
									<div>
										<Label for="watermark-url" class="text-xs font-semibold text-slate-700 mb-2">
											Image URL
										</Label>
										<Input
											id="watermark-url"
											bind:value={branding.watermark.url}
											placeholder="https://example.com/watermark.png"
											class="mt-1 bg-white"
										/>
									</div>

									<div>
										<Label class="text-xs font-semibold text-slate-700 mb-3 block">
											Position
										</Label>
										<div class="grid grid-cols-2 gap-2">
											<button
												onclick={() => branding.watermark.position = 'center'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.watermark.position === 'center'
														? 'border-purple-500 bg-purple-50 text-purple-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Center
											</button>
											<button
												onclick={() => branding.watermark.position = 'top-right'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.watermark.position === 'top-right'
														? 'border-purple-500 bg-purple-50 text-purple-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Top Right
											</button>
											<button
												onclick={() => branding.watermark.position = 'bottom-right'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.watermark.position === 'bottom-right'
														? 'border-purple-500 bg-purple-50 text-purple-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Bottom Right
											</button>
											<button
												onclick={() => branding.watermark.position = 'bottom-center'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.watermark.position === 'bottom-center'
														? 'border-purple-500 bg-purple-50 text-purple-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Bottom Center
											</button>
										</div>
									</div>

									<div>
										<Label class="text-xs font-semibold text-slate-700 mb-3 block">
											Size
										</Label>
										<div class="grid grid-cols-3 gap-2">
											<button
												onclick={() => branding.watermark.size = 'small'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.watermark.size === 'small'
														? 'border-purple-500 bg-purple-50 text-purple-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Small
											</button>
											<button
												onclick={() => branding.watermark.size = 'medium'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.watermark.size === 'medium'
														? 'border-purple-500 bg-purple-50 text-purple-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Medium
											</button>
											<button
												onclick={() => branding.watermark.size = 'large'}
												class={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
													branding.watermark.size === 'large'
														? 'border-purple-500 bg-purple-50 text-purple-700'
														: 'border-slate-200 bg-white hover:border-slate-300'
												}`}
											>
												Large
											</button>
										</div>
									</div>

									<div>
										<div class="flex items-center justify-between mb-2">
											<Label class="text-xs font-semibold text-slate-700">
												Opacity
											</Label>
											<span class="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
												{branding.watermark.opacity}%
											</span>
										</div>
										<input
											id="watermark-opacity"
											type="range"
											bind:value={branding.watermark.opacity}
											min="5"
											max="60"
											step="5"
											class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
										/>
										<div class="flex justify-between text-xs text-slate-500 mt-1">
											<span>Subtle</span>
											<span>Strong</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Right Column: Preview -->
						<div class="space-y-4">
							<div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
								<div class="flex items-center gap-2 mb-3">
									<span class="text-slate-600">{@html icons.Eye(16)}</span>
									<h4 class="text-sm font-semibold text-slate-900">Live Preview</h4>
								</div>

								<!-- Form Preview -->
								<div class="bg-white rounded-lg shadow-lg border border-slate-200 p-6 relative overflow-hidden min-h-96">
									<!-- Watermark Overlay -->
									{#if branding.watermark.url}
										<div class="absolute inset-0 pointer-events-none z-0">
											<img
												src={branding.watermark.url}
												alt="Watermark preview"
												class="absolute object-contain {
													branding.watermark.position === 'center'
														? `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${branding.watermark.size === 'small' ? 'w-1/3' : branding.watermark.size === 'large' ? 'w-3/4' : 'w-1/2'}`
														: branding.watermark.position === 'top-right'
														? `top-4 right-4 ${branding.watermark.size === 'small' ? 'w-1/4' : branding.watermark.size === 'large' ? 'w-1/2' : 'w-1/3'}`
														: branding.watermark.position === 'bottom-right'
														? `bottom-4 right-4 ${branding.watermark.size === 'small' ? 'w-1/4' : branding.watermark.size === 'large' ? 'w-1/2' : 'w-1/3'}`
														: `bottom-4 left-1/2 -translate-x-1/2 ${branding.watermark.size === 'small' ? 'w-1/4' : branding.watermark.size === 'large' ? 'w-1/2' : 'w-1/3'}`
												}"
												style="opacity: {branding.watermark.opacity / 100}"
												onerror={(e) => {
													const img = e.target as HTMLImageElement;
													img.style.display = 'none';
												}}
											/>
										</div>
									{/if}

									<!-- Form Content -->
									<div class="relative z-10">
										<!-- Logo -->
										{#if branding.logo.url}
											<div class="mb-6 flex {branding.logo.position === 'top-left' ? 'justify-start' : branding.logo.position === 'top-right' ? 'justify-end' : 'justify-center'}">
												<img
													src={branding.logo.url}
													alt="Logo preview"
													class="{branding.logo.size === 'small' ? 'h-10' : branding.logo.size === 'large' ? 'h-20' : 'h-14'} object-contain"
													onerror={(e) => {
														const img = e.target as HTMLImageElement;
														img.style.display = 'none';
													}}
												/>
											</div>
										{/if}

										<!-- Sample Form Content -->
										<div class="space-y-4">
											<div>
												<h3 class="text-xl font-bold text-slate-900">Sample Form Title</h3>
												<p class="text-sm text-slate-600 mt-1">This is a preview of how your branding will appear</p>
											</div>

											<div class="h-px bg-slate-200"></div>

											<div class="space-y-3">
												<div>
													<label for="preview-field-1" class="text-sm font-medium text-slate-700 block mb-1">Sample Field</label>
													<input id="preview-field-1" type="text" disabled class="w-full h-10 bg-slate-100 border border-slate-200 rounded" />
												</div>
												<div>
													<label for="preview-field-2" class="text-sm font-medium text-slate-700 block mb-1">Another Field</label>
													<input id="preview-field-2" type="text" disabled class="w-full h-10 bg-slate-100 border border-slate-200 rounded" />
												</div>
											</div>
										</div>
									</div>
								</div>

								<!-- Status Messages -->
								{#if !branding.logo.url && !branding.watermark.url}
									<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
										<p class="text-xs text-amber-800">
											<strong>Tip:</strong> Add a logo or watermark URL to see the preview
										</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
					<div class="flex items-center gap-2 text-xs text-slate-600">
						<span>{@html icons.Info(14)}</span>
						<span>Changes are saved automatically when you close this dialog</span>
					</div>
					<Button
						onclick={() => brandingDialogOpen = false}
					>
						{@html icons.Check(16)}
						<span class="ml-2">Done</span>
					</Button>
				</div>
			</div>
		</div>
	{/if}
	</div>
{/if}
