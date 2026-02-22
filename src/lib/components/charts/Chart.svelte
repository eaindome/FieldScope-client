<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ChartJS } from './chartjs-config';
	import type { ChartConfiguration } from 'chart.js';

	interface ChartProps {
		config: ChartConfiguration;
		height?: string;
		onclick?: (event: any, elements: any[]) => void;
	}

	let { config, height = '300px', onclick }: ChartProps = $props();

	let canvasRef: HTMLCanvasElement | null = null;
	let chartInstance: ChartJS | null = null;

	// Deep clone config to avoid Svelte 5 reactivity issues with Chart.js
	function cloneConfig(cfg: ChartConfiguration): ChartConfiguration {
		return JSON.parse(JSON.stringify(cfg));
	}

	onMount(() => {
		if (canvasRef) {
			// Create custom click handler with cloned config
			const clonedConfig = cloneConfig(config);
			if (onclick) {
				clonedConfig.options = {
					...clonedConfig.options,
					onClick: (event: any, elements: any[]) => {
						onclick(event, elements);
					}
				};
			}

			chartInstance = new ChartJS(canvasRef, clonedConfig);
		}
	});

	// Update chart when config changes
	$effect(() => {
		if (chartInstance && config) {
			const clonedConfig = cloneConfig(config);
			chartInstance.data = clonedConfig.data;
			if (clonedConfig.options) {
				chartInstance.options = clonedConfig.options;
			}
			chartInstance.update();
		}
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	});
</script>

<div style="height: {height}; position: relative;">
	<canvas bind:this={canvasRef}></canvas>
</div>
