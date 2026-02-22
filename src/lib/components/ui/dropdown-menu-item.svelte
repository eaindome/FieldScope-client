<script lang="ts">
	let {
		onclick,
		icon,
		variant = 'default',
		disabled = false,
		children
	}: {
		onclick: () => void;
		icon?: string;
		variant?: 'default' | 'danger';
		disabled?: boolean;
		children?: any;
	} = $props();

	const variantClasses = {
		default: 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
		danger: 'text-red-600 hover:bg-red-50 hover:text-red-700'
	};
</script>

<button
	type="button"
	onclick={(e) => { e.stopPropagation(); onclick(); }}
	{disabled}
	class={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
>
	{#if icon}
		{@html icon}
	{/if}
	{@render children?.()}
</button>
