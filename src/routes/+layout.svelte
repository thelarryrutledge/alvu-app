<script>
	import '../app.css'
	import { onMount } from 'svelte'
	import { authStore } from '$lib/stores/auth'

	// Initialize authentication on app load
	onMount(() => {
		authStore.initialize()
	})
</script>

<slot />
