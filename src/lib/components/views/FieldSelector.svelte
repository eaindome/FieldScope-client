<script lang="ts">
	import Select from '$lib/components/ui/select.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import type { FormField } from '$lib/types/views';

	let {
		fields = [],
		value = $bindable(''),
		label = '',
		placeholder = 'Select field',
		required = false
	}: {
		fields: FormField[];
		value: string;
		label: string;
		placeholder?: string;
		required?: boolean;
	} = $props();

	// Group fields by form for better organization
	const groupedFields = $derived.by(() => {
		const groups = new Map<string, FormField[]>();
		fields.forEach((field) => {
			const formName = field.formName || 'Unknown Form';
			if (!groups.has(formName)) {
				groups.set(formName, []);
			}
			groups.get(formName)!.push(field);
		});
		return groups;
	});
</script>

<div class="space-y-2">
	<Label>
		{label}
		{#if required}<span class="text-red-500">*</span>{/if}
	</Label>
	{#if fields.length === 0}
		<Select disabled>
			<option value="">No fields to select</option>
		</Select>
		<p class="text-xs text-slate-500 mt-1">
			No compatible fields found. Ensure your form has fields of the appropriate type.
		</p>
	{:else}
		<Select bind:value>
			<option value="">-- {placeholder} --</option>
			{#each [...groupedFields].sort() as [formName, formFields]}
				{#if groupedFields.size > 1}
					<optgroup label={formName}>
						{#each formFields as field}
							<option value={field.id}>
								{field.label} ({field.type})
							</option>
						{/each}
					</optgroup>
				{:else}
					{#each formFields as field}
						<option value={field.id}>
							{field.label} ({field.type})
						</option>
					{/each}
				{/if}
			{/each}
		</Select>
	{/if}
</div>
