<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { icons } from '$lib/components/icons.svelte';

	const token = $derived($page.params.token);

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	const passwordsMatch = $derived(
		confirmPassword.length > 0 && password === confirmPassword
	);

	const passwordsMismatch = $derived(
		confirmPassword.length > 0 && password !== confirmPassword
	);

	async function handleCompleteProfile(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			loading = false;
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			loading = false;
			return;
		}

		// Call backend API
		const { data, error: err } = await api.acceptInvitation(token, password);

		if (err) {
			toastType = 'error';
			toastMessage = err;
			loading = false;
		} else if (data) {
			toastType = 'success';
			toastMessage = 'Account activated successfully!';
			setTimeout(() => goto('/login'), 1500);
		}
	}
</script>

<div>
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">Complete your profile</h1>
		<p class="text-slate-600 text-sm mt-2">Set your password to activate your account</p>
	</div>

	{#if error}
			<div class="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5 animate-shake">
				<svg class="mt-0.5 shrink-0 text-red-500" width="15" height="15" viewBox="0 0 16 16" fill="none">
					<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
					<path d="M8 5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					<circle cx="8" cy="11" r="0.75" fill="currentColor"/>
				</svg>
				<div>
					<p class="text-sm font-medium text-red-800">Error</p>
					<p class="text-xs text-red-600 mt-0.5">{error}</p>
				</div>
			</div>
	{/if}

	<form onsubmit={handleCompleteProfile} class="space-y-5">
		<div class="space-y-2 group">
			<Label for="password" class="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-blue-600">New password</Label>
			<div class="relative">
				<Input
					id="password"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					placeholder="Create a secure password"
					required
					disabled={loading}
					class="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10"
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
			<p class="text-xs text-slate-500">At least 6 characters</p>
		</div>

		<div class="space-y-2 group">
			<Label for="confirmPassword" class="text-sm font-medium text-slate-700 transition-colors group-focus-within:text-blue-600">Confirm password</Label>
			<div class="relative">
				<Input
					id="confirmPassword"
					type={showConfirmPassword ? 'text' : 'password'}
					bind:value={confirmPassword}
					placeholder="Re-enter your password"
					required
					disabled={loading}
					class="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 {passwordsMismatch ? 'border-red-300 focus:ring-red-100' : passwordsMatch ? 'border-green-300 focus:ring-green-100' : ''}"
				/>
				<button
					type="button"
					class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-all duration-200 hover:scale-110"
					onclick={() => (showConfirmPassword = !showConfirmPassword)}
					tabindex="-1"
					aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
				>
					{#if showConfirmPassword}
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
			{#if passwordsMismatch}
				<p class="text-xs text-red-500 flex items-center gap-1 animate-shake">
					<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
						<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
						<path d="M8 5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
						<circle cx="8" cy="10" r="0.5" fill="currentColor"/>
					</svg>
					Passwords don't match
				</p>
			{:else if passwordsMatch}
				<p class="text-xs text-green-600 flex items-center gap-1">
					<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
						<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
						<path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					Passwords match
				</p>
			{/if}
		</div>

		<Button type="submit" class="w-full group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5" loading={loading} disabled={passwordsMismatch}>
			<span class="relative z-10">Activate account</span>
			<div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
		</Button>
	</form>

	<div class="mt-6 text-center space-y-3">
			<p class="text-sm text-slate-600">
				Already have an account?
				<a href="/login" class="text-blue-600 hover:text-blue-700 font-semibold ml-1 transition-all duration-200 hover:underline hover:underline-offset-2">Sign in</a>
			</p>
		</div>
</div>

{#if toastMessage}
	<Toast message={toastMessage} type={toastType} onClose={() => (toastMessage = null)} />
{/if}

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
