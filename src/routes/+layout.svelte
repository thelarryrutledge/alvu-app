<script>
	import '../app.css'
	import { onMount } from 'svelte'
	import { authStore } from '$lib/stores/auth'
	import ModalManager from '$lib/components/ModalManager.svelte'
	import ToastManager from '$lib/components/ToastManager.svelte'
	import UpdateNotification from '$lib/components/UpdateNotification.svelte'

	// Initialize authentication on app load
	onMount(() => {
		authStore.initialize()
	})
</script>

<slot />

<!-- Global Modal Manager -->
<ModalManager />

<!-- Global Toast Manager -->
<ToastManager />

<!-- Global Update Notification -->
<UpdateNotification />
