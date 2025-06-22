<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import Modal from '$lib/components/Modal.svelte';
	
	// Simple modal states
	let showBasicModal = false;
	let showConfirmationModal = false;
</script>

<AppLayout>
	<div class="max-w-4xl mx-auto p-6">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Modal System Demo</h1>
			<p class="text-gray-600">
				Testing the modal component system.
			</p>
		</div>
		
		<!-- Simple Modal Tests -->
		<div class="mb-12">
			<h2 class="text-2xl font-semibold text-gray-900 mb-6">Modal Tests</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<button
					on:click={() => showBasicModal = true}
					class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
				>
					Basic Modal
				</button>
				
				<button
					on:click={() => showConfirmationModal = true}
					class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
				>
					Confirmation Modal
				</button>
			</div>
		</div>
		
		<!-- Features Overview -->
		<div class="bg-gray-50 rounded-lg p-6">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">Modal System Features</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Variants</h3>
					<ul class="text-gray-600 space-y-1">
						<li>• Default - Basic modal</li>
						<li>• Confirmation - Question icon with confirm/cancel</li>
						<li>• Danger - Warning icon with delete/cancel</li>
						<li>• Success - Check icon for success messages</li>
						<li>• Info - Info icon for informational content</li>
					</ul>
				</div>
				
				<div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Sizes</h3>
					<ul class="text-gray-600 space-y-1">
						<li>• Small (sm) - 384px max width</li>
						<li>• Medium (md) - 448px max width</li>
						<li>• Large (lg) - 512px max width</li>
						<li>• Extra Large (xl) - 576px max width</li>
						<li>• Full - Full width with margin</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</AppLayout>

<!-- Basic Modal -->
<Modal
	bind:open={showBasicModal}
	title="Basic Modal"
	on:close={() => showBasicModal = false}
>
	<p class="text-gray-700">
		This is a basic modal with a title and close button. You can close it by clicking the X button, 
		pressing the Escape key, or clicking outside the modal.
	</p>
	
	<svelte:fragment slot="footer">
		<div class="flex justify-end">
			<button
				on:click={() => showBasicModal = false}
				class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				Close
			</button>
		</div>
	</svelte:fragment>
</Modal>

<!-- Confirmation Modal -->
<Modal
	bind:open={showConfirmationModal}
	title="Confirm Action"
	variant="confirmation"
	on:close={() => showConfirmationModal = false}
	on:confirm={() => {
		showConfirmationModal = false;
	}}
	on:cancel={() => {
		showConfirmationModal = false;
	}}
>
	<p class="text-gray-700">
		Are you sure you want to proceed with this action? This is a confirmation modal with 
		default confirm/cancel buttons.
	</p>
</Modal>