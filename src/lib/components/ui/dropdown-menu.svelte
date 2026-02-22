<script lang="ts">
	import { icons } from '$lib/components/icons.svelte';

	let { children, align = 'right' }: { children: any; align?: 'left' | 'right' } = $props();

	let isOpen = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null);
	let dropdownRef = $state<HTMLDivElement | null>(null);
	let position = $state({ top: 0, left: 0, right: 'auto' as string | number });

	function toggle() {
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}

	function updatePosition() {
		if (!triggerRef) return;

		const rect = triggerRef.getBoundingClientRect();
		const viewportHeight = window.innerHeight;
		const dropdownHeight = dropdownRef?.offsetHeight || 250;
		const spaceBelow = viewportHeight - rect.bottom - 8;

		// Flip upward if not enough space below and there's enough space above
		const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
		const topValue = openUpward ? rect.top - dropdownHeight - 8 : rect.bottom + 8;

		if (align === 'left') {
			position = {
				top: topValue,
				left: rect.left,
				right: 'auto'
			};
		} else {
			position = {
				top: topValue,
				left: 'auto' as any,
				right: `${window.innerWidth - rect.right}`
			};
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (triggerRef && !triggerRef.contains(event.target as Node)) {
			if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
				close();
			}
		}
	}

	$effect(() => {
		if (isOpen) {
			updatePosition();
			document.addEventListener('click', handleClickOutside);
			window.addEventListener('scroll', updatePosition, true);
			window.addEventListener('resize', updatePosition);
			return () => {
				document.removeEventListener('click', handleClickOutside);
				window.removeEventListener('scroll', updatePosition, true);
				window.removeEventListener('resize', updatePosition);
			};
		}
	});
</script>

<div class="relative inline-block">
	<button
		bind:this={triggerRef}
		onclick={(e) => { e.stopPropagation(); toggle(); }}
		class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
		type="button"
		aria-label="More actions"
	>
		{@html icons.MoreVertical(16)}
	</button>

	{#if isOpen}
		<div
			bind:this={dropdownRef}
			class="fixed z-50 min-w-48 rounded-lg bg-white shadow-lg border border-slate-200 py-1"
			style="top: {position.top}px; {align === 'right' ? `right: ${position.right}px` : `left: ${position.left}px`};"
		>
			{@render children({ close })}
		</div>
	{/if}
</div>

<style>
	/* Optional: Add animation */
	.fixed {
		animation: slideIn 0.15s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
