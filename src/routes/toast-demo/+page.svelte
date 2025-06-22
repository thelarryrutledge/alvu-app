<script lang="ts">
	import { toastStore, toastHelpers } from '$lib/stores/toast';
	import AppLayout from '$lib/components/AppLayout.svelte';
	
	// Demo functions
	function showSuccessToast() {
		toastHelpers.success('Operation completed successfully!', {
			title: 'Success'
		});
	}
	
	function showErrorToast() {
		toastHelpers.error('Something went wrong. Please try again.', {
			title: 'Error',
			duration: 0 // Persistent
		});
	}
	
	function showWarningToast() {
		toastHelpers.warning('This action cannot be undone.', {
			title: 'Warning'
		});
	}
	
	function showInfoToast() {
		toastHelpers.info('New features are available in the settings.', {
			title: 'Information'
		});
	}
	
	function showLoadingToast() {
		const toastId = toastHelpers.loading('Processing your request...', {
			title: 'Loading'
		});
		
		// Simulate async operation
		setTimeout(() => {
			toastStore.dismiss(toastId);
			toastHelpers.success('Request processed successfully!');
		}, 3000);
	}
	
	function showToastWithAction() {
		toastStore.add({
			type: 'info',
			title: 'Update Available',
			message: 'A new version of the app is available.',
			action: {
				label: 'Update Now',
				handler: () => {
					toastHelpers.success('Update started!');
				}
			}
		});
	}
	
	function showCustomToast() {
		toastStore.add({
			type: 'success',
			title: 'Custom Toast',
			message: 'This toast will auto-dismiss in 10 seconds.',
			duration: 10000,
			onDismiss: () => {
				console.log('Custom toast was dismissed');
			}
		});
	}
	
	function clearAllToasts() {
		toastStore.clear();
	}
</script>

<svelte:head>
	<title>Toast Demo - Alvu Budget App</title>
</svelte:head>

<AppLayout>
	<div class="max-w-4xl mx-auto p-6">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Toast Notification Demo</h1>
			<p class="text-gray-600">
				Test the toast notification system with different types and configurations.
			</p>
		</div>
		
		<!-- Basic Toast Types -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Toast Types</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<button
					type="button"
					class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
					on:click={showSuccessToast}
				>
					Success Toast
				</button>
				
				<button
					type="button"
					class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
					on:click={showErrorToast}
				>
					Error Toast
				</button>
				
				<button
					type="button"
					class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
					on:click={showWarningToast}
				>
					Warning Toast
				</button>
				
				<button
					type="button"
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					on:click={showInfoToast}
				>
					Info Toast
				</button>
			</div>
		</div>
		
		<!-- Advanced Toast Features -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Advanced Features</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<button
					type="button"
					class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					on:click={showLoadingToast}
				>
					Loading Toast
				</button>
				
				<button
					type="button"
					class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
					on:click={showToastWithAction}
				>
					Toast with Action
				</button>
				
				<button
					type="button"
					class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
					on:click={showCustomToast}
				>
					Custom Duration
				</button>
			</div>
		</div>
		
		<!-- Toast Management -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Toast Management</h2>
			<div class="flex flex-wrap gap-4">
				<button
					type="button"
					class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					on:click={clearAllToasts}
				>
					Clear All Toasts
				</button>
			</div>
		</div>
		
		<!-- Usage Examples -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Usage Examples</h2>
			<div class="space-y-4 text-sm">
				<div>
					<h3 class="font-medium text-gray-900 mb-2">Basic Usage:</h3>
					<pre class="bg-gray-100 p-3 rounded-md overflow-x-auto"><code>{`import { toastHelpers } from '$lib/stores/toast';

// Simple success toast
toastHelpers.success('Operation completed!');

// Error toast (persistent by default)
toastHelpers.error('Something went wrong');

// Warning with custom duration
toastHelpers.warning('Warning message', { duration: 7000 });`}</code></pre>
				</div>
				
				<div>
					<h3 class="font-medium text-gray-900 mb-2">Advanced Usage:</h3>
					<pre class="bg-gray-100 p-3 rounded-md overflow-x-auto"><code>{`import { toastStore } from '$lib/stores/toast';

// Toast with action button
toastStore.add({
		type: 'info',
		title: 'Update Available',
		message: 'Click to update now.',
		action: {
				label: 'Update',
				handler: () => performUpdate()
		}
});`}</code></pre>
				</div>
			</div>
		</div>
	</div>
</AppLayout>