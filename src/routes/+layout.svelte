<script>
	import '../app.css'
	import { onMount } from 'svelte'
	import { authStore, loading } from '$lib/stores/auth'

	// Initialize authentication on app load
	onMount(() => {
		authStore.initialize()
	})
</script>

<!-- Show loading state while initializing auth -->
{#if $loading}
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
			<p class="text-gray-600">Loading...</p>
		</div>
	</div>
{:else}
	<slot />
{/if}
