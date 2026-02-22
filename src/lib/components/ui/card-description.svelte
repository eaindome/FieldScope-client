<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface CardDescriptionProps {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: CardDescriptionProps = $props();
</script>

<p class={cn('text-sm text-slate-500', className)}>
	{@render children()}
</p>
