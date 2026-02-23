<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import { icons } from '$lib/components/icons.svelte';
	import { onMount } from 'svelte';
	import { registerApiCaller } from '$lib/offline';
	import OfflineBanner from '$lib/components/ui/offline-banner.svelte';

	let { children } = $props();
	let currentUser = $state<any | null>(null);
	let showMobileMenu = $state(false);

	const navItems = [
		{ label: 'Projects', icon: icons.Folder(20), href: '/project', path: '/project' },
		{ label: 'Sync', icon: icons.RefreshCw(20), href: '/sync', path: '/sync' },
		{ label: 'Profile', icon: icons.User(20), href: '/profile', path: '/profile' }
	];

	// Register the API caller for offline sync
	registerApiCaller(async (item) => {
		if (item.entityType === 'submission' && item.operation === 'create') {
			const payload = item.payload as any;
			const response = payload.responses?.[0];

			if (response) {
				const { data, error } = await api.submitData({
					projectId: payload.projectId,
					formId: response.formId,
					answers: response.answers,
					localSyncId: payload.localId
				});

				if (error) {
					throw new Error(error);
				}

				return { remoteId: data?.id };
			}
		}
		return {};
	});

	onMount(async () => {
		// Load current user
		const result = await api.getCurrentUser();
		if ('error' in result && result.error) {
			// Handle error case
		} else if (result.data) {
			currentUser = result.data;
		}
	});

	function isActive(path: string) {
		return $page.url.pathname.startsWith(path);
	}

	function handleLogout() {
		api.logout();
	}

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}
</script>

<div class="min-h-screen bg-slate-50">
	<!-- Offline Indicator -->
	<OfflineBanner />

	<!-- Mobile Top Header -->
	<header class="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
		<div class="px-4 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				{#if currentUser}
					<img
						src="https://api.dicebear.com/7.x/notionists/svg?seed={currentUser.email}"
						alt="Avatar"
						class="h-9 w-9 rounded-full bg-slate-100 ring-2 ring-blue-100"
					/>
				{/if}
				<div>
					<h1 class="text-lg font-bold text-slate-900">FieldScope</h1>
					{#if currentUser}
						<p class="text-xs text-slate-600">{currentUser.email}</p>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={toggleMobileMenu}
				class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
			>
				{@html showMobileMenu ? icons.X(24) : icons.Menu(24)}
			</button>
		</div>

		<!-- Mobile Menu Dropdown -->
		{#if showMobileMenu}
			<div class="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg">
				<nav class="px-4 py-2">
					<!-- {#each navItems as item}
						<a
							href={item.href}
							onclick={() => (showMobileMenu = false)}
							class="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors {isActive(
								item.path
							)
								? 'bg-blue-50 text-blue-600'
								: 'text-slate-700 hover:bg-slate-50'}"
						>
							<span>{@html item.icon}</span>
							<span class="font-medium">{item.label}</span>
						</a>
					{/each} -->
					<button
						type="button"
						onclick={handleLogout}
						class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
					>
						<span>{@html icons.LogOut(20)}</span>
						<span class="font-medium">Logout</span>
					</button>
				</nav>
			</div>
		{/if}
	</header>

	<!-- Desktop Sidebar -->
	<aside
		class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-white lg:border-r lg:border-slate-200 lg:shadow-sm z-30"
	>
		<!-- Logo/Brand -->
		<div class="p-6 border-b border-slate-200">
			<h1 class="text-2xl font-bold text-slate-900">FieldScope</h1>
			<p class="text-sm text-slate-600 mt-1">Field Contributor</p>
		</div>

		<!-- User Info -->
		{#if currentUser}
			<div class="px-6 py-4 border-b border-slate-200">
				<div class="flex items-center gap-3">
					<img
						src="https://api.dicebear.com/7.x/notionists/svg?seed={currentUser.email}"
						alt="Avatar"
						class="h-12 w-12 rounded-full bg-slate-100 ring-2 ring-blue-100"
					/>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-semibold text-slate-900 truncate">{currentUser.email}</p>
						<p class="text-xs text-slate-600">Agent</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Navigation -->
		<nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors {isActive(
						item.path
					)
						? 'bg-blue-50 text-blue-600'
						: 'text-slate-700 hover:bg-slate-50'}"
				>
					<span>{@html item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- Logout Button -->
		<div class="p-4 border-t border-slate-200">
			<button
				type="button"
				onclick={handleLogout}
				class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
			>
				<span>{@html icons.LogOut(20)}</span>
				<span>Logout</span>
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="lg:pl-64 min-h-screen pb-20 lg:pb-0">
		{@render children()}
	</main>

	<!-- Mobile Bottom Navigation -->
	<nav
		class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40"
	>
		<div class="grid grid-cols-3 px-2 py-2">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors {isActive(
						item.path
					)
						? 'text-blue-600'
						: 'text-slate-600'}"
				>
					<span class="{isActive(item.path) ? 'scale-110' : ''} transition-transform">
						{@html item.icon}
					</span>
					<span class="text-xs font-medium">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
