<script lang="ts">
	import { cn } from '$lib/utils';

	interface TextareaProps {
		placeholder?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		class?: string;
		name?: string;
		id?: string;
		rows?: number;
		autocomplete?: string;
	}

	let {
		placeholder,
		value = $bindable(''),
		required = false,
		disabled = false,
		readonly = false,
		class: className,
		name,
		id,
		rows = 4,
		autocomplete = 'off'
	}: TextareaProps = $props();
</script>

<textarea
	{placeholder}
	bind:value
	{required}
	{disabled}
	{readonly}
	{name}
	{id}
	{rows}
	{autocomplete}
	class={cn(
		'flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm',
		'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
		'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
		'read-only:cursor-default read-only:focus:ring-0 read-only:focus:border-slate-300',
		className
	)}
></textarea>
