<script lang="ts">
	import { icons } from '$lib/components/icons.svelte';
	import DashboardViewCard from './DashboardViewCard.svelte';
	import type { DashboardItem } from '$lib/types/dashboards';
	import type { View } from '$lib/types/views';
	import type { FormField } from '$lib/types/views';

	let {
		items = $bindable([]),
		views = [],
		submissions = [],
		allFields = [],
		gridColumns = 12,
		gridRowHeight = 120,
		gridGap = 16,
		editMode = false
	}: {
		items: DashboardItem[];
		views: View[];
		submissions: any[];
		allFields: FormField[];
		gridColumns?: number;
		gridRowHeight?: number;
		gridGap?: number;
		editMode?: boolean;
	} = $props();

	let dragOver = $state(false);
	let resizingItem = $state<{ id: string; direction: string } | null>(null);
	let draggingItem = $state<{ id: string; startX: number; startY: number } | null>(null);

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		if (!event.dataTransfer) return;

		try {
			const data = JSON.parse(event.dataTransfer.getData('application/json'));
			const { viewId } = data;

			// Check if view already exists in layout
			if (items.some((item) => item.viewId === viewId)) {
				return;
			}

			// Find next available position (simple stacking logic)
			let y = 0;
			if (items.length > 0) {
				const maxY = Math.max(...items.map((item) => item.y + item.height));
				y = maxY;
			}

			// Add new item
			const newItem: DashboardItem = {
				id: `item-${Date.now()}`,
				viewId,
				x: 0,
				y,
				width: 6, // Default half width
				height: 3 // Default 3 rows
			};

			items = [...items, newItem];
		} catch (e) {
			console.error('Error handling drop:', e);
		}
	}

	function removeItem(itemId: string) {
		items = items.filter((item) => item.id !== itemId);
	}

	function getViewById(viewId: number): View | undefined {
		return views.find((v) => v.id === viewId);
	}

	// Drag to move functionality
	function startDrag(itemId: string, event: MouseEvent) {
		// Only allow dragging from the header area
		const target = event.target as HTMLElement;
		if (!target.closest('.drag-handle')) return;

		// Don't drag if clicking on remove button
		if (target.closest('button')) return;

		event.preventDefault();
		event.stopPropagation();

		const item = items.find((i) => i.id === itemId);
		if (!item) return;

		draggingItem = { id: itemId, startX: item.x, startY: item.y };
		document.body.classList.add('dragging');

		const canvas = document.getElementById('dashboard-canvas');
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const columnWidth = rect.width / gridColumns;
		const startMouseX = event.clientX;
		const startMouseY = event.clientY;

		const handleMouseMove = (e: MouseEvent) => {
			if (!draggingItem) return;

			const item = items.find((i) => i.id === draggingItem.id);
			if (!item) return;

			const deltaX = e.clientX - startMouseX;
			const deltaY = e.clientY - startMouseY;

			const columnDelta = Math.round(deltaX / columnWidth);
			const rowDelta = Math.round(deltaY / gridRowHeight);

			const newX = Math.max(0, Math.min(gridColumns - item.width, draggingItem.startX + columnDelta));
			const newY = Math.max(0, draggingItem.startY + rowDelta);

			item.x = newX;
			item.y = newY;

			items = [...items];
		};

		const handleMouseUp = () => {
			draggingItem = null;
			document.body.classList.remove('dragging');
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	// Resize functionality
	function startResize(itemId: string, direction: string, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		const item = items.find((i) => i.id === itemId);
		if (!item) return;

		resizingItem = { id: itemId, direction };
		document.body.classList.add('resizing');

		const canvas = document.getElementById('dashboard-canvas');
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const columnWidth = rect.width / gridColumns;

		// Store initial state
		const initialX = item.x;
		const initialY = item.y;
		const initialWidth = item.width;
		const initialHeight = item.height;
		const startMouseX = event.clientX;
		const startMouseY = event.clientY;

		const handleMouseMove = (e: MouseEvent) => {
			if (!resizingItem) return;

			const item = items.find((i) => i.id === resizingItem.id);
			if (!item) return;

			const deltaX = e.clientX - startMouseX;
			const deltaY = e.clientY - startMouseY;

			const columnDelta = Math.round(deltaX / columnWidth);
			const rowDelta = Math.round(deltaY / gridRowHeight);

			// Right edge resize
			if (resizingItem.direction.includes('e')) {
				const newWidth = Math.max(1, Math.min(gridColumns - initialX, initialWidth + columnDelta));
				item.width = newWidth;
			}

			// Left edge resize
			if (resizingItem.direction.includes('w')) {
				const newWidth = Math.max(1, initialWidth - columnDelta);
				const newX = Math.max(0, initialX + columnDelta);

				// Only apply if valid
				if (newX + newWidth <= gridColumns) {
					item.width = newWidth;
					item.x = newX;
				}
			}

			// Bottom edge resize
			if (resizingItem.direction.includes('s')) {
				const newHeight = Math.max(1, initialHeight + rowDelta);
				item.height = newHeight;
			}

			// Top edge resize
			if (resizingItem.direction.includes('n')) {
				const newHeight = Math.max(1, initialHeight - rowDelta);
				const newY = Math.max(0, initialY + rowDelta);

				if (newY >= 0) {
					item.height = newHeight;
					item.y = newY;
				}
			}

			// Trigger reactivity
			items = [...items];
		};

		const handleMouseUp = () => {
			resizingItem = null;
			document.body.classList.remove('resizing');
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	// Generate grid template columns
	const gridTemplateColumns = $derived(`repeat(${gridColumns}, 1fr)`);
</script>

<div
	class="min-h-[600px] rounded-lg border-2 transition-colors {dragOver
		? 'border-blue-400 bg-blue-50'
		: 'border-dashed border-slate-300 bg-slate-50'} {items.length === 0 ? 'flex items-center justify-center' : ''}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="region"
	aria-label="Dashboard canvas"
>
	{#if items.length === 0}
		<!-- Empty State -->
		<div class="text-center p-12">
			<div class="flex justify-center mb-4 text-slate-300">
				{@html icons.Grid(64)}
			</div>
			<h4 class="text-lg font-semibold text-slate-700 mb-2">No Views Added Yet</h4>
			<p class="text-slate-500 text-sm max-w-sm mx-auto">
				Drag views from the right panel to add them to your dashboard
			</p>
		</div>
	{:else}
		<!-- Grid Layout -->
		<div
			id="dashboard-canvas"
			class="grid p-4"
			style="grid-template-columns: {gridTemplateColumns}; grid-auto-rows: {gridRowHeight}px; gap: {gridGap}px;"
		>
			{#each items as item (item.id)}
				{@const view = getViewById(item.viewId)}
				{#if view}
					<div
						class="dashboard-item relative {draggingItem?.id === item.id ? 'opacity-70' : ''}"
						style="grid-column: span {item.width}; grid-row: span {item.height};"
						onmousedown={(e) => {
							if (editMode) startDrag(item.id, e);
						}}
					>
						<DashboardViewCard
							{item}
							{view}
							{submissions}
							{allFields}
							{editMode}
							onRemove={() => removeItem(item.id)}
						/>

						<!-- Resize Handles (only in edit mode) -->
						{#if editMode}
							<!-- Right Handle -->
							<div
								class="absolute top-0 right-0 bottom-0 w-4 cursor-ew-resize hover:bg-blue-400/30 transition-all group z-10"
								onmousedown={(e) => startResize(item.id, 'e', e)}
								role="separator"
								aria-label="Resize width"
								title="Drag to resize width"
							>
								<div class="absolute inset-y-0 right-0 w-1 bg-blue-400/0 group-hover:bg-blue-500 transition-colors"></div>
							</div>

							<!-- Bottom Handle -->
							<div
								class="absolute left-0 right-0 bottom-0 h-4 cursor-ns-resize hover:bg-blue-400/30 transition-all group z-10"
								onmousedown={(e) => startResize(item.id, 's', e)}
								role="separator"
								aria-label="Resize height"
								title="Drag to resize height"
							>
								<div class="absolute inset-x-0 bottom-0 h-1 bg-blue-400/0 group-hover:bg-blue-500 transition-colors"></div>
							</div>

							<!-- Bottom-Right Corner Handle -->
							<div
								class="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-blue-500/70 hover:bg-blue-600 transition-colors shadow-md z-20 flex items-end justify-end"
								onmousedown={(e) => startResize(item.id, 'se', e)}
								role="separator"
								aria-label="Resize both dimensions"
								title="Drag to resize"
								style="border-bottom-right-radius: 0.5rem;"
							>
								<svg
									class="w-3.5 h-3.5 text-white mb-0.5 mr-0.5"
									viewBox="0 0 12 12"
									fill="none"
									stroke="currentColor"
								>
									<path d="M11 11L11 7M11 11L7 11M11 11L5 5" stroke-width="1.5" stroke-linecap="round" />
								</svg>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.dashboard-item {
		min-height: 0;
		min-width: 0;
		user-select: none;
	}

	:global(body.resizing),
	:global(body.dragging) {
		user-select: none;
		cursor: inherit !important;
	}
</style>
