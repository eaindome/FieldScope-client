<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import { formatNumber, formatDateTime } from '$lib/utils';
	import { icons } from '$lib/components/icons.svelte';

	let stats = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadStats();
		// Auto-refresh every 30 seconds
		const interval = setInterval(loadStats, 30000);
		return () => clearInterval(interval);
	});

	async function loadStats() {
		const { data, error: err } = await api.getDashboardStats();
		if (err) {
			error = err;
		} else {
			stats = data;
		}
		loading = false;
	}

	const quickStats = $derived(
		stats
			? [
					{ label: 'Total Organizations', value: stats.organizations.total, icon: 'Building' },
					{ label: 'Total Users', value: stats.users.total, icon: 'Users' },
					{ label: 'Total Projects', value: stats.projects.total, icon: 'Folder' },
					{ label: 'Total Submissions', value: stats.submissions.total, icon: 'ClipboardList' }
				]
			: []
	);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-4xl font-bold text-slate-900">System Monitoring</h1>
		<p class="text-slate-600 mt-2">Real-time platform metrics and activity monitoring</p>
	</div>

	{#if loading}
		<!-- Quick Stats Skeleton -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each [1, 2, 3, 4] as _}
				<Card>
					<div class="p-6 space-y-3">
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-10 w-20" />
					</div>
				</Card>
			{/each}
		</div>

		<!-- Activity Metrics Skeleton -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each [1, 2] as _}
				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-48" />
						<Skeleton class="h-4 w-64 mt-2" />
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							{#each [1, 2, 3] as _}
								<Skeleton class="h-16 w-full rounded-lg" />
							{/each}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>

		<!-- Project Status Skeleton -->
		<Card>
			<CardHeader>
				<Skeleton class="h-6 w-56" />
				<Skeleton class="h-4 w-72 mt-2" />
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-3 gap-4">
					{#each [1, 2, 3] as _}
						<Skeleton class="h-32 w-full rounded-lg" />
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Top Organizations Skeleton -->
		<Card>
			<CardHeader>
				<Skeleton class="h-6 w-64" />
				<Skeleton class="h-4 w-80 mt-2" />
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each [1, 2, 3, 4, 5] as _}
						<Skeleton class="h-20 w-full rounded-lg" />
					{/each}
				</div>
			</CardContent>
		</Card>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<p class="text-red-800 font-medium">Error loading monitoring data</p>
			<p class="text-red-600 text-sm mt-1">{error}</p>
		</div>
	{:else if stats}
		<!-- Quick Stats -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each quickStats as stat}
				<Card class="hover:shadow-md transition-shadow">
					<div class="p-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-slate-500">{stat.label}</p>
								<p class="text-3xl font-bold text-slate-900 mt-2">
									{formatNumber(stat.value)}
								</p>
							</div>
							<div class="opacity-10 text-slate-900">
								{@html icons[stat.icon](48)}
							</div>
						</div>
					</div>
				</Card>
			{/each}
		</div>

		<!-- Activity Metrics -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Submission Activity -->
			<Card>
				<CardHeader>
					<CardTitle>Submission Activity</CardTitle>
					<CardDescription>Recent data collection metrics</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						<div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
							<span class="text-sm font-medium text-blue-900">Last 7 Days</span>
							<span class="text-2xl font-bold text-blue-800">
								{formatNumber(stats.submissions.last7Days)}
							</span>
						</div>
						<div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
							<span class="text-sm font-medium text-green-900">Last 30 Days</span>
							<span class="text-2xl font-bold text-green-800">
								{formatNumber(stats.submissions.last30Days)}
							</span>
						</div>
						<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
							<span class="text-sm font-medium text-slate-900">Avg per Project</span>
							<span class="text-2xl font-bold text-slate-800">
								{stats.submissions.averagePerProject.toFixed(1)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Organization Health -->
			<Card>
				<CardHeader>
					<CardTitle>Organization Health</CardTitle>
					<CardDescription>Organization activity status</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						<div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
							<span class="text-sm font-medium text-green-900">Active</span>
							<div class="flex items-center gap-2">
								<span class="text-2xl font-bold text-green-800">
									{formatNumber(stats.organizations.active)}
								</span>
								<Badge variant="success">Healthy</Badge>
							</div>
						</div>
						<div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
							<span class="text-sm font-medium text-yellow-900">Dormant</span>
							<div class="flex items-center gap-2">
								<span class="text-2xl font-bold text-yellow-800">
									{formatNumber(stats.organizations.dormant)}
								</span>
								<Badge variant="warning">Inactive</Badge>
							</div>
						</div>
						<div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
							<span class="text-sm font-medium text-blue-900">Created This Month</span>
							<span class="text-2xl font-bold text-blue-800">
								{formatNumber(stats.organizations.createdThisMonth)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Project Status Distribution -->
		<Card>
			<CardHeader>
				<CardTitle>Project Status Distribution</CardTitle>
				<CardDescription>Breakdown of projects by current status</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-3 gap-4">
					<div class="text-center p-6 bg-yellow-50 rounded-lg">
						<p class="text-4xl font-bold text-yellow-900">
							{formatNumber(stats.projects.byStatus.draft)}
						</p>
						<p class="text-sm text-yellow-700 mt-2 font-medium">Draft</p>
					</div>
					<div class="text-center p-6 bg-green-50 rounded-lg">
						<p class="text-4xl font-bold text-green-900">
							{formatNumber(stats.projects.byStatus.active)}
						</p>
						<p class="text-sm text-green-700 mt-2 font-medium">Active</p>
					</div>
					<div class="text-center p-6 bg-slate-50 rounded-lg">
						<p class="text-4xl font-bold text-slate-900">
							{formatNumber(stats.projects.byStatus.closed)}
						</p>
						<p class="text-sm text-slate-700 mt-2 font-medium">Closed</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Top Organizations -->
		<Card>
			<CardHeader>
				<CardTitle>Top Organizations by Activity</CardTitle>
				<CardDescription>Most active organizations by submission count</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each stats.submissions.topOrganizationsBySubmissions as org, index}
						<div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
							<div class="flex items-center gap-4">
								<div
									class="w-10 h-10 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold"
								>
									{index + 1}
								</div>
								<div>
									<p class="font-semibold text-slate-900">{org.organizationName}</p>
									<p class="text-sm text-slate-500">ID: {org.organizationId}</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-2xl font-bold text-blue-800">
									{formatNumber(org.submissionCount)}
								</p>
								<p class="text-xs text-slate-500">submissions</p>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Last Updated -->
		<div class="text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
			Last updated: {formatDateTime(stats.generatedAt)}
			<span class="mx-2">•</span>
			Auto-refreshes every 30 seconds
		</div>
	{:else}
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Activity(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No Monitoring Data Available</h3>
				<p class="text-slate-600">System monitoring data will appear here once available.</p>
			</div>
		</Card>
	{/if}
</div>
