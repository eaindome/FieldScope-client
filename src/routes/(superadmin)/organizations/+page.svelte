<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Sidebar from '$lib/components/ui/sidebar.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import TableFilters from '$lib/components/ui/table-filters.svelte';
	import { formatDateTime } from '$lib/utils';
	import { icons } from '$lib/components/icons.svelte';
	import Toast from '$lib/components/ui/toast.svelte';

	let allOrganizations = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// Filter state
	let searchValue = $state('');
	let selectedStatus = $state('All');
	let startDate = $state('');
	let endDate = $state('');

	// Pagination state
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	// Create Organization Dialog
	let createSidebarOpen = $state(false);
	let submitting = $state(false);

	// Add Admin Dialog
	let showAdminDialog = $state(false);
	let selectedOrgId = $state<number | null>(null);
	let adminEmail = $state('');
	let adminToken = $state<string | null>(null);

	// View Sidebar
	let viewSidebarOpen = $state(false);
	let selectedOrg = $state<any | null>(null);

	// Edit Sidebar
	let editSidebarOpen = $state(false);
	let editForm = $state<any | null>(null);
	let editSubmitting = $state(false);
	let editError = $state<string | null>(null);

	// Delete Dialog
	let deleteDialogOpen = $state(false);
	let orgToDelete = $state<any | null>(null);
	let deleteSubmitting = $state(false);

	// Create Organization Form data
	let orgForm = $state({
		name: '',
		description: '',
		address: '',
		city: '',
		country: '',
		phone: '',
		email: '',
		website: '',
		timeZone: 'Africa/Nairobi'
	});

	onMount(async () => {
		await loadOrganizations();
	});

	async function loadOrganizations() {
		loading = true;
		const response = await api.getOrganizations();
		if ('error' in response && response.error) {
			error = response.error;
		} else if ('data' in response) {
			allOrganizations = response.data || [];
		}
		loading = false;
	}

	// Client-side filtering
	const organizations = $derived.by(() => {
		let filtered = allOrganizations;

		// Filter by search (name, email, city, country)
		if (searchValue) {
			const search = searchValue.toLowerCase();
			filtered = filtered.filter(
				(org) =>
					org.name.toLowerCase().includes(search) ||
					org.email?.toLowerCase().includes(search) ||
					org.city?.toLowerCase().includes(search) ||
					org.country?.toLowerCase().includes(search)
			);
		}

		// Filter by status
		if (selectedStatus !== 'All') {
			const isActive = selectedStatus === 'Active';
			filtered = filtered.filter((org) => org.isActive === isActive);
		}

		// Filter by date range
		if (startDate) {
			const start = new Date(startDate);
			filtered = filtered.filter((org) => new Date(org.createdAt) >= start);
		}
		if (endDate) {
			const end = new Date(endDate);
			filtered = filtered.filter((org) => new Date(org.createdAt) <= end);
		}

		return filtered;
	});

	// Paginated data
	const paginatedOrganizations = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return organizations.slice(startIndex, endIndex);
	});

	// Reset to page 1 when filters change
	$effect(() => {
		searchValue;
		selectedStatus;
		startDate;
		endDate;
		currentPage = 1;
	});

	async function handleCreateOrganization(e: Event) {
		e.preventDefault();
		submitting = true;
		error = null;

		const { error: err } = await api.createOrganization(orgForm);
		if (err) {
			error = err;
		} else {
			toastType = 'success';
			toastMessage = 'Organization created successfully!';
			createSidebarOpen = false;
			resetForm();
			await loadOrganizations();
			setTimeout(() => (toastMessage = null), 3000);
		}
		submitting = false;
	}

	async function handleCreateAdmin(e: Event) {
		e.preventDefault();
		if (!selectedOrgId) return;

		submitting = true;
		error = null;
		adminToken = null;

		const { data, error: err } = await api.createAdminForOrganization(selectedOrgId, adminEmail);
		if (err) {
			error = err;
		} else if (data) {
			adminToken = data.token;
			toastType = 'success';
			toastMessage = `Admin invitation sent to ${adminEmail}!`;
			setTimeout(() => (toastMessage = null), 5000);
		}
		submitting = false;
	}

	function resetForm() {
		orgForm = {
			name: '',
			description: '',
			address: '',
			city: '',
			country: '',
			phone: '',
			email: '',
			website: '',
			timeZone: 'Africa/Nairobi'
		};
		error = null;
	}

	function openCreateSidebar() {
		resetForm();
		createSidebarOpen = true;
	}

	function openAdminDialog(orgId: number) {
		selectedOrgId = orgId;
		showAdminDialog = true;
		adminEmail = '';
		adminToken = null;
		error = null;
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toastType = 'success';
			toastMessage = 'Token copied to clipboard!';
		setTimeout(() => (toastMessage = null), 2000);
	}

	function openViewSidebar(org: any) {
		selectedOrg = org;
		viewSidebarOpen = true;
	}

	function openEditSidebar(org: any) {
		editForm = {
			name: org.name,
			description: org.description || '',
			address: org.address || '',
			city: org.city || '',
			country: org.country || '',
			phone: org.phone || '',
			email: org.email || '',
			website: org.website || '',
			timeZone: org.timeZone || 'Africa/Nairobi'
		};
		selectedOrg = org;
		editError = null;
		editSidebarOpen = true;
	}

	async function handleUpdateOrganization(e: Event) {
		e.preventDefault();
		if (!editForm || !selectedOrg) return;

		editSubmitting = true;
		editError = null;

		const { error: err } = await api.updateOrganization(selectedOrg.id, editForm);

		if (err) {
			editError = err;
			editSubmitting = false;
			return;
		}

		editSubmitting = false;
		editSidebarOpen = false;
		toastType = 'success';
			toastMessage = 'Organization updated successfully!';
		await loadOrganizations();
		setTimeout(() => (toastMessage = null), 3000);
	}

	function openDeleteDialog(org: any) {
		orgToDelete = org;
		deleteDialogOpen = true;
	}

	async function handleDeleteOrganization() {
		if (!orgToDelete) return;
		deleteSubmitting = true;
		error = null;

		const { error: err } = await api.deleteOrganization(orgToDelete.id);

		if (err) {
			error = err;
			deleteSubmitting = false;
			return;
		}

		deleteSubmitting = false;
		deleteDialogOpen = false;
		toastType = 'success';
			toastMessage = 'Organization deleted successfully!';
		await loadOrganizations();
		setTimeout(() => (toastMessage = null), 3000);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-slate-900">Organizations</h1>
			<p class="text-slate-600 mt-2">Manage organizations and their administrators</p>
		</div>
		<Button onclick={openCreateSidebar}>+ Create Organization</Button>
	</div>


	<!-- Table Filters -->
	<TableFilters
		searchPlaceholder="Search by name, email, or location..."
		bind:searchValue
		statusOptions={[
			{ label: 'All', value: 'All' },
			{ label: 'Active', value: 'Active' },
			{ label: 'Inactive', value: 'Inactive' }
		]}
		bind:selectedStatus
		dateRangeEnabled={true}
		bind:startDate
		bind:endDate
		totalItems={organizations.length}
		bind:currentPage
		bind:itemsPerPage
		collapsible={true}
		defaultCollapsed={true}
	/>

	<!-- Organizations Table -->
	{#if loading}
		<Card>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-50 border-b border-slate-200">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Actions</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Name</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Location</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Contact</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Created</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each [1, 2, 3, 4, 5] as _}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-8 w-32" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-5 w-48" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-32" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-40" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-6 w-16" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-32" />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{:else if organizations.length === 0}
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Building(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">
					{#if searchValue || selectedStatus !== 'All' || startDate || endDate}
						No organizations found
					{:else}
						No organizations yet
					{/if}
				</h3>
				<p class="text-slate-600">
					{#if searchValue || selectedStatus !== 'All' || startDate || endDate}
						No organizations match your current filters
					{:else}
						Create your first organization to get started
					{/if}
				</p>
			</div>
		</Card>
	{:else}
		<Card>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-50 border-b border-slate-200">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Actions</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Name</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Location</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Contact</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Created</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each paginatedOrganizations as org}
							<tr class="hover:bg-slate-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<DropdownMenu align="left">
										{#snippet children({ close }: { close: () => void })}
											<DropdownMenuItem
												icon={icons.Eye(16)}
												onclick={() => {
													openViewSidebar(org);
													close();
												}}
											>
												View Details
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.Edit(16)}
												onclick={() => {
													openEditSidebar(org);
													close();
												}}
											>
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												icon={icons.Trash(16)}
												variant="danger"
												onclick={() => {
													openDeleteDialog(org);
													close();
												}}
											>
												Delete
											</DropdownMenuItem>
										{/snippet}
									</DropdownMenu>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm font-medium text-slate-900">{org.name}</div>
									{#if org.description}
										<div class="text-xs text-slate-500 truncate max-w-xs">{org.description}</div>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{[org.city, org.country].filter(Boolean).join(', ') || '-'}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{org.email || org.phone || '-'}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Badge variant={org.isActive ? 'success' : 'danger'}>
										{org.isActive ? 'Active' : 'Inactive'}
									</Badge>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{formatDateTime(org.createdAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>

<!-- View Sidebar (Read-only) -->
<Sidebar
	bind:open={viewSidebarOpen}
	onClose={() => (viewSidebarOpen = false)}
	title={selectedOrg?.name || 'Organization Details'}
	width="lg"
>
	{#if selectedOrg}
		<div class="space-y-6">
			<div class="flex items-center gap-2">
				<Badge variant={selectedOrg.isActive ? 'success' : 'danger'}>
					{selectedOrg.isActive ? 'Active' : 'Inactive'}
				</Badge>
			</div>

			{#if selectedOrg.description}
				<div>
					<p class="text-sm font-medium text-slate-500 mb-1">Description</p>
					<p class="text-sm text-slate-900">{selectedOrg.description}</p>
				</div>
			{/if}

			<div class="border-t border-slate-200 pt-4">
				<h3 class="text-sm font-semibold text-slate-900 mb-3">Location</h3>
				<div class="space-y-2">
					{#if selectedOrg.address}
						<div>
							<p class="text-xs text-slate-500">Address</p>
							<p class="text-sm text-slate-900">{selectedOrg.address}</p>
						</div>
					{/if}
					{#if selectedOrg.city || selectedOrg.country}
						<div>
							<p class="text-xs text-slate-500">City, Country</p>
							<p class="text-sm text-slate-900">
								{[selectedOrg.city, selectedOrg.country].filter(Boolean).join(', ')}
							</p>
						</div>
					{/if}
					{#if selectedOrg.timeZone}
						<div>
							<p class="text-xs text-slate-500">Time Zone</p>
							<p class="text-sm text-slate-900">{selectedOrg.timeZone}</p>
						</div>
					{/if}
				</div>
			</div>

			<div class="border-t border-slate-200 pt-4">
				<h3 class="text-sm font-semibold text-slate-900 mb-3">Contact Information</h3>
				<div class="space-y-2">
					{#if selectedOrg.email}
						<div>
							<p class="text-xs text-slate-500">Email</p>
							<p class="text-sm text-slate-900">{selectedOrg.email}</p>
						</div>
					{/if}
					{#if selectedOrg.phone}
						<div>
							<p class="text-xs text-slate-500">Phone</p>
							<p class="text-sm text-slate-900">{selectedOrg.phone}</p>
						</div>
					{/if}
					{#if selectedOrg.website}
						<div>
							<p class="text-xs text-slate-500">Website</p>
							<a
								href={selectedOrg.website}
								target="_blank"
								class="text-sm text-blue-800 hover:underline"
							>
								{selectedOrg.website}
							</a>
						</div>
					{/if}
				</div>
			</div>

			<div class="border-t border-slate-200 pt-4">
				<h3 class="text-sm font-semibold text-slate-900 mb-3">Metadata</h3>
				<div class="space-y-2">
					<div>
						<p class="text-xs text-slate-500">Created</p>
						<p class="text-sm text-slate-900">{formatDateTime(selectedOrg.createdAt)}</p>
					</div>
				</div>
			</div>

			<div class="border-t border-slate-200 pt-4">
				<Button variant="secondary" class="w-full" onclick={() => openAdminDialog(selectedOrg.id)}>
					Add Admin
				</Button>
			</div>
		</div>
	{/if}
</Sidebar>

<!-- Edit Sidebar (With Form) -->
<Sidebar
	bind:open={editSidebarOpen}
	onClose={() => (editSidebarOpen = false)}
	title="Edit Organization"
	width="lg"
>
	{#if editForm}
		<form onsubmit={handleUpdateOrganization} class="space-y-4">
			{#if editError}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3">
					<p class="text-red-800 text-sm font-medium">{editError}</p>
				</div>
			{/if}

			<div>
				<Label for="edit-name">Organization Name *</Label>
				<Input
					id="edit-name"
					bind:value={editForm.name}
					placeholder="Organization name"
					required
					disabled={editSubmitting}
					class="mt-1"
				/>
			</div>

			<div>
				<Label for="edit-description">Description</Label>
				<Input
					id="edit-description"
					bind:value={editForm.description}
					placeholder="Description"
					disabled={editSubmitting}
					class="mt-1"
				/>
			</div>

			<div>
				<Label for="edit-address">Address</Label>
				<Input
					id="edit-address"
					bind:value={editForm.address}
					placeholder="Address"
					disabled={editSubmitting}
					class="mt-1"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="edit-city">City</Label>
					<Input
						id="edit-city"
						bind:value={editForm.city}
						placeholder="City"
						disabled={editSubmitting}
						class="mt-1"
					/>
				</div>
				<div>
					<Label for="edit-country">Country</Label>
					<Input
						id="edit-country"
						bind:value={editForm.country}
						placeholder="Country"
						disabled={editSubmitting}
						class="mt-1"
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="edit-email">Email</Label>
					<Input
						id="edit-email"
						type="email"
						bind:value={editForm.email}
						placeholder="Email"
						disabled={editSubmitting}
						class="mt-1"
					/>
				</div>
				<div>
					<Label for="edit-phone">Phone</Label>
					<Input
						id="edit-phone"
						type="tel"
						bind:value={editForm.phone}
						placeholder="Phone"
						disabled={editSubmitting}
						class="mt-1"
					/>
				</div>
			</div>

			<div>
				<Label for="edit-website">Website</Label>
				<Input
					id="edit-website"
					type="url"
					bind:value={editForm.website}
					placeholder="Website"
					disabled={editSubmitting}
					class="mt-1"
				/>
			</div>

			<div>
				<Label for="edit-timeZone">Time Zone</Label>
				<Input
					id="edit-timeZone"
					bind:value={editForm.timeZone}
					placeholder="Time zone"
					disabled={editSubmitting}
					class="mt-1"
				/>
			</div>

			<div
				class="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-200 -mx-6 px-6 py-4"
			>
				<Button type="submit" class="flex-1" loading={editSubmitting}> Save Changes </Button>
				<Button
					type="button"
					variant="outline"
					class="flex-1"
					onclick={() => (editSidebarOpen = false)}
					disabled={editSubmitting}
				>
					Cancel
				</Button>
			</div>
		</form>
	{/if}
</Sidebar>

<!-- Delete Confirmation Dialog -->
<Dialog
	bind:open={deleteDialogOpen}
	onClose={() => (deleteDialogOpen = false)}
	title="Delete Organization"
	description="This action cannot be undone"
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Are you sure you want to delete <strong>{orgToDelete?.name}</strong>?
		</p>
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
			<p class="text-yellow-800 text-sm font-medium">Warning</p>
			<p class="text-yellow-700 text-sm mt-1">
				This will remove all associated users, projects, and data.
			</p>
		</div>
		<div class="flex gap-3 pt-4">
			<Button
				variant="destructive"
				class="flex-1"
				loading={deleteSubmitting}
				onclick={handleDeleteOrganization}
			>
				Delete Organization
			</Button>
			<Button
				variant="outline"
				class="flex-1"
				onclick={() => (deleteDialogOpen = false)}
				disabled={deleteSubmitting}
			>
				Cancel
			</Button>
		</div>
	</div>
</Dialog>

<!-- Create Organization Sidebar -->
<Sidebar
	bind:open={createSidebarOpen}
	onClose={() => (createSidebarOpen = false)}
	title="Create Organization"
	width="lg"
>
	<form onsubmit={handleCreateOrganization} class="space-y-4">
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-3">
				<p class="text-red-800 text-sm font-medium">{error}</p>
			</div>
		{/if}

		<div>
			<Label for="name">Organization Name *</Label>
			<Input
				id="name"
				bind:value={orgForm.name}
				placeholder="East Africa Wildlife Foundation"
				required
				disabled={submitting}
				class="mt-1"
			/>
		</div>

		<div>
			<Label for="description">Description</Label>
			<Input
				id="description"
				bind:value={orgForm.description}
				placeholder="Wildlife conservation and research organization"
				disabled={submitting}
				class="mt-1"
			/>
		</div>

		<div>
			<Label for="address">Address</Label>
			<Input
				id="address"
				bind:value={orgForm.address}
				placeholder="123 Conservation Drive"
				disabled={submitting}
				class="mt-1"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label for="city">City</Label>
				<Input
					id="city"
					bind:value={orgForm.city}
					placeholder="Nairobi"
					disabled={submitting}
					class="mt-1"
				/>
			</div>
			<div>
				<Label for="country">Country</Label>
				<Input
					id="country"
					bind:value={orgForm.country}
					placeholder="Kenya"
					disabled={submitting}
					class="mt-1"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label for="email">Email</Label>
				<Input
					id="email"
					type="email"
					bind:value={orgForm.email}
					placeholder="info@eawf.org"
					disabled={submitting}
					class="mt-1"
				/>
			</div>
			<div>
				<Label for="phone">Phone</Label>
				<Input
					id="phone"
					type="tel"
					bind:value={orgForm.phone}
					placeholder="+254-20-1234567"
					disabled={submitting}
					class="mt-1"
				/>
			</div>
		</div>

		<div>
			<Label for="website">Website</Label>
			<Input
				id="website"
				type="url"
				bind:value={orgForm.website}
				placeholder="https://eawf.org"
				disabled={submitting}
				class="mt-1"
			/>
		</div>

		<div>
			<Label for="timeZone">Time Zone</Label>
			<Input
				id="timeZone"
				bind:value={orgForm.timeZone}
				placeholder="Africa/Nairobi"
				disabled={submitting}
				class="mt-1"
			/>
		</div>

		<div
			class="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-200 -mx-6 px-6 py-4"
		>
			<Button type="submit" class="flex-1" loading={submitting}> Add </Button>
			<Button
				type="button"
				variant="outline"
				class="flex-1"
				onclick={() => (createSidebarOpen = false)}
				disabled={submitting}
			>
				Cancel
			</Button>
		</div>
	</form>
</Sidebar>

<!-- Add Admin Dialog -->
<Dialog
	bind:open={showAdminDialog}
	onClose={() => (showAdminDialog = false)}
	title="Add Admin"
	description="Invite an administrator for this organization"
>
	<div class="space-y-4">
		{#if !adminToken}
			<form onsubmit={handleCreateAdmin} class="space-y-4">
				<div>
					<Label for="adminEmail">Admin Email Address</Label>
					<Input
						id="adminEmail"
						type="email"
						bind:value={adminEmail}
						placeholder="admin@example.com"
						required
						class="mt-1"
					/>
				</div>

				<div class="flex gap-3 pt-4">
					<Button
						type="button"
						variant="outline"
						class="flex-1"
						onclick={() => (showAdminDialog = false)}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button type="submit" class="flex-1" loading={submitting}> Send Invitation </Button>
				</div>
			</form>
		{:else}
			<div class="space-y-4">
				<div class="bg-green-50 border border-green-200 rounded-lg p-4">
					<p class="text-green-800 font-medium">Invitation sent successfully!</p>
				</div>

				<div>
					<Label>Invitation Token</Label>
					<div class="mt-1 flex gap-2">
						<Input value={adminToken} disabled class="font-mono text-sm" />
						<Button variant="outline" onclick={() => copyToClipboard(adminToken!)}>Copy</Button>
					</div>
					<p class="text-xs text-slate-600 mt-2">
						Share this token with the admin. They'll use it to complete their registration.
					</p>
				</div>

				<Button class="w-full" onclick={() => (showAdminDialog = false)}>Done</Button>
			</div>
		{/if}
	</div>
</Dialog>

{#if toastMessage}
	<Toast message={toastMessage} type={toastType} onClose={() => (toastMessage = null)} />
{/if}
