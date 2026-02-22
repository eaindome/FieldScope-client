<script lang="ts">
	import Label from '$lib/components/ui/label.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { icons } from '$lib/components/icons.svelte';

	let { colors = $bindable([]) }: { colors: string[] } = $props();

	const defaultColors = [
		'#3b82f6',
		'#10b981',
		'#f59e0b',
		'#ef4444',
		'#8b5cf6',
		'#ec4899',
		'#14b8a6',
		'#f97316'
	];

	function addColor() {
		colors = [...colors, defaultColors[colors.length % defaultColors.length]];
	}

	function removeColor(index: number) {
		colors = colors.filter((_, i) => i !== index);
	}

	function resetColors() {
		colors = [];
	}

	function updateColor(index: number, newColor: string) {
		const updated = [...colors];
		updated[index] = newColor;
		colors = updated;
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<Label>Colors</Label>
		<div class="flex gap-2">
			<Button variant="outline" size="sm" onclick={resetColors}>
				<span>{@html icons.RotateCcw(14)}</span>
				<span class="ml-1">Reset</span>
			</Button>
			<Button variant="outline" size="sm" onclick={addColor}>
				<span>{@html icons.Plus(14)}</span>
				<span class="ml-1">Add Color</span>
			</Button>
		</div>
	</div>

	{#if colors.length === 0}
		<div class="text-sm text-slate-500 p-4 border-2 border-dashed border-slate-200 rounded-lg text-center">
			Using default colors. Add custom colors or reset to defaults.
		</div>
	{:else}
		<div class="space-y-2">
			{#each colors as color, index}
				<div class="flex items-center gap-2">
					<input
						type="color"
						value={color}
						onchange={(e) => updateColor(index, e.currentTarget.value)}
						class="h-10 w-16 rounded border border-slate-300 cursor-pointer"
					/>
					<div
						class="flex-1 h-10 rounded border border-slate-300 flex items-center px-3 text-sm font-mono text-slate-600"
						style="background-color: {color};"
					>
						{color}
					</div>
					<Button
						variant="outline"
						size="sm"
						onclick={() => removeColor(index)}
						class="text-red-600 hover:bg-red-50"
					>
						{@html icons.Trash(14)}
					</Button>
				</div>
			{/each}
		</div>
	{/if}

	<p class="text-xs text-slate-500">
		Customize the colors used in your chart. If no colors are specified, default colors will be used.
	</p>
</div>
