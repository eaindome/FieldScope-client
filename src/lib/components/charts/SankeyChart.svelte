<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey';

	let {
		data = [],
		title = '',
		height = '400px'
	}: {
		data: Array<{ source: string; target: string; value: number }>;
		title?: string;
		height?: string;
	} = $props();

	let container: HTMLDivElement;
	let svg: SVGSVGElement;

	onMount(() => {
		if (data.length === 0) return;

		renderSankey();

		return () => {
			// Cleanup
			if (svg) {
				d3.select(svg).selectAll('*').remove();
			}
		};
	});

	$effect(() => {
		if (container && data.length > 0) {
			renderSankey();
		}
	});

	function renderSankey() {
		if (!container) return;

		// Clear previous rendering
		d3.select(container).selectAll('*').remove();

		const width = container.clientWidth;
		const heightNum = parseInt(height) || 400;

		// Create nodes and links from data
		const nodes: Array<{ name: string }> = [];
		const links: Array<{ source: number; target: number; value: number }> = [];
		const nodeMap = new Map<string, number>();

		// Build nodes
		data.forEach((d) => {
			if (!nodeMap.has(d.source)) {
				nodeMap.set(d.source, nodes.length);
				nodes.push({ name: d.source });
			}
			if (!nodeMap.has(d.target)) {
				nodeMap.set(d.target, nodes.length);
				nodes.push({ name: d.target });
			}
		});

		// Build links
		data.forEach((d) => {
			links.push({
				source: nodeMap.get(d.source)!,
				target: nodeMap.get(d.target)!,
				value: d.value
			});
		});

		// Create sankey generator
		const sankeyGenerator = sankey()
			.nodeWidth(15)
			.nodePadding(10)
			.extent([
				[1, 1],
				[width - 1, heightNum - 6]
			]);

		// Generate sankey data
		const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
			nodes: nodes.map((d) => Object.assign({}, d)),
			links: links.map((d) => Object.assign({}, d))
		} as any);

		// Create SVG
		const svgElement = d3
			.select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', heightNum)
			.attr('viewBox', [0, 0, width, heightNum] as any);

		// Color scale
		const color = d3.scaleOrdinal(d3.schemeCategory10);

		// Add links
		svgElement
			.append('g')
			.attr('fill', 'none')
			.selectAll('path')
			.data(sankeyLinks)
			.join('path')
			.attr('d', sankeyLinkHorizontal() as any)
			.attr('stroke', (d: any) => color(d.source.name))
			.attr('stroke-width', (d: any) => Math.max(1, d.width))
			.attr('opacity', 0.5)
			.append('title')
			.text((d: any) => `${d.source.name} → ${d.target.name}\n${d.value}`);

		// Add nodes
		svgElement
			.append('g')
			.selectAll('rect')
			.data(sankeyNodes)
			.join('rect')
			.attr('x', (d: any) => d.x0)
			.attr('y', (d: any) => d.y0)
			.attr('height', (d: any) => d.y1 - d.y0)
			.attr('width', (d: any) => d.x1 - d.x0)
			.attr('fill', (d: any) => color(d.name))
			.append('title')
			.text((d: any) => `${d.name}\n${d.value}`);

		// Add labels
		svgElement
			.append('g')
			.style('font', '10px sans-serif')
			.selectAll('text')
			.data(sankeyNodes)
			.join('text')
			.attr('x', (d: any) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
			.attr('y', (d: any) => (d.y1 + d.y0) / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', (d: any) => (d.x0 < width / 2 ? 'start' : 'end'))
			.text((d: any) => d.name)
			.attr('fill', '#334155');
	}
</script>

<div class="flex flex-col" style="height: {height}">
	{#if title}
		<h3 class="text-lg font-semibold text-slate-700 mb-4 text-center">{title}</h3>
	{/if}

	<div class="flex-1 overflow-hidden" bind:this={container}></div>
</div>
