<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	
	const dispatch = createEventDispatcher<{
		addCategory: void
	}>()
	
	function handleAddCategory() {
		dispatch('addCategory')
	}
</script>

<div class="new-user-onboarding">
	<div class="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl shadow-lg mb-8">
		<div class="p-8 text-center">
			<div class="mx-auto w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
				<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
				</svg>
			</div>
			<h2 class="text-3xl font-bold text-blue-900 mb-4">Set Up Your Categories</h2>
			<p class="text-lg text-blue-700 mb-6 max-w-2xl mx-auto">
				Categories help you organize your envelopes into meaningful groups. You'll start with three default categories, and you can add custom ones as needed.
			</p>
			<button
				on:click={handleAddCategory}
				class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg shadow-sm transition-colors duration-200"
			>
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Add Your First Custom Category
			</button>
		</div>
	</div>

	<!-- Default Categories Info -->
	<div class="bg-white rounded-lg shadow-lg">
		<div class="p-6 border-b border-gray-200">
			<h3 class="text-xl font-semibold text-gray-900">Default Categories</h3>
			<p class="text-sm text-gray-600 mt-1">These categories are automatically created for every user</p>
		</div>
		<div class="p-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="text-center">
					<div class="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center mx-auto mb-3">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
					</div>
					<h4 class="font-medium text-gray-900 mb-2">Unassigned</h4>
					<p class="text-sm text-gray-600">Default category for envelopes that don't fit elsewhere</p>
				</div>
				<div class="text-center">
					<div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
						</svg>
					</div>
					<h4 class="font-medium text-gray-900 mb-2">Savings</h4>
					<p class="text-sm text-gray-600">Category for savings goals and emergency funds</p>
				</div>
				<div class="text-center">
					<div class="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-3">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h4 class="font-medium text-gray-900 mb-2">Debt</h4>
					<p class="text-sm text-gray-600">Category for debt payments and loan management</p>
				</div>
			</div>
		</div>
	</div>
</div>