<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { isAuthenticated, loading, authStore } from '$lib/stores/auth'

	// Props
	export let redirectTo = '/auth/login'
	export let requireAuth = true

	// Internal state
	let isInitialized = false

	// Initialize auth and check authentication status
	onMount(async () => {
		// Ensure auth is initialized
		await authStore.initialize()
		isInitialized = true

		// Check authentication status
		checkAuthStatus()
	})

	// Check authentication and redirect if necessary
	function checkAuthStatus() {
		if (!isInitialized || $loading) return

		if (requireAuth && !$isAuthenticated) {
			// Store the current path to redirect back after login
			const currentPath = $page.url.pathname + $page.url.search
			const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
			goto(redirectUrl)
		} else if (!requireAuth && $isAuthenticated) {
			// For auth pages, redirect authenticated users to dashboard
			goto('/dashboard')
		}
	}

	// React to authentication state changes
	$: if (isInitialized) {
		checkAuthStatus()
	}
</script>

{#if $loading || !isInitialized}
	<!-- Loading state while checking authentication -->
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
			<p class="text-gray-600">Loading...</p>
		</div>
	</div>
{:else if (requireAuth && $isAuthenticated) || (!requireAuth && !$isAuthenticated)}
	<!-- Show content if authentication requirements are met -->
	<slot />
{:else}
	<!-- Fallback loading state during redirect -->
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
			<p class="text-gray-600">Redirecting...</p>
		</div>
	</div>
{/if}