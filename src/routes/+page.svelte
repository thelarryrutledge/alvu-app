<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, isAuthenticated, loading } from '$lib/stores/auth';
	import PageLoading from '$lib/components/PageLoading.svelte';

	onMount(() => {
		// Initialize auth if not already done
		authStore.initialize();
	});

	// Redirect based on authentication status
	$: if (!$loading) {
		if ($isAuthenticated) {
			// User is authenticated, redirect to dashboard
			goto('/dashboard');
		} else {
			// User is not authenticated, redirect to login
			goto('/auth/login');
		}
	}
</script>

<svelte:head>
	<title>Alvu - Budget Management</title>
	<meta name="description" content="Alvu - Envelope-based budget management application" />
</svelte:head>

{#if $loading}
	<PageLoading 
		title="Loading Alvu..." 
		subtitle="Checking your authentication status"
		variant="spinner"
	/>
{:else}
	<!-- This should not be visible as user will be redirected -->
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">Alvu</h1>
			<p class="text-gray-600 mb-4">Redirecting...</p>
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
		</div>
	</div>
{/if}
