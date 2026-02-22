<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Check if user is authenticated
		const token = localStorage.getItem('accessToken');
		const userStr = localStorage.getItem('user');

		if (token && userStr) {
			try {
				const user = JSON.parse(userStr);
				// Redirect to appropriate dashboard based on role
				if (user.role === 'SuperAdmin') {
					goto('/dashboard');
				} else if (user.role === 'Admin') {
					goto('/projects');
				} else if (user.role === 'Agent') {
					goto('/project');
				} else {
					goto('/login');
				}
			} catch {
				goto('/login');
			}
		} else {
			// Not authenticated, go to login
			goto('/login');
		}
	});
</script>

<!-- Loading state while redirecting -->
<!-- <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
	<div class="text-center">
		<h1 class="text-5xl font-bold text-white mb-4">FieldScope</h1>
		<p class="text-cyan-300 text-lg">Loading...</p>
	</div>
</div> -->
