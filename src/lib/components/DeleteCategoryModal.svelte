<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { supabase } from '$lib/utils/supabase'
	import { user } from '$lib/stores/auth'
	import { toastHelpers } from '$lib/stores/toast'
	import FormSelect from '$lib/components/FormSelect.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import type { Category } from '$lib/types/database'
	
	export let category: Category
	export let availableCategories: Category[] = []
	
	const dispatch = createEventDispatcher<{
		success: { id: string; name: string }
		cancel: void
	}>()
	
	// State
	let loading = false
	let envelopesLoading = true
	let envelopes: any[] = []
	let selectedCategoryId = ''
	let errors: Record<string, string> = {}
	
	// Load envelopes that use this category
	async function loadEnvelopes() {
		if (!$user) return
		
		envelopesLoading = true
		
		try {
			const { data, error } = await supabase
				.from('envelopes')
				.select('id, name, type, balance')
				.eq('user_id', $user.id)
				.eq('category_id', category.id)
				.order('name')
			
			if (error) {
				console.error('Error fetching envelopes:', error)
				toastHelpers.error('Failed to load envelopes. Please try again.')
			} else {
				envelopes = data || []
			}
		} catch (error) {
			console.error('Error loading envelopes:', error)
			toastHelpers.error('Failed to load envelopes data. Please try again.')
		} finally {
			envelopesLoading = false
		}
	}
	
	// Validation
	function validateForm(): boolean {
		errors = {}
		
		if (envelopes.length > 0 && !selectedCategoryId) {
			errors.category = 'Please select a category to reassign envelopes to'
			return false
		}
		
		return true
	}
	
	// Handle form submission
	async function handleDelete() {
		if (!$user) {
			toastHelpers.error('You must be logged in to delete a category')
			return
		}
		
		if (!validateForm()) {
			toastHelpers.error('Please fix the validation errors before proceeding')
			return
		}
		
		loading = true
		
		try {
			// If there are envelopes, reassign them first
			if (envelopes.length > 0 && selectedCategoryId) {
				const { error: reassignError } = await supabase
					.from('envelopes')
					.update({ category_id: selectedCategoryId, updated_at: new Date().toISOString() })
					.eq('user_id', $user.id)
					.eq('category_id', category.id)
				
				if (reassignError) {
					console.error('Error reassigning envelopes:', reassignError)
					toastHelpers.error('Failed to reassign envelopes. Please try again.')
					return
				}
			}
			
			// Now delete the category
			const { error: deleteError } = await supabase
				.from('categories')
				.delete()
				.eq('id', category.id)
				.eq('user_id', $user.id) // Extra security check
			
			if (deleteError) {
				console.error('Error deleting category:', deleteError)
				toastHelpers.error('Failed to delete category. Please try again.')
			} else {
				const reassignedCategory = availableCategories.find(cat => cat.id === selectedCategoryId)
				const reassignMessage = envelopes.length > 0 
					? ` and ${envelopes.length} envelope${envelopes.length === 1 ? '' : 's'} reassigned to "${reassignedCategory?.name}"`
					: ''
				
				toastHelpers.success(`Category "${category.name}" deleted successfully${reassignMessage}`)
				dispatch('success', { id: category.id, name: category.name })
			}
		} catch (error) {
			console.error('Error deleting category:', error)
			toastHelpers.error('Failed to delete category. Please try again.')
		} finally {
			loading = false
		}
	}
	
	// Cancel handler
	function handleCancel() {
		dispatch('cancel')
	}
	
	// Load envelopes on mount
	import { onMount } from 'svelte'
	onMount(() => {
		loadEnvelopes()
	})
	
	// Reactive values
	$: categoryOptions = availableCategories
		.filter(cat => cat.id !== category.id) // Exclude the category being deleted
		.map(cat => ({
			value: cat.id,
			label: `${cat.name} ${cat.is_default ? '(Default)' : '(Custom)'}`
		}))
	
	$: canDelete = !envelopesLoading && (envelopes.length === 0 || selectedCategoryId)
