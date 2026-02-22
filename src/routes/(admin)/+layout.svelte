<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import { getCurrentUser } from '$lib/auth';
	import { icons } from '$lib/components/icons.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import icon from '$lib/assets/transIcon.png';

	let { children } = $props();

	const currentUser = getCurrentUser();

	let showLogoutDialog = $state(false);
	let loggingOut = $state(false);
	let sidebarCollapsed = $state(false);
	let showMobileMenu = $state(false);

	const navItems = [
		{ href: '/projects', label: 'Projects', icon: 'Folder' },
		{ href: '/agents', label: 'Contributors', icon: 'Users' },
		// { href: '/fieldwork', label: 'Field Work', icon: 'ClipboardList' }
		// { href: '/settings', label: 'Settings', icon: 'Settings' }
	];

	function isActive(href: string | undefined): boolean {
		if (!href) return false;
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	async function confirmLogout() {
		loggingOut = true;
		await api.logout();
		loggingOut = false;
	}

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}
</script>

<div class="flex h-screen bg-slate-50 overflow-hidden">
	<!-- Mobile Header -->
	<header class="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40 shadow-sm">
		<div class="px-4 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<img src={icon} alt="FieldScope" class="w-8 h-8 rounded-lg shrink-0" />
				<h1 class="text-lg font-bold text-slate-900">FieldScope</h1>
			</div>
			<button onclick={toggleMobileMenu} class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
				{@html showMobileMenu ? icons.X(24) : icons.Menu(24)}
			</button>
		</div>

		{#if showMobileMenu}
			<div class="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg">
				<nav class="px-4 py-2">
					<!-- Mobile is only for filling forms, no navigation items -->
					<div class="px-3 py-4 text-center text-slate-600 text-sm">
						<p class="font-medium mb-1">Mobile View</p>
						<p class="text-xs">Use desktop to manage projects and forms</p>
					</div>
					<button
						onclick={confirmLogout}
						class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
					>
						{@html icons.LogOut(20)}
						<span class="font-medium">Logout</span>
					</button>
				</nav>
			</div>
		{/if}
	</header>

	<!-- Sidebar -->
	<aside class="hidden lg:flex relative {sidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex-col transition-all duration-300">
		<!-- Logo/Brand -->
		<div class="p-4 border-b border-slate-800">
			<div class="flex items-center {sidebarCollapsed ? 'justify-center' : 'gap-1'}">
				<img src={icon} alt="FieldScope" class="w-14 h-14 rounded-lg shrink-0" />
				{#if !sidebarCollapsed}
					<div>
						<h1 class="text-xl font-bold tracking-tight">FieldScope</h1>
						<p class="text-xs text-slate-400 mb-1">Admin Panel</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Toggle Button -->
		<button
			onclick={toggleSidebar}
			class="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors z-10"
		>
			{@html sidebarCollapsed ? icons.ChevronRight(16) : icons.ChevronLeft(16)}
		</button>

		<!-- Navigation -->
		<nav class="flex-1 p-4 overflow-y-auto">
			<ul class="space-y-2">
				{#each navItems as item}
					<li>
						<a
							href={item.href}
							class={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-sm font-medium transition-all ${
								isActive(item.href)
									? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
									: 'text-slate-300 hover:bg-slate-800 hover:text-white'
							}`}
							title={sidebarCollapsed ? item.label : ''}
						>
							<div class="w-5 h-5 flex items-center justify-center shrink-0">
								{@html icons[item.icon as keyof typeof icons](20)}
							</div>
							{#if !sidebarCollapsed}
								<span>{item.label}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<!-- User Profile & Logout -->
		 <div class="p-4 border-t border-slate-800">
			{#if !sidebarCollapsed}
				<!-- Expanded View -->
				<div class="flex items-center gap-3 mb-4 px-2">
					<!-- Avatar -->
					<img
						src="https://api.dicebear.com/7.x/notionists/svg?seed={currentUser?.email || 'Admin'}"
						alt={currentUser?.email || 'Admin'}
						class="w-10 h-10 rounded-full bg-slate-100"
					/>

					<!-- User Info -->
					<div class="flex-1 min-w-0">
						<p class="text-sm font-semibold text-white truncate">
							{currentUser?.email || 'admin@site.com'}
						</p>
						<p class="text-xs text-slate-400 truncate">
							{'Admininistrator'}
						</p>
					</div>
				</div>
			{:else}
				<!-- Collapsed View -->
				<div class="flex justify-center mb-3 px-2">
					<img
						src="https://api.dicebear.com/7.x/notionists/svg?seed={currentUser?.email || 'Admin'}"
						alt={currentUser?.email || 'Admin'}
						class="w-10 h-10 rounded-full bg-slate-100"
					/>
				</div>
			{/if}

			<!-- Logout Button -->
			<button
				onclick={() => (showLogoutDialog = true)}
				title={sidebarCollapsed ? 'Logout' : ''}
				class="group w-full flex items-center 
					{sidebarCollapsed ? 'justify-center' : 'gap-2 justify-center'} 
					px-4 py-2.5 text-sm font-medium text-slate-300 
					border border-transparent rounded-lg
					hover:text-white hover:bg-red-600/10 hover:border-red-600/40
					transition-all duration-150"
			>
				<div class="flex items-center justify-center w-5 h-5">
					{@html icons.LogOut(16)}
				</div>

				{#if !sidebarCollapsed}
					<span class="tracking-wide">Logout</span>
				{/if}
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 overflow-auto bg-slate-50 pt-16 lg:pt-0">
		<div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
			{@render children()}
		</div>
	</main>
</div>

<!-- Logout Confirmation Dialog -->
<Dialog
	bind:open={showLogoutDialog}
	onClose={() => (showLogoutDialog = false)}
	title="Confirm Logout"
	description="Are you sure you want to logout?"
>
	<div class="flex gap-3 pt-4">
		<Button variant="destructive" class="flex-1" loading={loggingOut} onclick={confirmLogout}>
			{loggingOut ? 'Logging out...' : 'Logout'}
		</Button>
		<Button
			variant="outline"
			class="flex-1"
			onclick={() => (showLogoutDialog = false)}
			loading={loggingOut}
		>
			{loggingOut ? 'Please wait...' : 'Cancel'}
		</Button>
	</div>
</Dialog>
