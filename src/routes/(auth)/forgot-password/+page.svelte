<script lang="ts">
	import { api } from '$lib/api/client';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import { icons } from '$lib/components/icons.svelte';
	import { goto } from '$app/navigation';

	// Step 1: email → Step 2: otp → Step 3: password
	type Step = 'email' | 'otp' | 'password';

	let step = $state<Step>('email');
	let email = $state('');
	let otpValues = $state(['', '', '', '', '', '']);
	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// OTP input refs
	let otpInputs: HTMLInputElement[] = [];

	const otp = $derived(otpValues.join(''));
	const otpComplete = $derived(otp.length === 6);
	const passwordsMatch = $derived(confirmPassword.length > 0 && newPassword === confirmPassword);
	const passwordsMismatch = $derived(confirmPassword.length > 0 && newPassword !== confirmPassword);

	// Step 1: send OTP
	async function handleSendOtp(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 800));

		// For demo: accept any email
		if (!email || !email.includes('@')) {
			error = 'Please enter a valid email address';
			loading = false;
			return;
		}

		loading = false;
		step = 'otp';

		// Uncomment when backend is ready:
		// const { data, error: err } = await api.forgotPassword(email);
		// loading = false;
		// if (err) { error = err; return; }
		// if (data) step = 'otp';
	}

	// Step 2: verify OTP (moves to step 3 — actual verification happens with password reset)
	function handleVerifyOtp(e: Event) {
		e.preventDefault();
		if (!otpComplete) { error = 'Please enter the full 6-digit code'; return; }
		error = null;
		step = 'password';
	}

	// Step 3: reset password using email + OTP + new password
	async function handleResetPassword(e: Event) {
		e.preventDefault();
		if (newPassword !== confirmPassword) { error = 'Passwords do not match'; return; }
		if (newPassword.length < 6) { error = 'Password must be at least 6 characters'; return; }
		loading = true;
		error = null;

		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));

		// For demo: accept any valid password
		loading = false;
		toastType = 'success';
		toastMessage = 'Password reset successfully!';
		setTimeout(() => goto('/login'), 1500);

		// Uncomment when backend is ready:
		// const { data, error: err } = await api.resetPasswordWithOtp(email, otp, newPassword);
		// loading = false;
		// if (err) {
		// 	toastType = 'error';
		// 	toastMessage = err;
		// 	return;
		// }
		// if (data) {
		// 	toastType = 'success';
		// 	toastMessage = 'Password reset successfully!';
		// 	setTimeout(() => goto('/login'), 1500);
		// }
	}

	function handleOtpInput(index: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const val = input.value.replace(/\D/g, '').slice(-1);
		otpValues[index] = val;
		if (val && index < 5) otpInputs[index + 1]?.focus();
	}

	function handleOtpKeydown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
			otpInputs[index - 1]?.focus();
		}
	}

	function handleOtpPaste(e: ClipboardEvent) {
		e.preventDefault();
		const text = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || '';
		for (let i = 0; i < 6; i++) otpValues[i] = text[i] ?? '';
		otpInputs[Math.min(text.length, 5)]?.focus();
	}

	function resendOtp() {
		otpValues = ['', '', '', '', '', ''];
		error = null;
		step = 'email';
	}
</script>

