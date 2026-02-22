<script lang="ts">
	import { cn } from '$lib/utils';

	interface InputProps {
		type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel';
		placeholder?: string;
		value?: string | number;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		tabindex?: number;
		class?: string;
		name?: string;
		id?: string;
		min?: string | number;
		max?: string | number;
		autocomplete?: string;
		oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
		onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
		onblur?: (e: FocusEvent & { currentTarget: HTMLInputElement }) => void;
		onfocus?: (e: FocusEvent & { currentTarget: HTMLInputElement }) => void;
	}

	let {
		type = 'text',
		placeholder,
		value = $bindable(''),
		required = false,
		disabled = false,
		readonly = false,
		tabindex,
		class: className,
		name,
		id,
		min,
		max,
		autocomplete = 'off',
		oninput,
		onchange,
		onblur,
		onfocus
	}: InputProps = $props();
</script>

<input
	{type}
	{placeholder}
	bind:value
	{required}
	{disabled}
	{readonly}
	{tabindex}
	{name}
	{id}
	{min}
	{max}
	{autocomplete}
	{oninput}
	{onchange}
	{onblur}
	{onfocus}
	class={cn(
		'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm',
		'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent',
		'disabled:cursor-not-allowed disabled:opacity-50',
		'read-only:bg-slate-50 read-only:cursor-default read-only:focus:ring-0 read-only:focus:border-slate-300',
		className
	)}
/>
