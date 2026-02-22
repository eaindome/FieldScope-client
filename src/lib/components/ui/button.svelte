<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import Spinner from './spinner.svelte';

	interface ButtonProps {
		variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		onclick?: () => void;
		children: Snippet;
	}

	let {
		variant = 'default',
		size = 'md',
		class: className,
		type = 'button',
		disabled = false,
		loading = false,
		onclick,
		children
	}: ButtonProps = $props();

	const baseStyles =
		'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	const variantStyles = {
		default: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900',
		secondary: 'bg-blue-800 text-white hover:bg-blue-700 focus-visible:ring-blue-800',
		outline:
			'border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-900 focus-visible:ring-slate-900',
		ghost: 'hover:bg-slate-100 text-slate-900',
		destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600'
	};

	const sizeStyles = {
		sm: 'h-9 px-3 text-sm',
		md: 'h-10 px-4 py-2',
		lg: 'h-11 px-6 text-lg'
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	{onclick}
	class={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
>
	{#if loading}
		<Spinner size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} class="mr-2" />
	{/if}
	{@render children()}
</button>
