<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { icons } from '$lib/components/icons.svelte';

	interface SidebarProps {
		open: boolean;
		onClose: () => void;
		title: string;
		width?: 'sm' | 'md' | 'lg';
		children: Snippet;
		headerExtra?: Snippet;
		footer?: Snippet;
	}

	let { open = $bindable(false), onClose, title, width = 'lg', children, headerExtra, footer }: SidebarProps = $props();

	const widthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg'
	};

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in-0"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			class={cn(
				'fixed right-0 top-0 h-full bg-white shadow-xl animate-in slide-in-from-right duration-300',
				widthClasses[width],
				'w-full flex flex-col'
			)}
		>
			<!-- Header -->
			<div class="border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
				<div class="flex items-center gap-3 min-w-0">
					<h2 class="text-xl font-semibold text-slate-900 truncate">{title}</h2>
					{#if headerExtra}
						{@render headerExtra()}
					{/if}
				</div>
				<button
					onclick={onClose}
					class="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded shrink-0 ml-2"
					aria-label="Close sidebar"
					type="button"
				>
					{@html icons.X(20)}
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto px-6 py-6">
				{@render children()}
			</div>

			<!-- Footer (pinned to bottom) -->
			{#if footer}
				<div class="border-t border-slate-200 px-6 py-4 shrink-0">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
