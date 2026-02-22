<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { icons } from '$lib/components/icons.svelte';

	interface DialogProps {
		open: boolean;
		onClose: () => void;
		title?: string;
		description?: string;
		width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
		children: Snippet;
	}

	let { open = $bindable(false), onClose, title, description, width = 'lg', children }: DialogProps = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if ((e.key === 'Enter' || e.key === 'Escape') && e.target === e.currentTarget) {
			onClose();
		}
	}

	const widthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl',
		'3xl': 'max-w-3xl',
		'4xl': 'max-w-4xl'
	};
</script>

<style>
	.dialog-content {
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
	}

	.dialog-content::-webkit-scrollbar {
		display: none; /* Chrome/Safari/WebKit */
	}
</style>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="button"
		tabindex="-1"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50"></div>

		<!-- Dialog -->
		<div
			class={cn(
				'relative z-50 w-full rounded-lg bg-white shadow-xl flex flex-col',
				'animate-in fade-in-0 zoom-in-95 max-h-[90vh]',
				widthClasses[width]
			)}
		>
			{#if title || description}
				<div class="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-200">
					<div class="flex-1">
						{#if title}
							<h2 class="text-2xl font-semibold text-slate-900">{title}</h2>
						{/if}
						{#if description}
							<p class="text-sm text-slate-600 mt-2">{description}</p>
						{/if}
					</div>
					<button
						onclick={onClose}
						class="ml-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
						aria-label="Close dialog"
					>
						{@html icons.X(20)}
					</button>
				</div>
			{/if}

			<div class="px-6 py-6 overflow-y-auto flex-1 dialog-content">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
