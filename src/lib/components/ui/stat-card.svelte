<script lang="ts">
	import Card from './card.svelte';
	import { cn, formatNumber } from '$lib/utils';

	interface StatCardProps {
		title: string;
		value: number | string;
		subtitle?: string;
		trend?: { value: number; isPositive: boolean };
		icon?: string;
		class?: string;
	}

	let { title, value, subtitle, trend, icon, class: className }: StatCardProps = $props();

	const formattedValue = typeof value === 'number' ? formatNumber(value) : value;
</script>

<Card class={cn('hover:shadow-md transition-shadow', className)}>
	<div class="p-6">
		<div class="flex items-center justify-between">
			<div class="flex-1">
				<p class="text-sm font-medium text-slate-500">{title}</p>
				<p class="text-3xl font-bold text-slate-900 mt-2">{formattedValue}</p>
				{#if subtitle}
					<p class="text-sm text-slate-600 mt-1">{subtitle}</p>
				{/if}
				{#if trend}
					<div class="flex items-center mt-2">
						<span
							class={cn(
								'text-sm font-medium',
								trend.isPositive ? 'text-green-600' : 'text-red-600'
							)}
						>
							{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
						</span>
						<span class="text-xs text-slate-500 ml-2">vs last month</span>
					</div>
				{/if}
			</div>
			{#if icon}
				<div class="text-4xl opacity-20">{icon}</div>
			{/if}
		</div>
	</div>
</Card>
