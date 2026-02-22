<script lang="ts">
	import { cn } from '$lib/utils';

	interface SelectProps {
		value?: string | number;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		name?: string;
		id?: string;
		children?: any;
	}

	let {
		value = $bindable(''),
		required = false,
		disabled = false,
		class: className,
		name,
		id,
		children
	}: SelectProps = $props();
</script>

<select
	bind:value
	{required}
	{disabled}
	{name}
	{id}
	class={cn(
		'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm',
		'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
		'disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
>
	{@render children?.()}
</select>
