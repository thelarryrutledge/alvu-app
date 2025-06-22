<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		close: void;
		confirm: void;
		cancel: void;
	}>();
	
	// Props
	export let open: boolean = false;
	export let title: string = '';
	export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
	export let variant: 'default' | 'confirmation' | 'danger' | 'success' | 'info' = 'default';
	export let closeOnBackdrop: boolean = true;
	export let closeOnEscape: boolean = true;
	export let showCloseButton: boolean = true;
	export let persistent: boolean = false;
	export let centered: boolean = true;
	
	// Size classes
	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		full: 'max-w-full mx-4'
	};
	
	// Variant classes for header
	const variantClasses = {
		default: 'bg-white border-gray-200',
		confirmation: 'bg-blue-50 border-blue-200',
		danger: 'bg-red-50 border-red-200',
		success: 'bg-green-50 border-green-200',
		info: 'bg-blue-50 border-blue-200'
	};
	
	// Icon classes for variants
	const variantIcons = {
		default: '',
		confirmation: '❓',
		danger: '⚠️',
		success: '✅',
		info: 'ℹ️'
	};
	
	// Focus management
	let modalElement: HTMLDivElement;
	let previousActiveElement: Element | null = null;
	
	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closeOnEscape && !persistent) {
			handleClose();
		}
	}
	
	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && closeOnBackdrop && !persistent) {
			handleClose();
		}
	}
	
	// Close modal
	function handleClose() {
		dispatch('close');
	}
	
	// Confirm action
	function handleConfirm() {
		dispatch('confirm');
	}
	
	// Cancel action
	function handleCancel() {
		dispatch('cancel');
	}
	
	// Focus management
	onMount(() => {
		if (typeof window !== 'undefined' && open) {
			previousActiveElement = document.activeElement;
			// Focus the modal after a brief delay to ensure it's rendered
			setTimeout(() => {
				modalElement?.focus();
			}, 100);
		}
	});
	
	onDestroy(() => {
		// Restore focus when modal is destroyed
		if (typeof window !== 'undefined' && previousActiveElement && previousActiveElement instanceof HTMLElement) {
			previousActiveElement.focus();
		}
	});
	
	// Watch for open changes
	$: if (typeof window !== 'undefined') {
		if (open) {
			previousActiveElement = document.activeElement;
			setTimeout(() => {
				modalElement?.focus();
			}, 100);
			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Restore body scroll
			document.body.style.overflow = '';
			// Restore focus
			if (previousActiveElement && previousActiveElement instanceof HTMLElement) {
				previousActiveElement.focus();
			}
		}
	}
	
	// Get classes
	$: sizeClass = sizeClasses[size];
	$: variantClass = variantClasses[variant];
	$: variantIcon = variantIcons[variant];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- Modal backdrop -->
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex {centered ? 'items-center' : 'items-start pt-16'} justify-center p-4"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		transition:fade={{ duration: 200 }}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		tabindex="0"
	>
		<!-- Modal container -->
		<div
			bind:this={modalElement}
			class="bg-white rounded-lg shadow-xl {sizeClass} w-full max-h-full overflow-hidden"
			transition:scale={{ duration: 200, start: 0.95 }}
			tabindex="-1"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="document"
		>
			<!-- Modal header -->
			{#if title || showCloseButton || $$slots.header}
				<div class="px-6 py-4 border-b {variantClass}">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							{#if variantIcon}
								<span class="text-2xl">{variantIcon}</span>
							{/if}
							{#if title}
								<h3 id="modal-title" class="text-lg font-semibold text-gray-900">
									{title}
								</h3>
							{/if}
							<slot name="header" />
						</div>
						
						{#if showCloseButton && !persistent}
							<button
								type="button"
								class="text-gray-400 hover:text-gray-600 transition-colors"
								on:click={handleClose}
								aria-label="Close modal"
							>
								<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- Modal body -->
			<div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
				<slot />
			</div>
			
			<!-- Modal footer -->
			{#if $$slots.footer}
				<div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
					<slot name="footer" />
				</div>
			{:else if variant === 'confirmation' || variant === 'danger'}
				<!-- Default confirmation footer -->
				<div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
					<div class="flex justify-end space-x-3">
						<button
							type="button"
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							on:click={handleCancel}
						>
							Cancel
						</button>
						<button
							type="button"
							class="px-4 py-2 text-sm font-medium text-white {variant === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'} border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
							on:click={handleConfirm}
						>
							{variant === 'danger' ? 'Delete' : 'Confirm'}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Ensure modal is above other content */
	:global(body.modal-open) {
		overflow: hidden;
	}
</style>