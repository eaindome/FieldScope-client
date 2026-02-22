<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { formatDateTime } from '$lib/utils';
	import { network } from '$lib/offline';

	// ─── Reactive aliases from the network store ─────────────────────────────
	// Derived from the global $state in network.svelte.ts — reading these in
	// the template is fully reactive with no extra boilerplate.
	const isOnline = $derived(network.online);
	const syncing = $derived(network.syncing);
	const pendingCount = $derived(network.pendingCount);
	const lastSyncTime = $derived(network.lastSyncAt);

	// ─── Local UI state ───────────────────────────────────────────────────────
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	// Sync history persisted in localStorage so it survives reloads.
	// The network store only tracks the last run; we accumulate history here.
	let syncHistory = $state<
		Array<{
			timestamp: string;
			success: boolean;
			submissionCount: number;
			message: string;
		}>
	>([]);

	onMount(async () => {
		loadHistory();
		// Seed the pending badge on first load (auto-updates on sync events after).
		await network.refreshPendingCount();

		// No manual online/offline listeners needed — the network store handles
		// those globally and auto-syncs when the device reconnects.
	});

	function loadHistory() {
		const raw = localStorage.getItem('syncHistory');
		if (raw) {
			try {
				syncHistory = JSON.parse(raw);
			} catch {
				syncHistory = [];
			}
		}
	}

	async function handleManualSync() {
		if (!network.online) {
			toast = { message: 'Cannot sync while offline', type: 'error' };
			setTimeout(() => (toast = null), 5000);
			return;
		}

		if (network.pendingCount === 0) {
			toast = { message: 'No pending submissions to sync', type: 'success' };
			setTimeout(() => (toast = null), 3000);
			return;
		}

		const result = await network.syncNow();

		if (result) {
			const syncTime = new Date().toISOString();
			const synced = result.succeeded;
			const failed = result.failed;

			const historyEntry = {
				timestamp: syncTime,
				success: failed === 0,
				submissionCount: synced,
				message:
					failed === 0
						? `Successfully synced ${synced} submission${synced !== 1 ? 's' : ''}`
						: `Synced ${synced}, failed ${failed} submission${failed !== 1 ? 's' : ''}`
			};

			syncHistory = [historyEntry, ...syncHistory.slice(0, 19)];
			localStorage.setItem('syncHistory', JSON.stringify(syncHistory));

			toast = {
				message: historyEntry.message,
				type: failed === 0 ? 'success' : 'error'
			};
			setTimeout(() => (toast = null), 5000);
		} else {
			toast = { message: 'Sync failed. Please try again.', type: 'error' };
			setTimeout(() => (toast = null), 5000);
		}
	}

	function clearSyncHistory() {
		syncHistory = [];
		localStorage.removeItem('syncHistory');
		toast = { message: 'Sync history cleared', type: 'success' };
		setTimeout(() => (toast = null), 3000);
	}

	function goToProjects() {
		goto('/projects');
	}

	const relativeSyncTime = $derived.by(() => {
		if (!lastSyncTime) return 'Never';

		const now = new Date();
		const lastSync = new Date(lastSyncTime);
		const diffMs = now.getTime() - lastSync.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
	});
</script>

