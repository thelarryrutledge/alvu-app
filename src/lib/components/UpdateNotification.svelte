<script lang="ts">
	import { onMount } from 'svelte'
	import { checkForUpdates, clearCacheAndReload } from '$lib/utils/cache-busting'

	let showUpdateNotification = false
	let isUpdating = false

	onMount(() => {
		// Check for updates when component mounts
		checkForUpdates().then(hasUpdate => {
			if (hasUpdate) {
				showUpdateNotification = true
			}
		})

		// Listen for service worker updates
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				showUpdateNotification = true
			})
		}
	})

	async function handleUpdate() {
		isUpdating = true
		await clearCacheAndReload()
	}

	function dismissNotification() {
		showUpdateNotification = false
	}
</script>

{#if showUpdateNotification}
	<div class="fixed bottom-4 right-4 z-50 max-w-sm bg-blue-600 text-white rounded-lg shadow-lg p-4">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h4 class="font-semibold text-sm">Update Available</h4>
				<p class="text-xs mt-1 opacity-90">
					A new version of the app is available. Refresh to get the latest features.
				</p>
			</div>
			<button
				type="button"
				class="ml-2 text-white hover:text-gray-200"
				on:click={dismissNotification}
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
				</svg>
			</button>
		</div>
		<div class="mt-3 flex gap-2">
			<button
				type="button"
				class="flex-1 bg-white text-blue-600 text-xs font-medium py-2 px-3 rounded hover:bg-gray-100 disabled:opacity-50"
				disabled={isUpdating}
				on:click={handleUpdate}
			>
				{#if isUpdating}
					Updating...
				{:else}
					Update Now
				{/if}
			</button>
			<button
				type="button"
				class="text-xs text-white opacity-75 hover:opacity-100 py-2 px-3"
				on:click={dismissNotification}
			>
				Later
			</button>
		</div>
	</div>
{/if}