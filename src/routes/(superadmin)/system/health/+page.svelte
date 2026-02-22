<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import { formatNumber, formatDateTime } from '$lib/utils';
	import { icons } from '$lib/components/icons.svelte';

	let health = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadHealth();
	});

	async function loadHealth() {
		loading = true;
		const { data, error: err } = await api.getSystemHealth();
		if (err) {
			error = err;
		} else {
			health = data;
		}
		loading = false;
	}

	function getHealthBadge(status: string) {
		return status === 'Healthy' ? 'success' : 'danger';
	}

	function getConnectionBadge(canConnect: boolean) {
		return canConnect ? 'success' : 'danger';
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-slate-900">System Health</h1>
			<p class="text-slate-600 mt-2">Database, background jobs, and performance monitoring</p>
		</div>
		<Button onclick={loadHealth} loading={loading}>
			<span class="flex items-center gap-2">
				{@html icons.RefreshCw(16)}
				<span>Refresh</span>
			</span>
		</Button>
	</div>

	{#if loading && !health}
		<!-- Overall Status Skeleton -->
		<Card class="border-2">
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div class="space-y-2 flex-1">
						<Skeleton class="h-8 w-48" />
						<Skeleton class="h-5 w-64" />
					</div>
					<Skeleton class="h-10 w-24" />
				</div>
			</div>
		</Card>

		<!-- Database and Jobs Skeleton -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			{#each [1, 2] as _}
				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-48" />
						<Skeleton class="h-4 w-64 mt-2" />
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							{#each [1, 2, 3, 4] as _}
								<Skeleton class="h-12 w-full rounded-lg" />
							{/each}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>

		<!-- Performance Metrics Skeleton -->
		<Card>
			<CardHeader>
				<Skeleton class="h-6 w-56" />
				<Skeleton class="h-4 w-80 mt-2" />
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{#each [1, 2, 3] as _}
						<Skeleton class="h-48 w-full rounded-lg" />
					{/each}
				</div>
			</CardContent>
		</Card>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<p class="text-red-800 font-medium">Error loading system health</p>
			<p class="text-red-600 text-sm mt-1">{error}</p>
		</div>
	{:else if health}
		<!-- Overall Status -->
		<Card class="border-2 border-green-200 bg-green-50">
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-2xl font-bold text-green-900 mb-1">System Status</h2>
						<p class="text-green-700">All systems operational</p>
					</div>
					<Badge variant={getHealthBadge(health.status)} class="text-lg px-4 py-2">
						{health.status}
					</Badge>
				</div>
			</div>
		</Card>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Database Health -->
			<Card>
				<CardHeader>
					<CardTitle>Database Health</CardTitle>
					<CardDescription>PostgreSQL connection and migration status</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
							<span class="text-sm font-medium text-slate-700">Connection Status</span>
							<Badge variant={getConnectionBadge(health.database.canConnect)}>
								{health.database.canConnect ? 'Connected' : 'Disconnected'}
							</Badge>
						</div>

						<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
							<span class="text-sm font-medium text-slate-700">Provider</span>
							<span class="text-sm text-slate-900 font-mono">{health.database.provider}</span>
						</div>

						<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
							<span class="text-sm font-medium text-slate-700">Applied Migrations</span>
							<span class="text-lg font-bold text-green-800">
								{formatNumber(health.database.appliedMigrations)}
							</span>
						</div>

						<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
							<span class="text-sm font-medium text-slate-700">Pending Migrations</span>
							<span
								class={`text-lg font-bold ${health.database.pendingMigrations > 0 ? 'text-yellow-800' : 'text-green-800'}`}
							>
								{formatNumber(health.database.pendingMigrations)}
							</span>
						</div>

						{#if health.database.lastMigration}
							<div class="p-3 bg-blue-50 rounded-lg">
								<p class="text-xs text-blue-700 font-medium mb-1">Latest Migration</p>
								<p class="text-sm text-blue-900 font-mono break-all">
									{health.database.lastMigration}
								</p>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>

			<!-- Background Jobs -->
			<Card>
				<CardHeader>
					<CardTitle>Background Jobs</CardTitle>
					<CardDescription>Hangfire job processing status</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
							<span class="text-sm font-medium text-slate-700">Status</span>
							<Badge variant={getHealthBadge(health.backgroundJobs.status)}>
								{health.backgroundJobs.status}
							</Badge>
						</div>

						<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
							<span class="text-sm font-medium text-slate-700">Hangfire Enabled</span>
							<Badge variant={health.backgroundJobs.hangfireEnabled ? 'success' : 'danger'}>
								{health.backgroundJobs.hangfireEnabled ? 'Yes' : 'No'}
							</Badge>
						</div>

						<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
							<span class="text-sm font-medium text-slate-700">Active Jobs</span>
							<span class="text-lg font-bold text-blue-800">
								{formatNumber(health.backgroundJobs.activeJobs)}
							</span>
						</div>

						<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
							<span class="text-sm font-medium text-slate-700">Scheduled Jobs</span>
							<span class="text-lg font-bold text-green-800">
								{formatNumber(health.backgroundJobs.scheduledJobs)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Performance Metrics -->
		<Card>
			<CardHeader>
				<CardTitle>Performance Metrics</CardTitle>
				<CardDescription>Server performance and resource utilization</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="text-center p-6 bg-blue-50 rounded-lg">
						<p class="text-sm text-blue-700 font-medium mb-2">Database Response Time</p>
						<p class="text-4xl font-bold text-blue-900">
							{health.performance.databaseResponseTimeMs.toFixed(2)}
						</p>
						<p class="text-sm text-blue-600 mt-1">milliseconds</p>
						{#if health.performance.databaseResponseTimeMs < 50}
							<Badge variant="success" class="mt-2">Excellent</Badge>
						{:else if health.performance.databaseResponseTimeMs < 100}
							<Badge variant="info" class="mt-2">Good</Badge>
						{:else}
							<Badge variant="warning" class="mt-2">Slow</Badge>
						{/if}
					</div>

					<div class="text-center p-6 bg-green-50 rounded-lg">
						<p class="text-sm text-green-700 font-medium mb-2">Server Uptime</p>
						<p class="text-4xl font-bold text-green-900 font-mono">
							{health.performance.serverUptimeFormatted}
						</p>
						<p class="text-sm text-green-600 mt-1">days.hours:minutes:seconds</p>
					</div>

					<div class="text-center p-6 bg-purple-50 rounded-lg">
						<p class="text-sm text-purple-700 font-medium mb-2">Memory Usage</p>
						<p class="text-4xl font-bold text-purple-900">
							{health.performance.memoryUsageMB.toFixed(1)}
						</p>
						<p class="text-sm text-purple-600 mt-1">MB</p>
						{#if health.performance.memoryUsageMB < 500}
							<Badge variant="success" class="mt-2">Normal</Badge>
						{:else if health.performance.memoryUsageMB < 1000}
							<Badge variant="warning" class="mt-2">Elevated</Badge>
						{:else}
							<Badge variant="danger" class="mt-2">High</Badge>
						{/if}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Last Updated -->
		<div class="text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
			Last checked: {formatDateTime(health.timestamp)}
		</div>
	{:else}
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Heart(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No Health Data Available</h3>
				<p class="text-slate-600">System health information will appear here once available.</p>
			</div>
		</Card>
	{/if}
</div>
