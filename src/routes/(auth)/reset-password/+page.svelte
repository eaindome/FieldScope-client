<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { icons } from '$lib/components/icons.svelte';

	const urlToken = $page.url.searchParams.get('token') || '';

	let token = $state(urlToken);
	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	const passwordsMatch = $derived(confirmPassword.length > 0 && newPassword === confirmPassword);
	const passwordsMismatch = $derived(confirmPassword.length > 0 && newPassword !== confirmPassword);

	async function handleResetPassword(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			loading = false;
			return;
		}

		if (newPassword.length < 6) {
			error = 'Password must be at least 6 characters';
			loading = false;
			return;
		}

		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));

		// For demo: accept any token and password
		if (!token || token.length < 10) {
			error = 'Invalid or expired reset token';
			loading = false;
			return;
		}

		loading = false;
		toastType = 'success';
		toastMessage = 'Password reset successfully!';
		setTimeout(() => goto('/login'), 1500);

		// Uncomment when backend is ready:
		// const { data, error: err } = await api.resetPassword(token, newPassword);
		// if (err) {
		// 	toastType = 'error';
		// 	toastMessage = err;
		// 	loading = false;
		// } else if (data) {
		// 	toastType = 'success';
		// 	toastMessage = 'Password reset successfully!';
		// 	setTimeout(() => goto('/login'), 1500);
		// }
	}
</script>

<div>
	<!-- Back link -->
		<a
			href="/login"
			class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors group"
		>
			<svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="transition-transform group-hover:-translate-x-0.5">
				<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			Back to sign in
		</a>

		<div class="mb-8">
			<h1 class="text-2xl font-bold text-slate-900 tracking-tight">Reset your password</h1>
			<p class="text-slate-500 text-sm mt-1">Enter your new password below</p>
		</div>

		{#if error}
			<div class="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5">
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

		<form onsubmit={handleResetPassword} class="space-y-4">
			{#if !urlToken}
				<div class="space-y-1.5">
					<Label for="token" class="text-sm font-medium text-slate-700">Reset token</Label>
					<Input
						id="token"
						type="text"
						bind:value={token}
						placeholder="Paste token from your email"
						required
						disabled={loading}
						class="font-mono text-sm"
					/>
					<p class="text-xs text-slate-400">This token was sent to your email</p>
				</div>
			{/if}

			<div class="space-y-1.5">
				<Label for="newPassword" class="text-sm font-medium text-slate-700">New password</Label>
				<div class="relative">
					<Input
						id="newPassword"
						type={showPassword ? 'text' : 'password'}
						bind:value={newPassword}
						placeholder="Enter new password"
						required
						disabled={loading}
						class="pr-10"
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
				<p class="text-xs text-slate-400">At least 6 characters</p>
			</div>

			<div class="space-y-1.5">
				<Label for="confirmPassword" class="text-sm font-medium text-slate-700">Confirm new password</Label>
				<div class="relative">
					<Input
						id="confirmPassword"
						type={showConfirmPassword ? 'text' : 'password'}
						bind:value={confirmPassword}
						placeholder="Re-enter new password"
						required
						disabled={loading}
						class="pr-10 {passwordsMismatch ? 'border-red-300 focus:ring-red-100' : passwordsMatch ? 'border-green-300 focus:ring-green-100' : ''}"
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
					<p class="text-xs text-red-500 flex items-center gap-1">
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

			<Button type="submit" class="w-full" loading={loading} disabled={passwordsMismatch}>
				Reset password
			</Button>
		</form>

		<p class="mt-6 text-center text-xs text-slate-400">
			Demo mode: Use any token with 10+ characters to simulate reset
		</p>
</div>

{#if toastMessage}
	<Toast message={toastMessage} type={toastType} onClose={() => (toastMessage = null)} />
{/if}
