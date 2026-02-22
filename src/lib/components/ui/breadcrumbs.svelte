<script lang="ts">
	import { icons } from '$lib/components/icons.svelte';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface BreadcrumbsProps {
		items: BreadcrumbItem[];
	}

	let { items }: BreadcrumbsProps = $props();
</script>

<nav class="flex items-center gap-2 text-sm text-slate-600">
	{#each items as item, index}
		{#if index > 0}
			<span class="text-slate-400">{@html icons.ChevronRight(14)}</span>
		{/if}
		{#if item.href}
			<a href={item.href} class="hover:text-slate-900 transition-colors">
				{item.label}
			</a>
		{:else}
			<span class="text-slate-900 font-medium">{item.label}</span>
		{/if}
	{/each}
</nav>
