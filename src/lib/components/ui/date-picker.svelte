<script lang="ts">
	import { icons } from '$lib/components/icons.svelte';
	import Button from './button.svelte';

	let { value = $bindable(''), placeholder = 'Select date' }: { value?: string; placeholder?: string } = $props();

	let isOpen = $state(false);
	let pickerRef = $state<HTMLDivElement | null>(null);

	// Current view state
	let viewDate = $state(value ? new Date(value) : new Date());
	let viewMode = $state<'days' | 'months' | 'years'>('days');

	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	const selectedDate = $derived(value ? new Date(value) : null);

	function getDaysInMonth(year: number, month: number) {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfMonth(year: number, month: number) {
		return new Date(year, month, 1).getDay();
	}

	const calendarDays = $derived.by(() => {
		const year = viewDate.getFullYear();
		const month = viewDate.getMonth();
		const daysInMonth = getDaysInMonth(year, month);
		const firstDay = getFirstDayOfMonth(year, month);

		const days: (number | null)[] = [];

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		// Add the days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(day);
		}

		return days;
	});

	const years = $derived.by(() => {
		const currentYear = new Date().getFullYear();
		const startYear = currentYear - 10;
		return Array.from({ length: 21 }, (_, i) => startYear + i);
	});

	function selectDate(day: number) {
		const year = viewDate.getFullYear();
		const month = viewDate.getMonth();
		const date = new Date(year, month, day);
		value = date.toISOString().split('T')[0];
		isOpen = false;
	}

	function selectMonth(monthIndex: number) {
		viewDate = new Date(viewDate.getFullYear(), monthIndex, 1);
		viewMode = 'days';
	}

	function selectYear(year: number) {
		viewDate = new Date(year, viewDate.getMonth(), 1);
		viewMode = 'months';
	}

	function previousMonth() {
		viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
	}

	function nextMonth() {
		viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
	}

	function previousYear() {
		viewDate = new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1);
	}

	function nextYear() {
		viewDate = new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1);
	}

	function handleClickOutside(event: MouseEvent) {
		if (pickerRef && !pickerRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	// Prevent clicks inside the dropdown from closing it
	function handleDropdownClick(e: MouseEvent) {
		e.stopPropagation();
	}

	function clearDate() {
		value = '';
		isOpen = false;
	}

	function isToday(day: number): boolean {
		const today = new Date();
		return (
			day === today.getDate() &&
			viewDate.getMonth() === today.getMonth() &&
			viewDate.getFullYear() === today.getFullYear()
		);
	}

	function isSelected(day: number): boolean {
		if (!selectedDate) return false;
		return (
			day === selectedDate.getDate() &&
			viewDate.getMonth() === selectedDate.getMonth() &&
			viewDate.getFullYear() === selectedDate.getFullYear()
		);
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="relative" bind:this={pickerRef}>
	<div class="relative">
		<input
			type="text"
			readonly
			value={value || ''}
			placeholder={placeholder}
			onclick={() => (isOpen = !isOpen)}
			class="w-full px-3 py-2 pr-20 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
		/>
		<div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
			{#if value}
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						clearDate();
					}}
					class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
				>
					{@html icons.X(14)}
				</button>
			{/if}
			<button
				type="button"
				onclick={() => (isOpen = !isOpen)}
				class="p-1 hover:bg-slate-100 rounded text-slate-600"
			>
				{@html icons.Calendar(16)}
			</button>
		</div>
	</div>

	{#if isOpen}
		<div
			role="dialog"
			tabindex="0"
			onclick={handleDropdownClick}
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					isOpen = false;
				}
			}}
			class="absolute z-50 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-70"
		>
			<!-- Header -->
			<div class="flex items-center justify-between mb-3">
				<button
					type="button"
					onclick={viewMode === 'days' ? previousMonth : viewMode === 'months' ? previousYear : () => {}}
					class="p-1 hover:bg-slate-100 rounded"
				>
					{@html icons.ChevronLeft(16)}
				</button>

				<div class="flex gap-2">
					{#if viewMode === 'days'}
						<button
							type="button"
							onclick={() => (viewMode = 'months')}
							class="px-2 py-1 hover:bg-slate-100 rounded text-sm font-medium"
						>
							{monthNames[viewDate.getMonth()]}
						</button>
						<button
							type="button"
							onclick={() => (viewMode = 'years')}
							class="px-2 py-1 hover:bg-slate-100 rounded text-sm font-medium"
						>
							{viewDate.getFullYear()}
						</button>
					{:else if viewMode === 'months'}
						<button
							type="button"
							onclick={() => (viewMode = 'years')}
							class="px-2 py-1 hover:bg-slate-100 rounded text-sm font-medium"
						>
							{viewDate.getFullYear()}
						</button>
					{:else}
						<span class="px-2 py-1 text-sm font-medium">Select Year</span>
					{/if}
				</div>

				<button
					type="button"
					onclick={viewMode === 'days' ? nextMonth : viewMode === 'months' ? nextYear : () => {}}
					class="p-1 hover:bg-slate-100 rounded"
				>
					{@html icons.ChevronRight(16)}
				</button>
			</div>

			<!-- Days View -->
			{#if viewMode === 'days'}
				<div class="grid grid-cols-7 gap-1 mb-2">
					{#each dayNames as day}
						<div class="text-center text-xs font-medium text-slate-500 py-1">
							{day}
						</div>
					{/each}
				</div>
				<div class="grid grid-cols-7 gap-1">
					{#each calendarDays as day}
						{#if day === null}
							<div class="aspect-square"></div>
						{:else}
							<button
								type="button"
								onclick={() => selectDate(day)}
								class={`aspect-square flex items-center justify-center text-sm rounded hover:bg-slate-100 ${
									isSelected(day)
										? 'bg-blue-500 text-white hover:bg-blue-600'
										: isToday(day)
											? 'bg-blue-50 text-blue-600 font-semibold'
											: 'text-slate-700'
								}`}
							>
								{day}
							</button>
						{/if}
					{/each}
				</div>
			{/if}

			<!-- Months View -->
			{#if viewMode === 'months'}
				<div class="grid grid-cols-3 gap-2">
					{#each monthNames as month, index}
						<button
							type="button"
							onclick={() => selectMonth(index)}
							class={`py-2 px-3 text-sm rounded hover:bg-slate-100 ${
								viewDate.getMonth() === index ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
							}`}
						>
							{month}
						</button>
					{/each}
				</div>
			{/if}

			<!-- Years View -->
			{#if viewMode === 'years'}
				<div class="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
					{#each years as year}
						<button
							type="button"
							onclick={() => selectYear(year)}
							class={`py-2 px-3 text-sm rounded hover:bg-slate-100 ${
								viewDate.getFullYear() === year ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
							}`}
						>
							{year}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
