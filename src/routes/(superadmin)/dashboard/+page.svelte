<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
	import StatCard from '$lib/components/ui/stat-card.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import { formatPercentage, formatDateTime } from '$lib/utils';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	// Import Chart.js config to ensure registration
	import '$lib/components/charts/chartjs-config';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import AreaChart from '$lib/components/charts/AreaChart.svelte';
	import DoughnutChart from '$lib/components/charts/DoughnutChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';

	let stats = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'organizations' | 'users' | 'projects' | 'submissions'>('overview');

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: '📊' },
		{ id: 'organizations', label: 'Organizations', icon: '🏢' },
		{ id: 'users', label: 'Users', icon: '👥' },
		{ id: 'projects', label: 'Projects', icon: '📁' },
		{ id: 'submissions', label: 'Submissions', icon: '📋' }
	] as const;

	onMount(async () => {
		const { data, error: err } = await api.getDashboardStats();
		if (err) {
			error = err;
		} else {
			stats = data;
		}
		loading = false;
	});

	// Helper function to generate mock time-series data
	// TODO: Replace with actual API data when available
	function generateMockTimeSeriesData(days: number, baseValue: number, variance: number = 0.3) {
		const data = [];
		const labels = [];
		const today = new Date();

		for (let i = days - 1; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

			// Generate value with some randomness
			const randomFactor = 1 + (Math.random() - 0.5) * variance;
			const value = Math.max(0, Math.round(baseValue * randomFactor));
			data.push(value);
		}

		return { labels, data };
	}

	// Mock chart data - will be replaced with real API data
	const submissionTrendData = $derived(() => {
		if (!stats) return { labels: [], data: [] };
		const avgDaily = Math.round(stats.submissions.last30Days / 30);
		return generateMockTimeSeriesData(30, avgDaily, 0.4);
	});

	const activityHeatmapData = $derived(() => {
		if (!stats) return { labels: [], datasets: [] };
		// Generate 4 weeks of data
		const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
		const avgUserActivity = Math.round(stats.users.active / 4);
		const avgSubmissions = Math.round(stats.submissions.last7Days);

		return {
			labels: weeks,
			datasets: [
				{
					label: 'Active Users',
					data: [
						avgUserActivity * 0.8,
						avgUserActivity * 1.1,
						avgUserActivity * 0.9,
						avgUserActivity * 1.2
					].map(Math.round),
					backgroundColor: '#3b82f6'
				},
				{
					label: 'Submissions',
					data: [
						avgSubmissions * 0.9,
						avgSubmissions * 1.3,
						avgSubmissions * 0.7,
						avgSubmissions * 1.1
					].map(Math.round),
					backgroundColor: '#10b981'
				}
			]
		};
	});

	const growthTrendData = $derived(() => {
		if (!stats) return { labels: [], datasets: [] };
		const result = generateMockTimeSeriesData(60, stats.organizations.total / 12, 0.2);

		return {
			labels: result.labels,
			datasets: [
				{
					label: 'Organizations',
					data: result.data,
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)'
				},
				{
					label: 'Users',
					data: result.data.map((v) => v * (stats.users.total / stats.organizations.total)),
					borderColor: '#10b981',
					backgroundColor: 'rgba(16, 185, 129, 0.1)'
				}
			]
		};
	});

	// Organizations tab chart data
	const orgGrowthData = $derived(() => {
		if (!stats) return { labels: [], datasets: [] };
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const avgPerMonth = Math.round(stats.organizations.total / 12);

		// Generate cumulative growth data
		const newOrgs = months.map((_, i) => Math.round(avgPerMonth * (0.8 + Math.random() * 0.4)));
		const cumulative = newOrgs.reduce((acc, val, i) => {
			acc.push((acc[i - 1] || 0) + val);
			return acc;
		}, [] as number[]);

		return {
			labels: months,
			datasets: [
				{
					label: 'New Organizations',
					data: newOrgs,
					borderColor: '#3b82f6',
					backgroundColor: '#3b82f6'
				},
				{
					label: 'Total Organizations',
					data: cumulative,
					borderColor: '#10b981',
					backgroundColor: '#10b981'
				}
			]
		};
	});

	const orgDistributionData = $derived(() => {
		if (!stats) return { labels: [], data: [] };
		return {
			labels: ['Active', 'Dormant'],
			data: [stats.organizations.active, stats.organizations.dormant],
			colors: ['#10b981', '#64748b']
		};
	});

	// Users tab chart data
	const userRegistrationData = $derived(() => {
		if (!stats) return { labels: [], datasets: [] };
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const totalByRole = stats.users.byRole.admin + stats.users.byRole.agent;
		const avgAdminPerMonth = Math.round(stats.users.byRole.admin / 12);
		const avgAgentPerMonth = Math.round(stats.users.byRole.agent / 12);

		return {
			labels: months,
			datasets: [
				{
					label: 'Admins',
					data: months.map(() => Math.round(avgAdminPerMonth * (0.8 + Math.random() * 0.4))),
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)'
				},
				{
					label: 'Agents',
					data: months.map(() => Math.round(avgAgentPerMonth * (0.8 + Math.random() * 0.4))),
					borderColor: '#10b981',
					backgroundColor: 'rgba(16, 185, 129, 0.1)'
				}
			]
		};
	});

	const userRoleData = $derived(() => {
		if (!stats) return { labels: [], data: [] };
		return {
			labels: ['Admins', 'Agents'],
			data: [stats.users.byRole.admin, stats.users.byRole.agent],
			colors: ['#3b82f6', '#10b981']
		};
	});

	const userActivityData = $derived(() => {
		if (!stats) return { labels: [], datasets: [] };
		return {
			labels: ['Active', 'Inactive'],
			datasets: [
				{
					label: 'Users',
					data: [stats.users.active, stats.users.inactive],
					backgroundColor: '#10b981'
				}
			]
		};
	});

	// Projects tab chart data
	const projectStatusData = $derived(() => {
		if (!stats) return { labels: [], data: [] };
		return {
			labels: ['Draft', 'Active', 'Closed'],
			data: [
				stats.projects.byStatus.draft,
				stats.projects.byStatus.active,
				stats.projects.byStatus.closed
			],
			colors: ['#f59e0b', '#10b981', '#64748b']
		};
	});

	const projectCreationData = $derived(() => {
		if (!stats) return { labels: [], datasets: [] };
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const avgPerMonth = Math.round(stats.projects.total / 12);

		return {
			labels: months,
			datasets: [
				{
					label: 'Projects Created',
					data: months.map(() => Math.round(avgPerMonth * (0.7 + Math.random() * 0.6))),
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)'
				}
			]
		};
	});

	// Submissions tab chart data
	const submissionTimelineData = $derived(() => {
		if (!stats) return { labels: [], data: [] };
		const avgDaily = Math.round(stats.submissions.last30Days / 30);
		return generateMockTimeSeriesData(60, avgDaily, 0.5);
	});

	const submissionsByOrgData = $derived(() => {
		if (!stats) return { labels: [], data: [] };
		// Generate top 10 mock organizations
		const orgCount = Math.min(stats.organizations.total, 10);
		const avgSubmissionsPerOrg = Math.round(stats.submissions.total / stats.organizations.total);

		const labels = Array.from({ length: orgCount }, (_, i) => `Org ${i + 1}`);
		const data = Array.from({ length: orgCount }, () =>
			Math.round(avgSubmissionsPerOrg * (0.5 + Math.random() * 1.5))
		).sort((a, b) => b - a); // Sort descending

		return { labels, data };
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-4xl font-bold text-slate-900">Dashboard</h1>
		<p class="text-slate-600 mt-2">Platform-wide metrics and key performance indicators</p>
	</div>

	{#if loading}
		<!-- Skeleton Loading State -->
		<div class="space-y-6">
			<!-- Skeleton Tabs -->
			<div class="border-b border-slate-200 bg-white">
				<nav class="flex space-x-1">
					{#each [1, 2, 3, 4, 5] as _}
						<Skeleton class="h-12 w-32" />
					{/each}
				</nav>
			</div>

			<!-- Skeleton Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each [1, 2, 3, 4] as _}
					<Card>
						<div class="p-6 space-y-3">
							<Skeleton class="h-4 w-24" />
							<Skeleton class="h-10 w-20" />
						</div>
					</Card>
				{/each}
			</div>

			<!-- Skeleton Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				{#each [1, 2, 3, 4] as _}
					<Card>
						<div class="p-6 space-y-4">
							<Skeleton class="h-6 w-32" />
							<Skeleton class="h-4 w-48" />
							<div class="grid grid-cols-2 gap-4">
								<Skeleton class="h-24" />
								<Skeleton class="h-24" />
							</div>
						</div>
					</Card>
				{/each}
			</div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<p class="text-red-800 font-medium">Error loading dashboard</p>
			<p class="text-red-600 text-sm mt-1">{error}</p>
		</div>
	{:else if !stats}
		<!-- Empty State -->
		<Card>
			<div class="p-12 text-center">
				<div class="text-6xl mb-4">📊</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No Dashboard Data Available</h3>
				<p class="text-slate-600">Dashboard statistics will appear here once data is available.</p>
			</div>
		</Card>
	{:else if stats}
		<!-- Tab Navigation -->
		<div class="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
			<nav class="flex gap-2 px-6 py-4 overflow-x-auto">
				{#each tabs as tab}
					<button
						onclick={() => activeTab = tab.id}
						class={`
							relative px-6 py-3 rounded-lg text-sm font-semibold
							transition-all duration-300 ease-out
							flex items-center gap-2 whitespace-nowrap
							${
								activeTab === tab.id
									? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 scale-105'
									: 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md hover:scale-102'
							}
						`}
					>
						<span class="text-lg">{tab.icon}</span>
						<span>{tab.label}</span>
						{#if activeTab === tab.id}
							<div class="absolute inset-0 bg-white/20 rounded-lg animate-pulse"></div>
						{/if}
					</button>
				{/each}
			</nav>
		</div>

		<!-- Tab Content -->
		<div class="py-4">
			{#if activeTab === 'overview'}
				<!-- OVERVIEW TAB: Key metrics from all sections -->
				<div class="space-y-6">
					<!-- Key Platform Metrics -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<StatCard title="Total Organizations" value={stats.organizations.total} icon="🏢" />
						<StatCard title="Total Users" value={stats.users.total} icon="👥" />
						<StatCard title="Active Projects" value={stats.projects.byStatus.active} icon="🚀" />
						<StatCard title="Total Submissions" value={stats.submissions.total} icon="📋" />
					</div>

					<!-- Submission Trends Chart (Full Width) -->
					<Card>
						<CardHeader>
							<CardTitle>Submission Activity Trend</CardTitle>
							<CardDescription>Daily submissions over the last 30 days</CardDescription>
						</CardHeader>
						<CardContent>
							<AreaChart
								labels={submissionTrendData().labels}
								datasets={[
									{
										label: 'Submissions',
										data: submissionTrendData().data,
										borderColor: '#3b82f6',
										backgroundColor: 'rgba(59, 130, 246, 0.2)'
									}
								]}
								height="350px"
							/>
						</CardContent>
					</Card>

					<!-- Entity Distribution & Activity Heatmap -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Entity Distribution Doughnut Chart -->
						<Card>
							<CardHeader>
								<CardTitle>Platform Overview</CardTitle>
								<CardDescription>Distribution of key entities</CardDescription>
							</CardHeader>
							<CardContent>
								<DoughnutChart
									labels={['Active Organizations', 'Total Users', 'Active Projects', 'Submissions (30d)']}
									data={[
										stats.organizations.active,
										stats.users.total,
										stats.projects.byStatus.active,
										stats.submissions.last30Days
									]}
									height="350px"
								/>
							</CardContent>
						</Card>

						<!-- Activity Heatmap -->
						<Card>
							<CardHeader>
								<CardTitle>Weekly Activity Comparison</CardTitle>
								<CardDescription>User engagement vs submissions over 4 weeks</CardDescription>
							</CardHeader>
							<CardContent>
								<BarChart
									labels={activityHeatmapData().labels}
									datasets={activityHeatmapData().datasets}
									height="350px"
								/>
							</CardContent>
						</Card>
					</div>

					<!-- Growth Trend (Full Width) -->
					<Card>
						<CardHeader>
							<CardTitle>Platform Growth Trend</CardTitle>
							<CardDescription>Organizations and users growth over the last 60 days</CardDescription>
						</CardHeader>
						<CardContent>
							<AreaChart
								labels={growthTrendData().labels}
								datasets={growthTrendData().datasets}
								height="350px"
							/>
						</CardContent>
					</Card>
				</div>

			{:else if activeTab === 'organizations'}
				<!-- ORGANIZATIONS TAB: Detailed organization metrics -->
				<div class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<StatCard title="Total Organizations" value={stats.organizations.total} icon="🏢" />
						<StatCard
							title="Active Organizations"
							value={stats.organizations.active}
							subtitle="With submissions in last 30 days"
							icon="✅"
						/>
						<StatCard
							title="Created This Month"
							value={stats.organizations.createdThisMonth}
							icon="🆕"
						/>
						<StatCard title="Dormant Organizations" value={stats.organizations.dormant} icon="💤" />
					</div>

					<!-- Organization Growth Timeline -->
					<Card>
						<CardHeader>
							<CardTitle>Organization Growth Timeline</CardTitle>
							<CardDescription>New vs total organizations over 12 months</CardDescription>
						</CardHeader>
						<CardContent>
							<LineChart
								labels={orgGrowthData().labels}
								datasets={orgGrowthData().datasets}
								height="350px"
							/>
						</CardContent>
					</Card>

					<!-- Organization Distribution Charts -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Health Status Doughnut -->
						<Card>
							<CardHeader>
								<CardTitle>Organization Health Status</CardTitle>
								<CardDescription>Active vs dormant breakdown</CardDescription>
							</CardHeader>
							<CardContent>
								<DoughnutChart
									labels={orgDistributionData().labels}
									data={orgDistributionData().data}
									colors={orgDistributionData().colors}
									height="350px"
								/>
							</CardContent>
						</Card>

						<!-- Active vs Inactive Bar Chart -->
						<Card>
							<CardHeader>
								<CardTitle>Activity Comparison</CardTitle>
								<CardDescription>Organizations by activity status</CardDescription>
							</CardHeader>
							<CardContent>
								<BarChart
									labels={['Active', 'Dormant']}
									datasets={[
										{
											label: 'Organizations',
											data: [stats.organizations.active, stats.organizations.dormant],
											backgroundColor: '#3b82f6'
										}
									]}
									horizontal={true}
									height="350px"
								/>
							</CardContent>
						</Card>
					</div>
				</div>

			{:else if activeTab === 'users'}
				<!-- USERS TAB: Detailed user metrics -->
				<div class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<StatCard title="Total Users" value={stats.users.total} icon="👥" />
						<StatCard title="Active Users" value={stats.users.active} icon="🟢" />
						<StatCard title="Inactive Users" value={stats.users.inactive} icon="🔴" />
						<StatCard
							title="Avg Users/Org"
							value={stats.users.averagePerOrganization.toFixed(1)}
							icon="📊"
						/>
					</div>

					<!-- User Registration Trends -->
					<Card>
						<CardHeader>
							<CardTitle>User Registration Trends</CardTitle>
							<CardDescription>Monthly user registrations by role over 12 months</CardDescription>
						</CardHeader>
						<CardContent>
							<LineChart
								labels={userRegistrationData().labels}
								datasets={userRegistrationData().datasets}
								height="350px"
							/>
						</CardContent>
					</Card>

					<!-- User Distribution Charts -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Role Distribution -->
						<Card>
							<CardHeader>
								<CardTitle>User Distribution by Role</CardTitle>
								<CardDescription>Admins vs agents breakdown</CardDescription>
							</CardHeader>
							<CardContent>
								<DoughnutChart
									labels={userRoleData().labels}
									data={userRoleData().data}
									colors={userRoleData().colors}
									height="350px"
								/>
							</CardContent>
						</Card>

						<!-- Activity Status -->
						<Card>
							<CardHeader>
								<CardTitle>User Activity Status</CardTitle>
								<CardDescription>Active vs inactive users</CardDescription>
							</CardHeader>
							<CardContent>
								<BarChart
									labels={userActivityData().labels}
									datasets={userActivityData().datasets}
									horizontal={true}
									height="350px"
								/>
							</CardContent>
						</Card>
					</div>
				</div>

			{:else if activeTab === 'projects'}
				<!-- PROJECTS TAB: Detailed project metrics -->
				<div class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<StatCard title="Total Projects" value={stats.projects.total} icon="📁" />
						<StatCard title="Draft Projects" value={stats.projects.byStatus.draft} icon="📝" />
						<StatCard title="Active Projects" value={stats.projects.byStatus.active} icon="🚀" />
						<StatCard title="Closed Projects" value={stats.projects.byStatus.closed} icon="✔️" />
					</div>

					<!-- Project Creation Timeline -->
					<Card>
						<CardHeader>
							<CardTitle>Project Creation Timeline</CardTitle>
							<CardDescription>Monthly project creation trend over 12 months</CardDescription>
						</CardHeader>
						<CardContent>
							<LineChart
								labels={projectCreationData().labels}
								datasets={projectCreationData().datasets}
								height="350px"
							/>
						</CardContent>
					</Card>

					<!-- Project Distribution Charts -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Status Distribution Doughnut -->
						<Card>
							<CardHeader>
								<CardTitle>Project Status Distribution</CardTitle>
								<CardDescription>Breakdown by current status</CardDescription>
							</CardHeader>
							<CardContent>
								<DoughnutChart
									labels={projectStatusData().labels}
									data={projectStatusData().data}
									colors={projectStatusData().colors}
									height="350px"
								/>
							</CardContent>
						</Card>

						<!-- Status Comparison Bar Chart -->
						<Card>
							<CardHeader>
								<CardTitle>Status Comparison</CardTitle>
								<CardDescription>Project counts by status</CardDescription>
							</CardHeader>
							<CardContent>
								<BarChart
									labels={projectStatusData().labels}
									datasets={[
										{
											label: 'Projects',
											data: projectStatusData().data,
											backgroundColor: projectStatusData().colors
										}
									]}
									height="350px"
								/>
							</CardContent>
						</Card>
					</div>
				</div>

			{:else if activeTab === 'submissions'}
				<!-- SUBMISSIONS TAB: Detailed submission metrics -->
				<div class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<StatCard title="Total Submissions" value={stats.submissions.total} icon="📋" />
						<StatCard
							title="Last 7 Days"
							value={stats.submissions.last7Days}
							subtitle="Recent activity"
							icon="📅"
						/>
						<StatCard
							title="Last 30 Days"
							value={stats.submissions.last30Days}
							subtitle="Monthly activity"
							icon="📆"
						/>
						<StatCard
							title="Avg per Project"
							value={stats.submissions.averagePerProject.toFixed(1)}
							icon="📊"
						/>
					</div>

					<!-- Submission Timeline (Full Width) -->
					<Card>
						<CardHeader>
							<CardTitle>Submission Activity Timeline</CardTitle>
							<CardDescription>Daily submissions over the last 60 days</CardDescription>
						</CardHeader>
						<CardContent>
							<AreaChart
								labels={submissionTimelineData().labels}
								datasets={[
									{
										label: 'Submissions',
										data: submissionTimelineData().data,
										borderColor: '#3b82f6',
										backgroundColor: 'rgba(59, 130, 246, 0.2)'
									}
								]}
								height="350px"
							/>
						</CardContent>
					</Card>

					<!-- Submissions by Organization & Activity Comparison -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Top Organizations -->
						<Card>
							<CardHeader>
								<CardTitle>Top Organizations by Submissions</CardTitle>
								<CardDescription>Top 10 organizations by data collection volume</CardDescription>
							</CardHeader>
							<CardContent>
								<BarChart
									labels={submissionsByOrgData().labels}
									datasets={[
										{
											label: 'Submissions',
											data: submissionsByOrgData().data,
											backgroundColor: '#3b82f6'
										}
									]}
									horizontal={true}
									height="350px"
								/>
							</CardContent>
						</Card>

						<!-- Activity Comparison -->
						<Card>
							<CardHeader>
								<CardTitle>Submission Rate Comparison</CardTitle>
								<CardDescription>Daily average comparisons</CardDescription>
							</CardHeader>
							<CardContent>
								<BarChart
									labels={['Last 7 Days', 'Last 30 Days']}
									datasets={[
										{
											label: 'Daily Average',
											data: [
												parseFloat((stats.submissions.last7Days / 7).toFixed(1)),
												parseFloat((stats.submissions.last30Days / 30).toFixed(1))
											],
											backgroundColor: ['#3b82f6', '#10b981']
										}
									]}
									height="350px"
								/>
							</CardContent>
						</Card>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="text-center text-sm text-slate-500 pt-8 border-t border-slate-200">
			Last updated: {formatDateTime(stats.generatedAt)}
		</div>
	{/if}
</div>
