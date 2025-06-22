<script lang="ts">
	import { modalStore } from '$lib/stores/modal';
	import Modal from './Modal.svelte';
	
	// Subscribe to modal store
	$: ({ activeModal } = $modalStore);
	
	// Handle modal events
	function handleClose() {
		modalStore.closeCurrent();
	}
	
	function handleConfirm() {
		modalStore.confirm();
	}
	
	function handleCancel() {
		modalStore.cancel();
	}
</script>

{#if activeModal}
	<Modal
		open={true}
		title={activeModal.title || ''}
		size={activeModal.size || 'md'}
		variant={activeModal.variant || 'default'}
		closeOnBackdrop={activeModal.closeOnBackdrop !== false}
		closeOnEscape={activeModal.closeOnEscape !== false}
		persistent={activeModal.persistent || false}
		on:close={handleClose}
		on:confirm={handleConfirm}
		on:cancel={handleCancel}
	>
		{#if activeModal.component}
			<!-- Render custom component -->
			<svelte:component this={activeModal.component} {...(activeModal.props || {})} />
		{:else if activeModal.content}
			<!-- Render simple text content -->
			<p class="text-gray-700">{activeModal.content}</p>
		{/if}
	</Modal>
{/if}