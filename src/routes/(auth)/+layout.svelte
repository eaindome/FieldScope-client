<script lang="ts">
	import icon from '$lib/assets/transIcon.png';
	import { icons } from '$lib/components/icons.svelte';
	let { children } = $props();
</script>

<div class="h-screen bg-slate-50 flex overflow-hidden">

	<!-- Left decorative panel (hidden on mobile) -->
	<div class="hidden lg:flex lg:w-105 xl:w-120 flex-col bg-linear-to-br from-blue-700 via-blue-600 to-blue-800 relative overflow-hidden shrink-0">
		<!-- Subtle dot pattern -->
		<div class="absolute inset-0 bg-dot-pattern opacity-10"></div>

		<!-- Animated gradient blobs -->
		<!-- <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500 opacity-30 blur-3xl animate-blob"></div>
		<div class="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-500 opacity-40 blur-3xl animate-blob animation-delay-2000"></div>
		<div class="absolute top-1/2 -right-12 w-72 h-72 rounded-full bg-purple-500 opacity-20 blur-3xl animate-blob animation-delay-4000"></div> -->

		<!-- Panel content -->
		<div class="relative z-10 flex flex-col justify-between h-full p-12 py-8">
			<div>
				<!-- FieldScope Logo -->
				<div class="flex items-center gap-0 mb-0">
					<img src={icon} alt="FieldScope" class="w-14 h-14 rounded-lg shrink-0" />
					<span class="text-white font-bold text-xl tracking-tight mb-1.5">FieldScope</span>
				</div>

				<h2 class="text-white text-3xl font-bold leading-snug mb-0 fade-in-delay-1 mt-8">
					Collect, manage &<br />analyze field data
				</h2>
				<p class="text-blue-50 text-base leading-relaxed fade-in-delay-2">
					A powerful platform for coordinating field teams, building custom forms, and visualizing data in real time.
				</p>

				<!-- Abstract data visualization hero graphic -->
				<div class="my- relative fade-in-delay-3" style="height: 220px;">
					<svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
						<defs>
							<!-- Enhanced gradient definitions -->
							<linearGradient id="cardGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color:rgba(255,255,255,0.3);stop-opacity:1" />
								<stop offset="100%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
							</linearGradient>
							<linearGradient id="cardGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color:rgba(165,180,252,0.35);stop-opacity:1" />
								<stop offset="100%" style="stop-color:rgba(129,140,248,0.15);stop-opacity:1" />
							</linearGradient>
							<linearGradient id="glowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:rgba(255,255,255,1);stop-opacity:1" />
								<stop offset="100%" style="stop-color:rgba(255,255,255,0.4);stop-opacity:1" />
							</linearGradient>
							<filter id="glow">
								<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
								<feMerge>
									<feMergeNode in="coloredBlur"/>
									<feMergeNode in="SourceGraphic"/>
								</feMerge>
							</filter>
						</defs>

						<!-- Animated connection lines (data flow) -->
						<g opacity="0.3" class="animate-pulse-slow">
							<path d="M40 60 Q80 40 120 60" stroke="white" stroke-width="1.5" stroke-dasharray="4 4" stroke-linecap="round"/>
							<path d="M160 45 Q180 60 200 75" stroke="white" stroke-width="1.5" stroke-dasharray="4 4" stroke-linecap="round"/>
							<path d="M120 135 Q150 145 180 130" stroke="white" stroke-width="1.5" stroke-dasharray="4 4" stroke-linecap="round"/>
							<path d="M50 110 Q70 125 90 110" stroke="white" stroke-width="1.5" stroke-dasharray="3 3" stroke-linecap="round"/>
						</g>

						<!-- Glowing data nodes -->
						<g filter="url(#glow)">
							<circle cx="40" cy="60" r="5" fill="white" opacity="0.8">
								<animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
							</circle>
							<circle cx="120" cy="60" r="5" fill="white" opacity="0.8">
								<animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite"/>
							</circle>
							<circle cx="160" cy="45" r="4" fill="white" opacity="0.7">
								<animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite"/>
							</circle>
						</g>

						<!-- Floating card 1 - Field Map/Location -->
						<g>
							<rect x="15" y="85" width="85" height="95" rx="12" fill="url(#cardGradient1)" stroke="white" stroke-width="2" opacity="0.95" />
							<!-- Map grid lines -->
							<line x1="25" y1="100" x2="90" y2="100" stroke="white" stroke-width="0.5" opacity="0.3"/>
							<line x1="25" y1="115" x2="90" y2="115" stroke="white" stroke-width="0.5" opacity="0.3"/>
							<line x1="25" y1="130" x2="90" y2="130" stroke="white" stroke-width="0.5" opacity="0.3"/>
							<line x1="40" y1="95" x2="40" y2="165" stroke="white" stroke-width="0.5" opacity="0.3"/>
							<line x1="60" y1="95" x2="60" y2="165" stroke="white" stroke-width="0.5" opacity="0.3"/>
							<line x1="80" y1="95" x2="80" y2="165" stroke="white" stroke-width="0.5" opacity="0.3"/>
							<!-- Location pins -->
							<g transform="translate(35, 105)">
								<path d="M8 0 C4 0 0 4 0 8 C0 12 8 20 8 20 C8 20 16 12 16 8 C16 4 12 0 8 0 Z" fill="white" opacity="0.8"/>
								<circle cx="8" cy="8" r="3" fill="rgba(59,130,246,0.8)"/>
							</g>
							<g transform="translate(65, 120)">
								<path d="M6 0 C3 0 0 3 0 6 C0 9 6 15 6 15 C6 15 12 9 12 6 C12 3 9 0 6 0 Z" fill="white" opacity="0.7"/>
								<circle cx="6" cy="6" r="2" fill="rgba(59,130,246,0.7)"/>
							</g>
							<!-- Data label -->
							<rect x="25" y="155" width="35" height="12" rx="3" fill="white" opacity="0.3"/>
							<text x="42.5" y="163" font-size="6" fill="white" opacity="0.9" text-anchor="middle" font-weight="600">FIELD DATA</text>
						</g>

						<!-- Floating card 2 - Analytics Dashboard -->
						<g>
							<rect x="115" y="65" width="95" height="105" rx="14" fill="url(#cardGradient2)" stroke="white" stroke-width="2" opacity="0.9" />

							<!-- Dashboard header -->
							<line x1="125" y1="82" x2="200" y2="82" stroke="white" stroke-width="1" opacity="0.4"/>

							<!-- Animated bar chart -->
							<g>
								<rect x="130" y="135" width="10" height="25" rx="2" fill="url(#glowGradient)">
									<animate attributeName="height" values="25;30;25" dur="2s" repeatCount="indefinite"/>
									<animate attributeName="y" values="135;130;135" dur="2s" repeatCount="indefinite"/>
								</rect>
								<rect x="145" y="125" width="10" height="35" rx="2" fill="url(#glowGradient)">
									<animate attributeName="height" values="35;42;35" dur="2.3s" repeatCount="indefinite"/>
									<animate attributeName="y" values="125;118;125" dur="2.3s" repeatCount="indefinite"/>
								</rect>
								<rect x="160" y="115" width="10" height="45" rx="2" fill="url(#glowGradient)">
									<animate attributeName="height" values="45;50;45" dur="2.7s" repeatCount="indefinite"/>
									<animate attributeName="y" values="115;110;115" dur="2.7s" repeatCount="indefinite"/>
								</rect>
								<rect x="175" y="130" width="10" height="30" rx="2" fill="url(#glowGradient)">
									<animate attributeName="height" values="30;35;30" dur="2.5s" repeatCount="indefinite"/>
									<animate attributeName="y" values="130;125;130" dur="2.5s" repeatCount="indefinite"/>
								</rect>
								<rect x="190" y="120" width="10" height="40" rx="2" fill="url(#glowGradient)">
									<animate attributeName="height" values="40;47;40" dur="2.8s" repeatCount="indefinite"/>
									<animate attributeName="y" values="120;113;120" dur="2.8s" repeatCount="indefinite"/>
								</rect>
							</g>

							<!-- Chart axis -->
							<line x1="128" y1="162" x2="202" y2="162" stroke="white" stroke-width="1.5" opacity="0.5"/>
							<line x1="128" y1="90" x2="128" y2="162" stroke="white" stroke-width="1.5" opacity="0.5"/>

							<!-- Metric cards -->
							<rect x="130" y="95" width="25" height="15" rx="3" fill="white" opacity="0.25"/>
							<rect x="160" y="95" width="25" height="15" rx="3" fill="white" opacity="0.25"/>
						</g>

						<!-- Floating card 3 - Real-time Activity -->
						<g>
							<rect x="220" y="30" width="75" height="70" rx="10" fill="url(#cardGradient1)" stroke="white" stroke-width="2" opacity="0.85" />

							<!-- Live indicator -->
							<circle cx="230" cy="42" r="3" fill="#ef4444" opacity="0.9">
								<animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
							</circle>
							<text x="238" y="45" font-size="7" fill="white" opacity="0.9" font-weight="600">LIVE</text>

							<!-- Animated wave/pulse graph -->
							<polyline points="230,70 235,65 240,75 245,60 250,68 255,62 260,70 265,58 270,65 275,70 280,63 285,70"
								stroke="white" stroke-width="2.5" fill="none" opacity="0.8" stroke-linecap="round" stroke-linejoin="round">
								<animate attributeName="points"
									values="230,70 235,65 240,75 245,60 250,68 255,62 260,70 265,58 270,65 275,70 280,63 285,70;
									        230,70 235,68 240,62 245,72 250,58 255,70 260,65 265,75 270,60 275,68 280,70 285,65;
									        230,70 235,65 240,75 245,60 250,68 255,62 260,70 265,58 270,65 275,70 280,63 285,70"
									dur="3s" repeatCount="indefinite"/>
							</polyline>

							<!-- Activity dots -->
							<circle cx="235" cy="50" r="2.5" fill="white" opacity="0.9">
								<animate attributeName="cy" values="50;48;50" dur="2s" repeatCount="indefinite"/>
							</circle>
							<circle cx="255" cy="50" r="2.5" fill="white" opacity="0.7">
								<animate attributeName="cy" values="50;52;50" dur="2.5s" repeatCount="indefinite"/>
							</circle>
							<circle cx="275" cy="50" r="2.5" fill="white" opacity="0.5">
								<animate attributeName="cy" values="50;48;50" dur="3s" repeatCount="indefinite"/>
							</circle>
						</g>

						<!-- Data submission indicator (bottom) -->
						<g opacity="0.6">
							<rect x="20" y="195" width="45" height="18" rx="9" fill="white" opacity="0.2"/>
							<circle cx="30" cy="204" r="4" fill="white" opacity="0.8">
								<animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
							</circle>
							<text x="40" y="207" font-size="7" fill="white" opacity="0.9" font-weight="500">247 Active</text>
						</g>
					</svg>
				</div>
			</div>

			<!-- Feature highlights -->
			<div class="space-y-3.5 mb-4 fade-in-delay-4">
				{#each [
					{
						icon: icons.Layers(20),
						label: 'Custom form builder',
						desc: 'Drag-and-drop fields, scoring, multi-step flows'
					},
					{
						icon: icons.Activity(20),
						label: 'Real-time submissions',
						desc: 'Track your teams activity as it happens'
					},
					{
						icon: icons.BarChart(20),
						label: 'Visual analytics',
						desc: 'Charts, aggregations, and exportable reports'
					}
				] as feature}
					<div class="flex items-start gap-3 group transition-all duration-300 hover:translate-x-1">
						<div class="mt-0.5 w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/20 group-hover:bg-white/30 group-hover:ring-white/40 transition-all duration-300">
							<div class="text-white">
								{@html feature.icon}
							</div>
						</div>
						<div>
							<p class="text-white text-sm font-medium">{feature.label}</p>
							<p class="text-blue-100 text-xs mt-0.5 opacity-90">{feature.desc}</p>
						</div>
					</div>
				{/each}
			</div>

			<p class="text-blue-300 text-xs">&copy; 2026 FieldScope. All rights reserved.</p>
		</div>
	</div>

	<!-- Right: form area -->
	<div class="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
		<!-- Mobile brand -->
		<!-- <div class="flex lg:hidden items-center justify-center -mb-10 -mt-40 fade-in">
			<img src="/icon.svg" alt="FieldScope" class="h-62 w-62" />
		</div> -->

		<div class="w-full max-w-sm slide-up">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.bg-dot-pattern {
		background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px);
		background-size: 24px 24px;
	}

	/* Animation keyframes */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes blob {
		0%, 100% {
			transform: translate(0px, 0px) scale(1);
		}
		33% {
			transform: translate(30px, -20px) scale(1.1);
		}
		66% {
			transform: translate(-20px, 20px) scale(0.9);
		}
	}

	@keyframes floatLogo {
		0%, 100% {
			transform: translate(-50%, -50%) rotate(0deg) scale(1);
		}
		50% {
			transform: translate(-50%, -52%) rotate(2deg) scale(1.05);
		}
	}

	/* Animation classes */
	.fade-in-delay-1 {
		opacity: 0;
		animation: fadeIn 0.6s ease-out 0.1s forwards;
	}

	.fade-in-delay-2 {
		opacity: 0;
		animation: fadeIn 0.6s ease-out 0.2s forwards;
	}

	.fade-in-delay-3 {
		opacity: 0;
		animation: fadeIn 0.6s ease-out 0.3s forwards;
	}

	.fade-in-delay-4 {
		opacity: 0;
		animation: fadeIn 0.6s ease-out 0.4s forwards;
	}

	.slide-up {
		animation: slideUp 0.5s ease-out forwards;
	}

	

	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	.animate-pulse-slow {
		animation: pulseSlow 3s ease-in-out infinite;
	}

	@keyframes pulseSlow {
		0%, 100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* Respect user preferences for reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.fade-in-delay-1,
		.fade-in-delay-2,
		.fade-in-delay-3,
		.fade-in-delay-4,
		.slide-up,
		.animate-pulse-slow {
			animation: none;
			opacity: 1;
		}
	}
</style>
