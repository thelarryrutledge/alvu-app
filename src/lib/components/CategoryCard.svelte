<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import type { Category } from '$lib/types/database'
	
	export let category: Category
	
	const dispatch = createEventDispatcher<{
		edit: { category: Category }
		delete: { category: Category }
	}>()
	
	function handleEdit() {
		dispatch('edit', { category })
	}
	
	function handleDelete() {
		dispatch('delete', { category })
	}
	
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric' 
		})
	}
</script>

<!-- Enhanced Category Display Card -->
<div class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
	<!-- Card Header -->
	<div class="p-6 pb-4">
		<div class="flex items-start justify-between mb-4">
			<div class="flex items-center space-x-3 flex-1 min-w-0">
				<!-- Category Color -->
				<div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: {category.color}">
					{#if category.icon}
						<span class="text-white text-lg">{category.icon}</span>
					{:else}
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="font-semibold text-gray-900 text-lg truncate" title={category.name}>{category.name}</h3>
					<div class="flex items-center space-x-2 mt-1">
						<!-- Type Badge -->
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {category.is_default ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}">
							{category.is_default ? 'Default' : 'Custom'}
						</span>
						<!-- Sort Order Badge -->
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
							Order: {category.sort_order}
						</span>
					</div>
				</div>
			</div>
			<!-- Action Buttons -->
			<div class="flex items-center space-x-1 ml-2">
				<button
					on:click={handleEdit}
					class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
					title="Edit category"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
				</button>
				{#if !category.is_default}
					<button
						on:click={handleDelete}
						class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
						title="Delete category"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
		
		<!-- Description -->
		{#if category.description}
			<div class="mb-4">
				<p class="text-sm text-gray-600 leading-relaxed">{category.description}</p>
			</div>
		{/if}
	</div>
	
	<!-- Card Footer -->
	<div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
		<div class="flex items-center justify-between text-sm">
			<!-- Created Date -->
			<div class="flex items-center text-gray-600">
				<svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				<span class="font-medium">Created:</span>
				<span class="ml-1">{formatDate(category.created_at)}</span>
			</div>
			
			<!-- Status -->
			<div class="text-right">
				<div class="text-xs text-gray-500 mb-0.5">Status</div>
				<div class="font-semibold text-gray-700">
					{category.is_default ? 'System' : 'User Created'}
				</div>
			</div>
		</div>
	</div>
</div>