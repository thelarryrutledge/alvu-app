<script lang="ts">
	import { toastStore } from '$lib/stores/toast';
	import Toast from './Toast.svelte';
	
	// Subscribe to toast store
	$: ({ toasts } = $toastStore);
	
	// Handle toast dismiss
	function handleDismiss(toastId: string) {
		toastStore.dismiss(toastId);
	}
	
	// Handle toast action
	function handleAction(toastId: string) {
		// Action is handled by the toast itself, we just dismiss it
		toastStore.dismiss(toastId);
	}
</script>

<!-- Toast container - positioned fixed at top-right -->
{#if toasts.length > 0}
	<div
		class="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2"
		aria-live="polite"
		aria-label="Notifications"
	>
		{#each toasts as toast, index (toast.id)}
			<Toast
				{toast}
				{index}
				on:dismiss={() => handleDismiss(toast.id)}
				on:action={() => handleAction(toast.id)}
			/>
		{/each}
	</div>
{/if}

<!-- Alternative positioning for mobile - you can switch between these based on screen size -->
<!-- 
<div class="sm:hidden">
	{#if toasts.length > 0}
		<div
			class="fixed top-16 left-4 right-4 z-50 space-y-2"
			aria-live="polite"
			aria-label="Notifications"
		>
			{#each toasts as toast, index (toast.id)}
				<Toast
					{toast}
					{index}
					on:dismiss={() => handleDismiss(toast.id)}
					on:action={() => handleAction(toast.id)}
				/>
			{/each}
		</div>
	{/if}
</div>

<div class="hidden sm:block">
	{#if toasts.length > 0}
		<div
			class="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2"
			aria-live="polite"
			aria-label="Notifications"
		>
			{#each toasts as toast, index (toast.id)}
				<Toast
					{toast}
					{index}
					on:dismiss={() => handleDismiss(toast.id)}
					on:action={() => handleAction(toast.id)}
				/>
			{/each}
		</div>
	{/if}
</div>
-->