<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface CardTitleProps {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: CardTitleProps = $props();
</script>

<h3 class={cn('text-2xl font-semibold leading-none tracking-tight text-slate-900', className)}>
	{@render children()}
</h3>
