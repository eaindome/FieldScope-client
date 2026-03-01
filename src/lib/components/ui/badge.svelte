<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface BadgeProps {
		variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'system';
		class?: string;
		children: Snippet;
	}

	let { variant = 'default', class: className, children }: BadgeProps = $props();

	const variantStyles = {
		default: 'bg-slate-100 text-slate-800',
		success: 'bg-green-100 text-green-800',
		warning: 'bg-yellow-100 text-yellow-800',
		danger: 'bg-red-100 text-red-800',
		info: 'bg-blue-100 text-blue-800',
		system: 'bg-purple-100 text-purple-800'
	};
</script>

<span
	class={cn(
		'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
		variantStyles[variant],
		className
	)}
>
	{@render children()}
</span>