<div class="space-y-6 max-w-4xl mx-auto p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-slate-900">Sync Status</h1>
			<p class="text-slate-600 mt-2">Manage offline data synchronization</p>
		</div>
		<!-- Only show Back button on desktop (hidden on mobile due to bottom nav) -->
		<Button variant="outline" onclick={goToProjects} class="gap-2 hidden lg:flex">
			<span>{@html icons.ArrowLeft(16)}</span>
			Back to Projects
		</Button>
	</div>

	<!-- Connection Status -->
	<Card>
		<div class="p-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div
						class="h-12 w-12 rounded-full flex items-center justify-center {isOnline
							? 'bg-green-100 text-green-600'
							: 'bg-red-100 text-red-600'}"
					>
						{@html isOnline ? icons.CheckCircle(24) : icons.XCircle(24)}
					</div>
					<div>
						<h3 class="text-lg font-semibold text-slate-900">Connection Status</h3>
						<p class="text-sm text-slate-600 mt-1">
							{isOnline ? 'Connected to internet' : 'No internet connection'}
						</p>
					</div>
				</div>
				<Badge variant={isOnline ? 'success' : 'danger'}>
					{isOnline ? 'Online' : 'Offline'}
				</Badge>
			</div>
		</div>
	</Card>

	<!-- Sync Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-orange-600 uppercase tracking-wide">
							Pending Sync
						</p>
						<p class="text-3xl font-bold text-orange-700 mt-2">{pendingCount}</p>
					</div>
					<div class="p-3 bg-orange-100 rounded-lg text-orange-600">
						{@html icons.Upload(24)}
					</div>
				</div>
			</div>
		</Card>

		<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-blue-600 uppercase tracking-wide">Last Sync</p>
						<p class="text-lg font-bold text-blue-700 mt-2">{relativeSyncTime}</p>
					</div>
					<div class="p-3 bg-blue-100 rounded-lg text-blue-600">
						{@html icons.Clock(24)}
					</div>
				</div>
			</div>
		</Card>

		<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-green-600 uppercase tracking-wide">
							Sync History
						</p>
						<p class="text-3xl font-bold text-green-700 mt-2">{syncHistory.length}</p>
					</div>
					<div class="p-3 bg-green-100 rounded-lg text-green-600">
						{@html icons.Activity(24)}
					</div>
				</div>
			</div>
		</Card>
	</div>

	<!-- Manual Sync -->
	<Card>
		<div class="p-6 space-y-4">
			<div class="flex items-start gap-4">
				<div
					class="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"
				>
					{@html icons.RotateCcw(24)}
				</div>
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-slate-900">Manual Sync</h3>
					<p class="text-sm text-slate-600 mt-1">
						{#if pendingCount > 0}
							You have {pendingCount} submission{pendingCount !== 1 ? 's' : ''} waiting to be synced to
							the server.
						{:else}
							All your submissions are synced. You're up to date!
						{/if}
					</p>

					{#if !isOnline}
						<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p class="text-sm text-yellow-800">
								<span class="font-medium">Offline Mode:</span> Your submissions will be saved locally
								and automatically synced when you reconnect.
							</p>
						</div>
					{/if}

					<div class="mt-4">
						<Button
							onclick={handleManualSync}
							loading={syncing}
							disabled={!isOnline || pendingCount === 0 || syncing}
							class="gap-2"
						>
							<span>{@html icons.Upload(16)}</span>
							{syncing
								? 'Syncing...'
								: `Sync ${pendingCount > 0 ? `${pendingCount} Submission${pendingCount !== 1 ? 's' : ''}` : 'Now'}`}
						</Button>
					</div>
				</div>
			</div>
		</div>
	</Card>

	<!-- Sync History -->
	<Card>
		<div class="p-6 space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-slate-900">Sync History</h3>
				{#if syncHistory.length > 0}
					<Button variant="outline" size="sm" onclick={clearSyncHistory}>Clear History</Button>
				{/if}
			</div>

			{#if syncHistory.length === 0}
				<div class="text-center py-8 text-slate-500">
					<p class="text-sm">No sync activity yet</p>
					<p class="text-xs mt-1">Your sync history will appear here</p>
				</div>
			{:else}
				<div class="space-y-3 max-h-96 overflow-y-auto">
					{#each syncHistory as entry}
						<div
							class="flex items-start gap-3 p-3 rounded-lg {entry.success
								? 'bg-green-50 border border-green-200'
								: 'bg-red-50 border border-red-200'}"
						>
							<div
								class="h-8 w-8 rounded-full flex items-center justify-center shrink-0 {entry.success
									? 'bg-green-100 text-green-600'
									: 'bg-red-100 text-red-600'}"
							>
								{@html entry.success ? icons.CheckCircle(16) : icons.XCircle(16)}
							</div>
							<div class="flex-1 min-w-0">
								<p
									class="text-sm font-medium {entry.success ? 'text-green-900' : 'text-red-900'}"
								>
									{entry.message}
								</p>
								<p class="text-xs {entry.success ? 'text-green-600' : 'text-red-600'} mt-1">
									{formatDateTime(entry.timestamp)}
								</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</Card>

	<!-- Info Card -->
	<Card>
		<div class="p-6">
			<div class="flex items-start gap-4">
				<div
					class="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"
				>
					{@html icons.Info(20)}
				</div>
				<div>
					<h4 class="text-sm font-semibold text-slate-900">About Offline Mode</h4>
					<ul class="text-xs text-slate-600 mt-2 space-y-1.5">
						<li class="flex items-start gap-2">
							<span class="text-blue-600 mt-0.5">•</span>
							<span>Your submissions are saved locally even when you're offline</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-blue-600 mt-0.5">•</span>
							<span
								>When you reconnect, submissions are automatically synced to the server</span
							>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-blue-600 mt-0.5">•</span>
							<span>You can also manually trigger a sync using the button above</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-blue-600 mt-0.5">•</span>
							<span>Synced submissions are marked with a green checkmark</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</Card>
</div>

<!-- Toast Notification -->
{#if toast}
	<Toast message={toast.message} type={toast.type} onClose={() => (toast = null)} />
{/if}
