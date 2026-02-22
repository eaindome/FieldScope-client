<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface CardProps {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: CardProps = $props();
</script>

<div class={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
	{@render children()}
</div>
