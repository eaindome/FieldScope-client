<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { formatDateTime } from '$lib/utils';

	let currentUser = $state<any | null>(null);
	let organization = $state<any | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let statistics = $state<any | null>(null);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		// Load current user
		const { data: userData, error: userError } = await api.getCurrentUser();
		if (userError) {
			error = userError;
			loading = false;
			return;
		}
		currentUser = userData;

		// Set organization data from API response
		if (userData && userData.organizationId) {
			organization = {
				id: userData.organizationId,
				name: userData.organizationName || `Organization #${userData.organizationId}`
			};
		}

		// TODO: Load agent statistics when endpoint is implemented on server
		// if (userData && userData.id) {
		// 	const { data: statsData } = await api.getAgentStatistics(userData.id);
		// 	if (statsData) {
		// 		statistics = statsData;
		// 	}
		// }

		loading = false;
	}

	function handleLogout() {
		api.logout();
	}
</script>

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<div class="bg-white border-b border-slate-200 px-4 lg:px-8 py-6">
		<h1 class="text-2xl lg:text-3xl font-bold text-slate-900">Profile</h1>
		<p class="text-slate-600 mt-1">Manage your account and view your activity</p>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="p-4 lg:p-8 space-y-4">
			<Card class="p-6">
				<Skeleton class="h-32 w-full" />
			</Card>
			<Card class="p-6">
				<Skeleton class="h-48 w-full" />
			</Card>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="p-4 lg:p-8">
			<Card class="p-8">
				<div class="text-center">
					<div class="flex justify-center mb-4 text-red-300">
						{@html icons.AlertCircle(48)}
					</div>
					<h3 class="text-lg font-semibold text-slate-900 mb-2">Error Loading Profile</h3>
					<p class="text-sm text-slate-600 mb-6">{error}</p>
					<Button onclick={loadData}>Try Again</Button>
				</div>
			</Card>
		</div>
	{:else if currentUser}
		<!-- Profile Content -->
		<div class="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
			<!-- User Info Card -->
			<Card class="overflow-hidden">
				<div class="bg-linear-to-r from-blue-500 to-blue-600 px-6 py-8 lg:py-12">
					<div class="flex flex-col items-center text-center">
						<img
							src="https://api.dicebear.com/7.x/notionists/svg?seed={currentUser.email}"
							alt="Avatar"
							class="h-24 w-24 lg:h-32 lg:w-32 rounded-full bg-white ring-4 ring-white/30 mb-4"
						/>
						<h2 class="text-2xl lg:text-3xl font-bold text-white mb-1">
							{currentUser.name || 'Field Contributor'}
						</h2>
						<p class="text-blue-100 mb-3">{currentUser.email}</p>
						<Badge variant="default" class="bg-white/20 text-white border-white/30">
							Contributor
						</Badge>
					</div>
				</div>

				<div class="p-6 space-y-4">
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<div class="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
							<div class="p-2 bg-blue-100 rounded-lg text-blue-600">
								{@html icons.Mail(20)}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-xs text-slate-600 font-medium">Email Address</p>
								<p class="text-sm text-slate-900 truncate">{currentUser.email}</p>
							</div>
						</div>

						<div class="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
							<div class="p-2 bg-green-100 rounded-lg text-green-600">
								{@html icons.Shield(20)}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-xs text-slate-600 font-medium">Role</p>
								<p class="text-sm text-slate-900">Contributor</p>
							</div>
						</div>

						{#if organization}
							<div class="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
								<div class="p-2 bg-purple-100 rounded-lg text-purple-600">
									{@html icons.Building(20)}
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-xs text-slate-600 font-medium">Organization</p>
									<p class="text-sm text-slate-900">{organization.name}</p>
								</div>
							</div>
						{/if}

						{#if currentUser.createdAt}
							<div class="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
								<div class="p-2 bg-orange-100 rounded-lg text-orange-600">
									{@html icons.Calendar(20)}
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-xs text-slate-600 font-medium">Member Since</p>
									<p class="text-sm text-slate-900">{formatDateTime(currentUser.createdAt)}</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</Card>

			<!-- Statistics Card -->
			{#if statistics}
				<Card class="p-6">
					<h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
						{@html icons.Activity(20)}
						<span>Your Activity</span>
					</h3>

					<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
						<div class="p-4 bg-blue-50 rounded-lg border border-blue-100">
							<p class="text-sm text-blue-600 font-medium mb-1">Total Submissions</p>
							<p class="text-2xl font-bold text-blue-900">
								{statistics.submissions?.total || 0}
							</p>
						</div>

						<div class="p-4 bg-green-50 rounded-lg border border-green-100">
							<p class="text-sm text-green-600 font-medium mb-1">Last 7 Days</p>
							<p class="text-2xl font-bold text-green-900">
								{statistics.submissions?.last7Days || 0}
							</p>
						</div>

						<div class="p-4 bg-purple-50 rounded-lg border border-purple-100">
							<p class="text-sm text-purple-600 font-medium mb-1">Last 30 Days</p>
							<p class="text-2xl font-bold text-purple-900">
								{statistics.submissions?.last30Days || 0}
							</p>
						</div>

						<div class="p-4 bg-orange-50 rounded-lg border border-orange-100">
							<p class="text-sm text-orange-600 font-medium mb-1">Avg Per Day</p>
							<p class="text-2xl font-bold text-orange-900">
								{statistics.submissions?.avgPerDay?.toFixed(1) || '0.0'}
							</p>
						</div>
					</div>
				</Card>
			{/if}

			<!-- App Information -->
			<!-- <Card class="p-6">
				<h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
					{@html icons.Info(20)}
					<span>App Information</span>
				</h3>

				<div class="space-y-3 text-sm">
					<div class="flex items-center justify-between py-2 border-b border-slate-100">
						<span class="text-slate-600">Version</span>
						<span class="font-medium text-slate-900">1.0.0</span>
					</div>
					<div class="flex items-center justify-between py-2 border-b border-slate-100">
						<span class="text-slate-600">Environment</span>
						<span class="font-medium text-slate-900">Production</span>
					</div>
					<div class="flex items-center justify-between py-2">
						<span class="text-slate-600">Platform</span>
						<span class="font-medium text-slate-900">Web / PWA</span>
					</div>
				</div>
			</Card> -->

			<!-- Logout Section -->
			<Card class="p-6">
				<h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
					{@html icons.Settings(20)}
					<span>Account Actions</span>
				</h3>

				<p class="text-sm text-slate-600 mb-4">
					Sign out of your account. You'll need to log in again to access the app.
				</p>

				<Button variant="destructive" onclick={handleLogout} class="w-full lg:w-auto">
					{@html icons.LogOut(16)}
					<span class="ml-2">Logout</span>
				</Button>
			</Card>
		</div>
	{/if}
</div>
