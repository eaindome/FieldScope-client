<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showPassword = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		const { data, error: err } = await api.login(email, password);

		if (err) {
			error = err;
			loading = false;
		} else if (data) {
			localStorage.setItem('accessToken', data.accessToken);
			localStorage.setItem('refreshToken', data.refreshToken);

			const response = await api.getCurrentUser();
			const user = 'data' in response ? response.data : null;
			const userErr = 'error' in response ? response.error : null;

			if (userErr || !user) {
				error = userErr ?? 'Failed to load user details';
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
				loading = false;
				return;
			}

			localStorage.setItem('user', JSON.stringify(user));

			const role = user.role;
			if (role === 'SuperAdmin') {
				goto('/dashboard');
			} else if (role === 'Admin') {
				goto('/projects');
			} else if (role === 'Agent') {
				goto('/project');
			} else {
				goto('/');
			}
		}
	}

	function fillDemo() {
		email = 'superadmin@fieldscope.com';
		password = 'SuperAdmin123!';
	}
</script>

<div>
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-slate-900 tracking-tight bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text">Welcome back</h1>
		<p class="text-slate-600 text-sm mt-2">Sign in to your FieldScope account</p>
	</div>

	{#if error}
		<div class="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5 animate-shake">
			<svg class="mt-0.5 shrink-0 text-red-500" width="15" height="15" viewBox="0 0 16 16" fill="none">
				<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
				<path d="M8 5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				<circle cx="8" cy="11" r="0.75" fill="currentColor"/>
			</svg>
			<div>
				<p class="text-sm font-medium text-red-800">Sign in failed</p>
				<p class="text-xs text-red-600 mt-0.5">{error}</p>
			</div>
		</div>
	{/if}

	<form onsubmit={handleLogin} class="space-y-5">
		<div class="space-y-2 group">
			<Label for="email" class="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-blue-600">Email address</Label>
			<Input
				id="email"
				type="email"
				bind:value={email}
				placeholder="you@example.com"
				required
				disabled={loading}
				autocomplete="email"
				class="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10"
			/>
		</div>

		<div class="space-y-2 group">
			<div class="flex items-center justify-between">
				<Label for="password" class="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-blue-600">Password</Label>
				<a href="/forgot-password" class="text-xs text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 hover:underline hover:underline-offset-2">
					Forgot password?
				</a>
			</div>
			<div class="relative">
				<Input
					id="password"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					placeholder="Enter your password"
					required
					disabled={loading}
					class="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10"
					autocomplete="current-password"
				/>
				<button
					type="button"
					class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-all duration-200 hover:scale-110"
					onclick={() => (showPassword = !showPassword)}
					tabindex="-1"
					aria-label={showPassword ? 'Hide password' : 'Show password'}
				>
					{#if showPassword}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
							<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
							<line x1="1" y1="1" x2="23" y2="23"/>
						</svg>
					{:else}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
							<circle cx="12" cy="12" r="3"/>
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<!-- <div class="flex items-center gap-2">
			<input
				type="checkbox"
				id="remember"
				class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all duration-200"
			/>
			<label for="remember" class="text-sm text-slate-600 cursor-pointer select-none hover:text-slate-800 transition-colors">
				Keep me signed in
			</label>
		</div> -->

		<Button type="submit" class="w-full group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5" loading={loading}>
			<span class="relative z-10">Sign in</span>
			<div class="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
		</Button>
	</form>

	<!-- <div class="mt-6 text-center space-y-3">
		<p class="text-sm text-slate-600">
			Don't have an account?
			<a href="/signup" class="text-blue-600 hover:text-blue-700 font-semibold ml-1 transition-all duration-200 hover:underline hover:underline-offset-2">
				Sign Up
			</a>
		</p>
	</div> -->

	<!-- Demo credentials -->
	<!-- <div class="mt-8 pt-6 border-t border-slate-100">
		<p class="text-xs text-slate-400 text-center font-medium uppercase tracking-wide mb-3">Demo credentials</p>
		<button
			type="button"
			onclick={fillDemo}
			class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl divide-y divide-slate-100 text-xs overflow-hidden transition-colors cursor-pointer text-left"
		>
			<div class="flex items-center justify-between px-3.5 py-2.5">
				<span class="text-slate-500">Email</span>
				<span class="font-mono text-slate-700 font-medium">superadmin@fieldscope.com</span>
			</div>
			<div class="flex items-center justify-between px-3.5 py-2.5">
				<span class="text-slate-500">Password</span>
				<span class="font-mono text-slate-700 font-medium">SuperAdmin123!</span>
			</div>
			<div class="px-3.5 py-2 bg-slate-100/60">
				<span class="text-slate-400 text-[11px]">Click to autofill</span>
			</div>
		</button>
	</div> -->
</div>

<style>
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
		20%, 40%, 60%, 80% { transform: translateX(4px); }
	}

	.animate-shake {
		animation: shake 0.5s ease-in-out;
	}
</style>