</script>

<div class="delete-category-modal">
	<!-- Category Info Header -->
	<div class="bg-red-50 rounded-lg p-4 border border-red-200 mb-6">
		<div class="flex items-center space-x-3">
			<div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500">
				<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
			</div>
			<div class="flex-1 min-w-0">
				<h3 class="font-semibold text-red-900 truncate">Delete Category: {category.name}</h3>
				<p class="text-sm text-red-700 mt-1">This action cannot be undone</p>
			</div>
		</div>
	</div>

	<!-- Envelopes Check -->
	{#if envelopesLoading}
		<div class="mb-6">
			<div class="animate-pulse">
				<div class="h-4 bg-gray-200 rounded w-48 mb-2"></div>
				<div class="h-3 bg-gray-200 rounded w-32"></div>
			</div>
		</div>
	{:else if envelopes.length > 0}
		<!-- Envelope Reassignment Section -->
		<div class="mb-6">
			<div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
				<div class="flex items-start">
					<svg class="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-amber-800">Envelopes Need Reassignment</h4>
						<p class="text-sm text-amber-700 mt-1">
							This category is currently used by {envelopes.length} envelope{envelopes.length === 1 ? '' : 's'}. 
							You must reassign {envelopes.length === 1 ? 'it' : 'them'} to another category before deletion.
						</p>
					</div>
				</div>
			</div>

			<!-- Affected Envelopes List -->
			<div class="mb-4">
				<h4 class="text-sm font-medium text-gray-900 mb-2">Affected Envelopes ({envelopes.length})</h4>
				<div class="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
					<div class="space-y-2">
						{#each envelopes as envelope}
							<div class="flex items-center justify-between text-sm">
								<div class="flex items-center space-x-2">
									<div class="w-2 h-2 rounded-full {envelope.type === 'savings' ? 'bg-green-500' : envelope.type === 'debt' ? 'bg-red-500' : 'bg-blue-500'}"></div>
									<span class="font-medium">{envelope.name}</span>
									<span class="text-gray-500 capitalize">({envelope.type})</span>
								</div>
								<span class="font-mono text-xs {envelope.balance >= 0 ? 'text-green-600' : 'text-red-600'}">
									${Math.abs(envelope.balance).toFixed(2)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Category Selection -->
			<FormSelect
				label="Reassign Envelopes To"
				bind:value={selectedCategoryId}
				options={categoryOptions}
				placeholder="Select a category..."
				required={true}
				error={errors.category}
				hint="Choose which category these envelopes should be moved to"
			/>
		</div>
	{:else}
		<!-- No Envelopes -->
		<div class="mb-6">
			<div class="bg-green-50 border border-green-200 rounded-lg p-4">
				<div class="flex items-center">
					<svg class="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-green-800">Safe to Delete</h4>
						<p class="text-sm text-green-700 mt-1">
							This category is not currently used by any envelopes and can be safely deleted.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Warning Message -->
	<div class="mb-6">
		<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
			<h4 class="text-sm font-medium text-gray-900 mb-2">Before You Continue</h4>
			<ul class="text-sm text-gray-600 space-y-1">
				<li>• This action cannot be undone</li>
				<li>• The category will be permanently removed from your account</li>
				{#if envelopes.length > 0}
					<li>• All affected envelopes will be moved to the selected category</li>
					<li>• Envelope balances and settings will remain unchanged</li>
				{/if}
			</ul>
		</div>
	</div>

	<!-- Form Actions -->
	<div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
		<div class="flex-1 sm:flex-none">
			<button
				type="button"
				on:click={handleDelete}
				disabled={loading || !canDelete}
				class="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg border border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Deleting Category...
				{:else}
					Delete Category{envelopes.length > 0 ? ` & Reassign ${envelopes.length} Envelope${envelopes.length === 1 ? '' : 's'}` : ''}
				{/if}
			</button>
		</div>
		
		<button
			type="button"
			on:click={handleCancel}
			disabled={loading}
			class="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
		>
			Cancel
		</button>
	</div>
</div>