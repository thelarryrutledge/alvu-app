<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import type { ToastConfig } from '$lib/stores/toast';
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		dismiss: void;
		action: void;
	}>();
	
	// Props
	export let toast: ToastConfig;
	export let index: number = 0;
	
	// Type-specific styling
	const typeStyles = {
		success: {
			bg: 'bg-green-50 border-green-200',
			text: 'text-green-800',
			icon: '✅',
			iconBg: 'bg-green-100',
			iconText: 'text-green-600'
		},
		error: {
			bg: 'bg-red-50 border-red-200',
			text: 'text-red-800',
			icon: '❌',
			iconBg: 'bg-red-100',
			iconText: 'text-red-600'
		},
		warning: {
			bg: 'bg-yellow-50 border-yellow-200',
			text: 'text-yellow-800',
			icon: '⚠️',
			iconBg: 'bg-yellow-100',
			iconText: 'text-yellow-600'
		},
		info: {
			bg: 'bg-blue-50 border-blue-200',
			text: 'text-blue-800',
			icon: 'ℹ️',
			iconBg: 'bg-blue-100',
			iconText: 'text-blue-600'
		}
	};
	
	// Handle dismiss
	function handleDismiss() {
		dispatch('dismiss');
	}
	
	// Handle action click
	function handleAction() {
		if (toast.action?.handler) {
			toast.action.handler();
		}
		dispatch('action');
	}
	
	// Get styles for current toast type
	$: styles = typeStyles[toast.type];
</script>

<div
	class="flex items-start p-4 mb-3 border rounded-lg shadow-sm {styles.bg} {styles.text}"
	transition:fly={{ x: 300, duration: 300, delay: index * 50 }}
	role="alert"
	aria-live="polite"
>
	<!-- Icon -->
	<div class="flex-shrink-0">
		<div class="flex items-center justify-center w-8 h-8 rounded-full {styles.iconBg}">
			<span class="text-sm {styles.iconText}">{styles.icon}</span>
		</div>
	</div>
	
	<!-- Content -->
	<div class="ml-3 flex-1">
		{#if toast.title}
			<h4 class="text-sm font-semibold mb-1">{toast.title}</h4>
		{/if}
		<p class="text-sm">{toast.message}</p>
		
		{#if toast.action}
			<div class="mt-2">
				<button
					type="button"
					class="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current rounded"
					on:click={handleAction}
				>
					{toast.action.label}
				</button>
			</div>
		{/if}
	</div>
	
	<!-- Dismiss button -->
	{#if toast.dismissible}
		<div class="ml-4 flex-shrink-0">
			<button
				type="button"
				class="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
				on:click={handleDismiss}
				aria-label="Dismiss notification"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}
</div>