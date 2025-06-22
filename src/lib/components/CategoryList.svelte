<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import CategoryCard from './CategoryCard.svelte'
	import type { Category } from '$lib/types/database'
	
	export let categories: Category[]
	export let loading = false
	export let hasActiveFilters = false
	
	const dispatch = createEventDispatcher<{
		edit: { category: Category }
		delete: { category: Category }
		addCategory: void
		clearFilters: void
	}>()
	
	function handleEdit(event: CustomEvent<{ category: Category }>) {
		dispatch('edit', event.detail)
	}
	
	function handleDelete(event: CustomEvent<{ category: Category }>) {
		dispatch('delete', event.detail)
	}
	
	function handleAddCategory() {
		dispatch('addCategory')
	}
</script>

{#if loading}
	<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
		{#each Array(6) as _}
			<div class="bg-white rounded-lg shadow p-6">
				<div class="animate-pulse">
					<div class="flex items-center justify-between mb-4">
						<div class="h-5 bg-gray-200 rounded w-32"></div>
						<div class="h-4 bg-gray-200 rounded w-16"></div>
					</div>
					<div class="space-y-3">
						<div class="h-4 bg-gray-200 rounded w-40"></div>
						<div class="h-4 bg-gray-200 rounded w-28"></div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else if categories.length > 0}
	<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
		{#each categories as category}
			<CategoryCard 
				{category} 
				on:edit={handleEdit}
				on:delete={handleDelete}
			/>
		{/each}
	</div>
{:else}
	<!-- No Results Found State -->
	<div class="bg-white rounded-lg shadow p-8 text-center">
		<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
		<h3 class="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
		<p class="text-gray-500 mb-4">
			{#if hasActiveFilters}
				No categories match your current filters. Try adjusting your search or filter criteria.
			{:else}
				Your search didn't return any results.
			{/if}
		</p>
		<div class="flex flex-col sm:flex-row gap-3 justify-center">
			{#if hasActiveFilters}
				<button
					on:click={() => dispatch('clearFilters')}
					class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					Clear Filters
				</button>
			{/if}
			<button
				on:click={handleAddCategory}
				class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Add Category
			</button>
		</div>
	</div>
{/if}