<div class="relative overflow-hidden">
	<!-- Step 1: Enter email -->
	<div class="transition-all duration-500 ease-out {step === 'email' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 absolute inset-0 pointer-events-none'}">
	{#if step === 'email'}
		<a href="/login" class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors group">
			<svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="transition-transform group-hover:-translate-x-0.5">
				<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			Back to sign in
		</a>

		<div class="mb-8">
			<h1 class="text-2xl font-bold text-slate-900 tracking-tight">Forgot password?</h1>
			<p class="text-slate-500 text-sm mt-1">Enter your email and we'll send you a code</p>
		</div>

		{#if error}
			<div class="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5">
				<svg class="mt-0.5 shrink-0 text-red-500" width="15" height="15" viewBox="0 0 16 16" fill="none">
					<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
					<path d="M8 5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					<circle cx="8" cy="11" r="0.75" fill="currentColor"/>
				</svg>
				<p class="text-sm text-red-700">{error}</p>
			</div>
		{/if}

		<form onsubmit={handleSendOtp} class="space-y-5">
			<div class="space-y-1.5">
				<Label for="email" class="text-sm font-medium text-slate-700">Email address</Label>
				<Input id="email" type="email" bind:value={email} placeholder="you@example.com" required disabled={loading} />
				<p class="text-xs text-slate-400">We'll send a verification code to this email</p>
			</div>
			<Button type="submit" class="w-full group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5" loading={loading}>
				<span class="relative z-10">Send verification code</span>
				<div class="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			</Button>
		</form>
	{/if}
	</div>

	<!-- Step 2: Enter OTP -->
	<div class="transition-all duration-500 ease-out {step === 'otp' ? 'translate-x-0 opacity-100' : step === 'email' ? 'translate-x-full opacity-0 absolute inset-0 pointer-events-none' : '-translate-x-full opacity-0 absolute inset-0 pointer-events-none'}">
	{#if step === 'otp'}
		<button type="button" onclick={resendOtp} class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors group">
			<svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="transition-transform group-hover:-translate-x-0.5">
				<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			Back
		</button>

		<div class="mb-8">
			<h1 class="text-2xl font-bold text-slate-900 tracking-tight">Check your email</h1>
			<p class="text-slate-500 text-sm mt-1">
				We sent a 6-digit code to <span class="font-medium text-slate-700">{email}</span>
			</p>
		</div>

		{#if error}
			<div class="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5">
				<svg class="mt-0.5 shrink-0 text-red-500" width="15" height="15" viewBox="0 0 16 16" fill="none">
					<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
					<path d="M8 5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					<circle cx="8" cy="11" r="0.75" fill="currentColor"/>
				</svg>
				<p class="text-sm text-red-700">{error}</p>
			</div>
		{/if}

		<form onsubmit={handleVerifyOtp} class="space-y-6">
			<!-- OTP boxes -->
			<div>
				<Label class="text-sm font-medium text-slate-700 mb-3 block">Verification code</Label>
				<div class="flex gap-2" onpaste={handleOtpPaste}>
					{#each otpValues as _, i}
						<input
							bind:this={otpInputs[i]}
							type="text"
							inputmode="numeric"
							maxlength="1"
							value={otpValues[i]}
							oninput={(e) => handleOtpInput(i, e)}
							onkeydown={(e) => handleOtpKeydown(i, e)}
							class="w-full aspect-square rounded-xl border-2 text-center text-xl font-semibold text-slate-900 bg-white outline-none transition-all
								{otpValues[i] ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:border-slate-300'}
								focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-500"
						/>
					{/each}
				</div>
				<p class="text-xs text-slate-400 mt-3">Enter the 6-digit code sent to your email</p>
			</div>

			<Button type="submit" class="w-full group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5" disabled={!otpComplete} loading={loading}>
				<span class="relative z-10">Continue</span>
				<div class="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			</Button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-sm text-slate-500">
				Didn't receive the code?
				<button type="button" onclick={resendOtp} class="text-blue-600 hover:text-blue-700 font-medium ml-1 transition-colors">
					Resend
				</button>
			</p>
		</div>
	{/if}
	</div>

	<!-- Step 3: Set new password -->
	<div class="transition-all duration-500 ease-out {step === 'password' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'}">
	{#if step === 'password'}
		<button type="button" onclick={() => { step = 'otp'; error = null; }} class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors group">
			<svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="transition-transform group-hover:-translate-x-0.5">
				<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			Back
		</button>

		<div class="mb-8">
			<h1 class="text-2xl font-bold text-slate-900 tracking-tight">Set new password</h1>
			<p class="text-slate-500 text-sm mt-1">Choose a strong password for your account</p>
		</div>

		{#if error}
			<div class="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5">
				<svg class="mt-0.5 shrink-0 text-red-500" width="15" height="15" viewBox="0 0 16 16" fill="none">
					<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
					<path d="M8 5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					<circle cx="8" cy="11" r="0.75" fill="currentColor"/>
				</svg>
				<p class="text-sm text-red-700">{error}</p>
			</div>
		{/if}

		<form onsubmit={handleResetPassword} class="space-y-4">
			<div class="space-y-1.5">
				<Label for="newPassword" class="text-sm font-medium text-slate-700">New password</Label>
				<div class="relative">
					<Input
						id="newPassword"
						type={showPassword ? 'text' : 'password'}
						bind:value={newPassword}
						placeholder="Create a secure password"
						required
						disabled={loading}
						class="pr-10"
					/>
					<button
						type="button"
						tabindex="-1"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
						onclick={() => (showPassword = !showPassword)}
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
				<p class="text-xs text-slate-400">Must be at least 6 characters</p>
			</div>

			<div class="space-y-1.5">
				<Label for="confirmPassword" class="text-sm font-medium text-slate-700">Confirm password</Label>
				<div class="relative">
					<Input
						id="confirmPassword"
						type={showConfirmPassword ? 'text' : 'password'}
						bind:value={confirmPassword}
						placeholder="Re-enter your password"
						required
						disabled={loading}
						class="pr-10 {passwordsMismatch ? 'border-red-300 focus:ring-red-100' : passwordsMatch ? 'border-green-300 focus:ring-green-100' : ''}"
					/>
					<button
						type="button"
						tabindex="-1"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
						onclick={() => (showConfirmPassword = !showConfirmPassword)}
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

			<Button type="submit" class="w-full group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5" loading={loading} disabled={passwordsMismatch}>
				<span class="relative z-10">Reset password</span>
				<div class="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			</Button>
		</form>
	{/if}
	</div>
</div>

{#if toastMessage}
	<Toast message={toastMessage} type={toastType} onClose={() => (toastMessage = null)} />
{/if}
