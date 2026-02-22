<script lang="ts">
	import { cn } from '$lib/utils';

	interface SkeletonProps {
		class?: string;
	}

	let { class: className }: SkeletonProps = $props();
</script>

<div class={cn('animate-pulse bg-slate-200 rounded', className)}></div>
