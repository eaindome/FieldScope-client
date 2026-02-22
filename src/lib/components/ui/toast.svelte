<script lang="ts">
	import { icons } from '$lib/components/icons.svelte';

	interface ToastProps {
		message: string;
		type?: 'success' | 'error' | 'info';
		onClose?: () => void;
	}

	let { message, type = 'success', onClose }: ToastProps = $props();

	const bgColor = $derived(
		type === 'success'
			? 'bg-green-50 border-green-200'
			: type === 'error'
				? 'bg-red-50 border-red-200'
				: 'bg-blue-50 border-blue-200'
	);

	const textColor = $derived(
		type === 'success'
			? 'text-green-800'
			: type === 'error'
				? 'text-red-800'
				: 'text-blue-800'
	);

	const iconColor = $derived(
		type === 'success'
			? 'text-green-600'
			: type === 'error'
				? 'text-red-600'
				: 'text-blue-600'
	);

	const icon = $derived(
		type === 'success'
			? icons.CheckCircle(20)
			: type === 'error'
				? icons.XCircle(20)
				: icons.Info(20)
	);
</script>

<div
	class="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg {bgColor} animate-slide-in"
>
	<div class="{iconColor}">
		{@html icon}
	</div>
	<p class="text-sm font-medium {textColor}">{message}</p>
	{#if onClose}
		<button
			onclick={onClose}
			class="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
			aria-label="Close"
		>
			{@html icons.X(16)}
		</button>
	{/if}
</div>

<style>
	@keyframes slide-in {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style>
