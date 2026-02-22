<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';
	import icon from '$lib/assets/icon.svg';
	import { onMount } from 'svelte';
	import { registerApiCaller } from '$lib/offline';
	import { api } from '$lib/api/client';
	import type { SyncQueueItem } from '$lib/offline';
	import { navigating } from '$app/stores';

	const MIN_LOADING_MS = 1500;

	let { children } = $props();
	let mounted = $state(false);

	onMount(async () => {
		const minDelay = new Promise<void>((resolve) => setTimeout(resolve, MIN_LOADING_MS));
		await minDelay;
		mounted = true;

		/**
		 * Register the function that pushes queued offline submissions to the
		 * server. Called once globally so every page benefits from auto-sync.
		 *
		 * The payload is the LocalSubmission that was saved offline. Each
		 * submission may contain responses for multiple forms in the project,
		 * so we use bulkSubmitData when there are several, and submitData for
		 * the common single-form case.
		 */
		registerApiCaller(async (item: SyncQueueItem) => {
			const sub = item.payload as {
				localId: string;
				projectId: number;
				responses: Array<{ formId: number; answers: Record<string, unknown> }>;
			};

			const submissionItems = sub.responses.map((r) => ({
				projectId: sub.projectId,
				formId: r.formId,
				answers: r.answers as Record<string, any>,
				localSyncId: sub.localId
			}));

			if (submissionItems.length === 1) {
				const { data, error } = await api.submitData(submissionItems[0]);
				if (error) throw new Error(error);
				return { remoteId: (data as any)?.id };
			} else {
				const result = await api.bulkSubmitData(submissionItems);
				if ('error' in result && result.error) throw new Error(result.error);
				return { remoteId: (result.data as any)?.results?.[0]?.submissionId };
			}
		});
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if !mounted}
	<!-- Initial Loading Screen -->
	<div class="fixed inset-0 bg-white flex items-center justify-center z-50">
		<div class="text-center flex flex-col items-center gap-1">
			<!-- Logo Icon -->
			<img src={icon} alt="FieldScope" class="w-24 h-24"/>

			<!-- Brand Name -->
			<div>
				<p class="text-3xl font-bold tracking-tight">
					<span style="color: #1e3a8a;">Field</span><span style="color: #6b8cc7;">Scope</span>
				</p>
				<p class="text-sm mt-1" style="color: #6b8cc7;">Data in Focus, Insights Unleashed</p>
			</div>

			<!-- Progress bar -->
			<div class="w-48 h-0.5 bg-blue-100 rounded-full overflow-hidden mt-2">
				<div class="h-full bg-blue-600 rounded-full animate-loading-bar"></div>
			</div>
		</div>
	</div>
{:else}
	{@render children()}

	<!-- Navigation Loading Indicator -->
	{#if $navigating}
		<div class="fixed top-0 left-0 right-0 h-1 bg-blue-100 z-50 overflow-hidden">
			<div class="h-full bg-blue-600 animate-progress"></div>
		</div>
	{/if}
{/if}

<style>
	@keyframes progress {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.animate-progress {
		animation: progress 1s ease-in-out infinite;
	}

	@keyframes loading-bar {
		0% {
			width: 0%;
			margin-left: 0%;
		}
		50% {
			width: 60%;
			margin-left: 20%;
		}
		100% {
			width: 0%;
			margin-left: 100%;
		}
	}

	.animate-loading-bar {
		animation: loading-bar 1.6s ease-in-out infinite;
	}
</style>
