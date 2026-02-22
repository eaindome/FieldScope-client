<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Sidebar from '$lib/components/ui/sidebar.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import TableFilters from '$lib/components/ui/table-filters.svelte';
	import { formatDateTime } from '$lib/utils';
	import { icons } from '$lib/components/icons.svelte';
	import Toast from '$lib/components/ui/toast.svelte';

	// All invitations loaded from API
	let allInvitations = $state<any[]>([]);
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

	// View Sidebar
	let viewSidebarOpen = $state(false);
	let selectedInvitation = $state<any | null>(null);

	// Add Admin Sidebar
	let addAdminSidebarOpen = $state(false);
	let adminForm = $state({
		organizationId: null as number | null,
		email: ''
	});
	let organizations = $state<any[]>([]);
	let addAdminSubmitting = $state(false);
	let addAdminError = $state<string | null>(null);
	let adminToken = $state<string | null>(null);

	// Resend Dialog
	let resendDialogOpen = $state(false);
	let invitationToResend = $state<any | null>(null);
	let resendSubmitting = $state(false);
	let resendToken = $state<string | null>(null);

	// Delete Dialog
	let deleteDialogOpen = $state(false);
	let invitationToDelete = $state<any | null>(null);
	let deleteSubmitting = $state(false);

	onMount(async () => {
		await loadInvitations();
		await loadOrganizations();
	});

	async function loadInvitations() {
		loading = true;
		const { data, error: err } = await api.getInvitationsBySuperAdmin();
		if (err) {
			error = err;
		} else {
			allInvitations = data || [];
		}
		loading = false;
	}

	async function loadOrganizations() {
		const response = await api.getOrganizations();
		if ('error' in response && response.error) {
			// silently fail for organizations load
		} else if ('data' in response) {
			organizations = response.data || [];
		}
	}

	// Client-side filtering
	const filteredInvitations = $derived.by(() => {
		let filtered = allInvitations;

		// Filter by search
		if (searchValue) {
			filtered = filtered.filter((inv) =>
				inv.email.toLowerCase().includes(searchValue.toLowerCase())
			);
		}

		// Filter by status
		if (selectedStatus !== 'All') {
			filtered = filtered.filter((inv) => inv.status === selectedStatus);
		}

		// Filter by date range
		if (startDate) {
			const start = new Date(startDate);
			filtered = filtered.filter((inv) => new Date(inv.createdAt) >= start);
		}
		if (endDate) {
			const end = new Date(endDate);
			filtered = filtered.filter((inv) => new Date(inv.createdAt) <= end);
		}

		return filtered;
	});

	// Paginated data
	const paginatedInvitations = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredInvitations.slice(startIndex, endIndex);
	});

	// Reset to page 1 when filters change
	$effect(() => {
		searchValue;
		selectedStatus;
		startDate;
		endDate;
		currentPage = 1;
	});

	function getStatusVariant(
		status: string
	): 'default' | 'success' | 'warning' | 'danger' | 'info' {
		switch (status) {
			case 'Pending':
				return 'warning';
			case 'Accepted':
				return 'success';
			case 'Expired':
				return 'danger';
			default:
				return 'default';
		}
	}

	// Stats always based on allInvitations (never changes with filter)
	const stats = $derived({
		total: allInvitations.length,
		pending: allInvitations.filter((i) => i.status === 'Pending').length,
		accepted: allInvitations.filter((i) => i.status === 'Accepted').length,
		expired: allInvitations.filter((i) => i.status === 'Expired').length
	});

	function openViewSidebar(invitation: any) {
		selectedInvitation = invitation;
		viewSidebarOpen = true;
	}

	function openAddAdminSidebar() {
		adminForm = {
			organizationId: null,
			email: ''
		};
		addAdminError = null;
		adminToken = null;
		addAdminSidebarOpen = true;
	}

	async function handleAddAdmin(e: Event) {
		e.preventDefault();
		if (!adminForm.organizationId || !adminForm.email) return;

		addAdminSubmitting = true;
		addAdminError = null;

		const { data, error: err } = await api.createAdminForOrganization(
			adminForm.organizationId,
			adminForm.email
		);
		if (err) {
			addAdminError = err;
		} else if (data) {
			adminToken = data.token;
			toastType = 'success';
			toastMessage = `Admin invitation sent to ${adminForm.email}!`;
			await loadInvitations();
			setTimeout(() => (toastMessage = null), 5000);
		}
		addAdminSubmitting = false;
	}

	function openResendDialog(invitation: any) {
		invitationToResend = invitation;
		resendToken = null;
		resendDialogOpen = true;
	}

	async function handleResendInvitation() {
		if (!invitationToResend) return;
		resendSubmitting = true;
		error = null;

		const { data, error: err } = await api.resendInvitation(invitationToResend.id);
		if (err) {
			error = err;
		} else if (data) {
			resendToken = data.token;
			toastType = 'success';
			toastMessage = 'Invitation resent successfully!';
			resendDialogOpen = false;
			await loadInvitations();
			setTimeout(() => (toastMessage = null), 3000);
		}
		resendSubmitting = false;
	}

	function openDeleteDialog(invitation: any) {
		invitationToDelete = invitation;
		deleteDialogOpen = true;
	}

	async function handleDeleteInvitation() {
		if (!invitationToDelete) return;
		deleteSubmitting = true;
		error = null;

		const { error: err } = await api.deleteInvitation(invitationToDelete.id);
		if (err) {
			error = err;
		} else {
			toastType = 'success';
			toastMessage = 'Invitation deleted successfully!';
			deleteDialogOpen = false;
			await loadInvitations();
			setTimeout(() => (toastMessage = null), 3000);
		}
		deleteSubmitting = false;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-slate-900">Invitations</h1>
			<p class="text-slate-600 mt-2">Manage user invitations and track acceptance status</p>
		</div>
		<Button onclick={openAddAdminSidebar} class="gap-2">
			<span>{@html icons.Plus(16)}</span>
			Add Admin
		</Button>
	</div>


	<!-- Stats Cards (Always show all invitations, not filtered) -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		{#if loading}
			{#each [1, 2, 3, 4] as _}
				<Card class="hover:shadow-md transition-shadow">
					<div class="p-6 space-y-3">
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-10 w-20" />
					</div>
				</Card>
			{/each}
		{:else}
			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-slate-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-500 uppercase tracking-wide">
								Total Invitations
							</p>
							<p class="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
						</div>
						<div class="p-3 bg-slate-100 rounded-lg">
							{@html icons.Mail(24)}
						</div>
					</div>
				</div>
			</Card>
			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-yellow-600 uppercase tracking-wide">Pending</p>
							<p class="text-3xl font-bold text-yellow-700 mt-2">{stats.pending}</p>
						</div>
						<div class="p-3 bg-yellow-100 rounded-lg text-yellow-600">
							{@html icons.Clock(24)}
						</div>
					</div>
				</div>
			</Card>
			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-green-600 uppercase tracking-wide">Accepted</p>
							<p class="text-3xl font-bold text-green-700 mt-2">{stats.accepted}</p>
						</div>
						<div class="p-3 bg-green-100 rounded-lg text-green-600">
							{@html icons.Check(24)}
						</div>
					</div>
				</div>
			</Card>
			<Card class="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
				<div class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-red-600 uppercase tracking-wide">Expired</p>
							<p class="text-3xl font-bold text-red-700 mt-2">{stats.expired}</p>
						</div>
						<div class="p-3 bg-red-100 rounded-lg text-red-600">
							{@html icons.X(24)}
						</div>
					</div>
				</div>
			</Card>
		{/if}
	</div>

	<!-- Table Filters -->
	<TableFilters
		searchPlaceholder="Search by email..."
		bind:searchValue
		statusOptions={[
			{ label: 'All', value: 'All' },
			{ label: 'Pending', value: 'Pending' },
			{ label: 'Accepted', value: 'Accepted' },
			{ label: 'Expired', value: 'Expired' }
		]}
		bind:selectedStatus
		dateRangeEnabled={true}
		bind:startDate
		bind:endDate
		totalItems={filteredInvitations.length}
		bind:currentPage
		bind:itemsPerPage
		collapsible={true}
		defaultCollapsed={true}
	/>

	<!-- Error Message -->
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<p class="text-red-800 font-medium">Error loading invitations</p>
			<p class="text-red-600 text-sm mt-1">{error}</p>
		</div>
	{/if}

	<!-- Invitations List -->
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
								>Email</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Role</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Sent Date</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Expires</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each [1, 2, 3, 4, 5, 6] as _}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-8 w-32" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-48" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-6 w-16" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-6 w-20" />
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Skeleton class="h-4 w-32" />
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
	{:else if filteredInvitations.length === 0}
		<Card>
			<div class="p-12 text-center">
				<div class="flex justify-center mb-4 text-slate-300">
					{@html icons.Mail(64)}
				</div>
				<h3 class="text-xl font-semibold text-slate-900 mb-2">No invitations found</h3>
				<p class="text-slate-600">
					{#if searchValue || selectedStatus !== 'All' || startDate || endDate}
						No invitations match your current filters
					{:else}
						No invitations have been sent yet
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
								>Email</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Role</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Status</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Sent Date</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
								>Expires</th
							>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-slate-200">
						{#each paginatedInvitations as invitation}
							<tr class="hover:bg-slate-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<DropdownMenu align="left">
										{#snippet children({ close }: { close: () => void })}
											<DropdownMenuItem
												icon={icons.Eye(16)}
												onclick={() => {
													openViewSidebar(invitation);
													close();
												}}
											>
												View Details
											</DropdownMenuItem>
											{#if invitation.status === 'Pending'}
												<DropdownMenuItem
													icon={icons.RefreshCw(16)}
													onclick={() => {
														openResendDialog(invitation);
														close();
													}}
												>
													Resend Invitation
												</DropdownMenuItem>
											{/if}
											<DropdownMenuItem
												icon={icons.Trash(16)}
												variant="danger"
												onclick={() => {
													openDeleteDialog(invitation);
													close();
												}}
											>
												Delete
											</DropdownMenuItem>
										{/snippet}
									</DropdownMenu>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-slate-900">{invitation.email}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Badge variant="info">{invitation.role}</Badge>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<Badge variant={getStatusVariant(invitation.status)}>
										{invitation.status}
									</Badge>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{formatDateTime(invitation.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
									{formatDateTime(invitation.expiresAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>

<!-- View Sidebar -->
<Sidebar
	bind:open={viewSidebarOpen}
	onClose={() => (viewSidebarOpen = false)}
	title="Invitation Details"
	width="md"
>
	{#if selectedInvitation}
		<div class="space-y-6">
			<div>
				<p class="text-sm font-medium text-slate-500 mb-1">Email</p>
				<p class="text-lg font-semibold text-slate-900">{selectedInvitation.email}</p>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm font-medium text-slate-500 mb-1">Role</p>
					<Badge variant="info">{selectedInvitation.role}</Badge>
				</div>
				<div>
					<p class="text-sm font-medium text-slate-500 mb-1">Status</p>
					<Badge variant={getStatusVariant(selectedInvitation.status)}>
						{selectedInvitation.status}
					</Badge>
				</div>
			</div>

			<div>
				<p class="text-sm font-medium text-slate-500 mb-1">Sent Date</p>
				<p class="text-sm text-slate-900">{formatDateTime(selectedInvitation.createdAt)}</p>
			</div>

			<div>
				<p class="text-sm font-medium text-slate-500 mb-1">Expires</p>
				<p class="text-sm text-slate-900">{formatDateTime(selectedInvitation.expiresAt)}</p>
			</div>
		</div>
	{/if}
</Sidebar>

<!-- Resend Dialog -->
<Dialog
	bind:open={resendDialogOpen}
	onClose={() => (resendDialogOpen = false)}
	title="Resend Invitation"
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Send a new invitation to <strong>{invitationToResend?.email}</strong>?
		</p>
		<div class="flex gap-3 pt-4">
			<Button class="flex-1" loading={resendSubmitting} onclick={handleResendInvitation}>
				Resend
			</Button>
			<Button variant="outline" class="flex-1" onclick={() => (resendDialogOpen = false)}>
				Cancel
			</Button>
		</div>
	</div>
</Dialog>

<!-- Delete Dialog -->
<Dialog
	bind:open={deleteDialogOpen}
	onClose={() => (deleteDialogOpen = false)}
	title="Delete Invitation"
>
	<div class="space-y-4">
		<p class="text-sm text-slate-600">
			Are you sure you want to delete the invitation for <strong
				>{invitationToDelete?.email}</strong
			>?
		</p>
		<div class="flex gap-3 pt-4">
			<Button
				variant="destructive"
				class="flex-1"
				loading={deleteSubmitting}
				onclick={handleDeleteInvitation}
			>
				Delete
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
<!-- Add Admin Sidebar -->
<Sidebar
	bind:open={addAdminSidebarOpen}
	onClose={() => (addAdminSidebarOpen = false)}
	title="Add Organization Admin"
	width="md"
>
	{#if !adminToken}
		<form onsubmit={handleAddAdmin} class="space-y-6">
			{#if addAdminError}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3">
					<p class="text-red-800 text-sm font-medium">{addAdminError}</p>
				</div>
			{/if}

			<div>
				<Label for="org-select">Select Organization *</Label>
				<select
					id="org-select"
					bind:value={adminForm.organizationId}
					required
					disabled={addAdminSubmitting}
					class="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
				>
					<option value={null}>-- Choose an organization --</option>
					{#each organizations as org (org.id)}
						<option value={org.id}>{org.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<Label for="admin-email">Admin Email Address *</Label>
				<Input
					id="admin-email"
					type="email"
					bind:value={adminForm.email}
					placeholder="admin@example.com"
					required
					disabled={addAdminSubmitting}
					class="mt-1"
				/>
			</div>

			<div class="sticky bottom-0 bg-white border-t border-slate-200 -mx-6 px-6 py-4 flex gap-3">
				<Button
					type="button"
					variant="outline"
					class="flex-1"
					onclick={() => (addAdminSidebarOpen = false)}
					disabled={addAdminSubmitting}
				>
					Cancel
				</Button>
				<Button type="submit" class="flex-1" loading={addAdminSubmitting}>
					Send Invitation
				</Button>
			</div>
		</form>
	{:else}
		<div class="space-y-6">
			<div class="bg-green-50 border border-green-200 rounded-lg p-4">
				<p class="text-green-800 font-medium">Admin invitation sent successfully!</p>
			</div>

			<div>
				<Label>Invitation Token</Label>
				<Input value={adminToken} disabled class="font-mono text-sm mt-1" />
				<p class="text-xs text-slate-600 mt-2">
					Share this token with the admin. They'll use it to complete their registration.
				</p>
			</div>

			<div class="sticky bottom-0 bg-white border-t border-slate-200 -mx-6 px-6 py-4">
				<Button class="w-full" onclick={() => (addAdminSidebarOpen = false)}>
					Done
				</Button>
			</div>
		</div>
	{/if}
</Sidebar>

{#if toastMessage}
	<Toast message={toastMessage} type={toastType} onClose={() => (toastMessage = null)} />
{/if}