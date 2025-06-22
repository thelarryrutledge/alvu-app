<script>
	import '../app.css'
	import { onMount } from 'svelte'
	import { authStore } from '$lib/stores/auth'
	import ModalManager from '$lib/components/ModalManager.svelte'

	// Initialize authentication on app load
	onMount(() => {
		authStore.initialize()
	})
</script>

<slot />

<!-- Global Modal Manager -->
<ModalManager />
