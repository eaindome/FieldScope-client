<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface LabelProps {
		for?: string;
		class?: string;
		children: Snippet;
	}

	let { for: htmlFor, class: className, children }: LabelProps = $props();
</script>

<label for={htmlFor} class={cn('text-sm font-medium text-slate-900', className)}>
	{@render children()}
</label>
