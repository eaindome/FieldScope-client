<script lang="ts">
	import { icons } from '$lib/components/icons.svelte';
	import Input from './input.svelte';
	import Button from './button.svelte';
	import DatePicker from './date-picker.svelte';

	interface FilterOption {
		label: string;
		value: string;
	}

	interface TableFiltersProps {
		searchPlaceholder?: string;
		searchValue?: string;
		statusOptions?: FilterOption[];
		statusLabel?: string;
		selectedStatus?: string;
		secondaryStatusOptions?: FilterOption[];
		secondaryStatusLabel?: string;
		secondaryStatus?: string;
		dateRangeEnabled?: boolean;
		startDate?: string;
		endDate?: string;
		onReset?: () => void;
		// Pagination props
		totalItems?: number;
		currentPage?: number;
		itemsPerPage?: number;
		onPageChange?: (page: number) => void;
		onItemsPerPageChange?: (count: number) => void;
		// Collapsible prop
		collapsible?: boolean;
		defaultCollapsed?: boolean;
	}

	let {
		searchPlaceholder = 'Search...',
		searchValue = $bindable(''),
		statusOptions = [],
		statusLabel,
		selectedStatus = $bindable('All'),
		secondaryStatusOptions = [],
		secondaryStatusLabel,
		secondaryStatus = $bindable('All'),
		dateRangeEnabled = false,
		startDate = $bindable(''),
		endDate = $bindable(''),
		onReset,
		totalItems = 0,
		currentPage = $bindable(1),
		itemsPerPage = $bindable(10),
		onPageChange,
		onItemsPerPageChange,
		collapsible = false,
		defaultCollapsed = false
	}: TableFiltersProps = $props();

	let isExpanded = $derived(!defaultCollapsed);

	function handleReset() {
		searchValue = '';
		selectedStatus = 'All';
		secondaryStatus = 'All';
		startDate = '';
		endDate = '';
		currentPage = 1;
		onReset?.();
	}

	const hasActiveFilters = $derived(
		searchValue !== '' || selectedStatus !== 'All' || secondaryStatus !== 'All' || startDate !== '' || endDate !== ''
	);

	const totalPages = $derived(Math.ceil(totalItems / itemsPerPage));
	const startItem = $derived((currentPage - 1) * itemsPerPage + 1);
	const endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			onPageChange?.(page);
		}
	}

	function handleItemsPerPageChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const newValue = parseInt(input.value, 10);
		if (newValue > 0) {
			itemsPerPage = newValue;
			currentPage = 1; // Reset to first page
			onItemsPerPageChange?.(newValue);
		}
	}

	const pageNumbers = $derived.by(() => {
		const pages: (number | string)[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible + 2) {
			// Show all pages if there are few
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			if (currentPage > 3) {
				pages.push('...');
			}

			// Show pages around current page
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (currentPage < totalPages - 2) {
				pages.push('...');
			}

			// Always show last page
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}

		return pages;
	});
</script>

<div class="space-y-4">
	<div class="bg-white border border-slate-200 rounded-lg">
		<!-- Collapsible Header (only if collapsible prop is true) -->
		{#if collapsible}
			<button
				type="button"
				onclick={() => (isExpanded = !isExpanded)}
				class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
			>
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium text-slate-700">
						{isExpanded ? 'Hide' : 'Show'} Filters & Pagination
					</span>
					{#if !isExpanded && hasActiveFilters}
						<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
							Active
						</span>
					{/if}
				</div>
				<span class="text-slate-500 transition-transform {isExpanded ? 'rotate-180' : ''}">
					{@html icons.ChevronDown(16)}
				</span>
			</button>
		{/if}

		<!-- Filters Content -->
		{#if !collapsible || isExpanded}
			<div class="p-4 space-y-4 {collapsible ? 'border-t border-slate-200' : ''}">
				<!-- Search and Reset Row -->
				<div class="flex gap-3">
					<div class="flex-1 relative">
						<div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
							{@html icons.Search(16)}
						</div>
						<Input bind:value={searchValue} placeholder={searchPlaceholder} class="pl-9" />
					</div>
					{#if hasActiveFilters}
						<Button variant="outline" size="sm" onclick={handleReset}>
							<span class="mr-1.5">{@html icons.X(14)}</span>
							Reset
						</Button>
					{/if}
				</div>

				<!-- Status and Date Range Filters -->
				<div class="flex flex-wrap gap-3 items-center">
					<!-- Primary Status Filter -->
					{#if statusOptions.length > 0}
						<div class="flex items-center gap-2">
							{#if statusLabel}
								<span class="text-xs font-medium text-slate-500">{statusLabel}:</span>
							{/if}
							<div class="flex gap-2">
								{#each statusOptions as option}
									<Button
										variant={selectedStatus === option.value ? 'default' : 'outline'}
										size="sm"
										onclick={() => (selectedStatus = option.value)}
									>
										{option.label}
									</Button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Secondary Status Filter -->
					{#if secondaryStatusOptions.length > 0}
						<div class="flex items-center gap-2">
							{#if secondaryStatusLabel}
								<span class="text-xs font-medium text-slate-500">{secondaryStatusLabel}:</span>
							{/if}
							<div class="flex gap-2">
								{#each secondaryStatusOptions as option}
									<Button
										variant={secondaryStatus === option.value ? 'default' : 'outline'}
										size="sm"
										onclick={() => (secondaryStatus = option.value)}
									>
										{option.label}
									</Button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Date Range Filter -->
					{#if dateRangeEnabled}
						<div class="flex gap-2 items-center ml-auto">
							<span class="text-sm text-slate-600">From:</span>
							<DatePicker bind:value={startDate} placeholder="Start date" />
							<span class="text-slate-400">—</span>
							<DatePicker bind:value={endDate} placeholder="End date" />
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Pagination -->
	{#if totalItems > 0 && (!collapsible || isExpanded)}
		<div
			class="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg gap-4"
		>
			<div class="text-sm text-slate-600">
				Showing <span class="font-medium">{startItem}</span> to
				<span class="font-medium">{endItem}</span>
				of <span class="font-medium">{totalItems}</span> results
			</div>

			<div class="flex items-center gap-3 ml-auto">
				<div class="flex items-center gap-1.5">
					<input
						type="number"
						min="1"
						max="100"
						value={itemsPerPage.toString()}
						onchange={handleItemsPerPageChange}
						class="w-16 text-center border border-slate-200 rounded px-2 py-1"
						title="Items per page"
					/>
					<span class="text-xs text-slate-500">per page</span>
				</div>

				<div class="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => goToPage(currentPage - 1)}
						disabled={currentPage === 1}
					>
						<span class="mr-1">{@html icons.ChevronLeft(14)}</span>
						Previous
					</Button>

					<div class="flex gap-1">
						{#each pageNumbers as page}
							{#if page === '...'}
								<span class="px-3 py-1 text-slate-400">...</span>
							{:else}
								<Button
									variant={currentPage === page ? 'default' : 'outline'}
									size="sm"
									onclick={() => goToPage(page as number)}
								>
									{page}
								</Button>
							{/if}
						{/each}
					</div>

					<Button
						variant="outline"
						size="sm"
						onclick={() => goToPage(currentPage + 1)}
						disabled={currentPage === totalPages}
					>
						Next
						<span class="ml-1">{@html icons.ChevronRight(14)}</span>
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>
