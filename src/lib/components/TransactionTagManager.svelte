<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { supabase } from '$lib/utils/supabase'
	import { user } from '$lib/stores/auth'
	import { toastHelpers } from '$lib/stores/toast'
	import type { TransactionTag } from '$lib/types/database'
	
	export let selectedTags: TransactionTag[] = []
	export let availableTags: TransactionTag[] = []
	export let disabled = false
	
	const dispatch = createEventDispatcher<{
		tagsChanged: { tags: TransactionTag[] }
	}>()
	
	let showAddTag = false
	let newTagName = ''
	let newTagColor = '#6B7280'
	let loading = false
	let searchQuery = ''
	
	// Predefined tag colors
	const tagColors = [
		'#EF4444', // Red
		'#F97316', // Orange
		'#F59E0B', // Amber
		'#EAB308', // Yellow
		'#84CC16', // Lime
		'#22C55E', // Green
		'#10B981', // Emerald
		'#14B8A6', // Teal
		'#06B6D4', // Cyan
		'#0EA5E9', // Sky
		'#3B82F6', // Blue
		'#6366F1', // Indigo
		'#8B5CF6', // Violet
		'#A855F7', // Purple
		'#D946EF', // Fuchsia
		'#EC4899', // Pink
		'#F43F5E', // Rose
		'#6B7280'  // Gray
	]
	
	// Filter available tags based on search
	$: filteredTags = availableTags.filter(tag =>
		tag.name.toLowerCase().includes(searchQuery.toLowerCase())
	)
	
	// Check if a tag is selected
	function isTagSelected(tag: TransactionTag): boolean {
		return selectedTags.some(t => t.id === tag.id)
	}
	
	// Toggle tag selection
	function toggleTag(tag: TransactionTag) {
		if (disabled) return
		
		if (isTagSelected(tag)) {
			selectedTags = selectedTags.filter(t => t.id !== tag.id)
		} else {
			selectedTags = [...selectedTags, tag]
		}
		
		dispatch('tagsChanged', { tags: selectedTags })
	}
	
	// Create new tag
	async function createTag() {
		if (!$user || !newTagName.trim()) return
		
		loading = true
		
		try {
			const { data, error } = await supabase
				.from('transaction_tags')
				.insert({
					user_id: $user.id,
					name: newTagName.trim(),
					color: newTagColor
				})
				.select()
				.single()
			
			if (error) {
				console.error('Error creating tag:', error)
				toastHelpers.error('Failed to create tag')
				return
			}
			
			// Add to available tags
			availableTags = [...availableTags, data]
			
			// Auto-select the new tag
			selectedTags = [...selectedTags, data]
			dispatch('tagsChanged', { tags: selectedTags })
			
			// Reset form
			newTagName = ''
			newTagColor = '#6B7280'
			showAddTag = false
			
			toastHelpers.success('Tag created successfully')
		} catch (error) {
			console.error('Error creating tag:', error)
			toastHelpers.error('Failed to create tag')
		} finally {
			loading = false
		}
	}
	
	// Remove tag from selection
	function removeTag(tag: TransactionTag) {
		if (disabled) return
		selectedTags = selectedTags.filter(t => t.id !== tag.id)
		dispatch('tagsChanged', { tags: selectedTags })
	}
</script>

<div class="space-y-4">
	<!-- Selected Tags Display -->
	{#if selectedTags.length > 0}
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">Selected Tags</label>
			<div class="flex flex-wrap gap-2">
				{#each selectedTags as tag}
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
						style="background-color: {tag.color}"
					>
						{tag.name}
						{#if !disabled}
							<button
								type="button"
								on:click={() => removeTag(tag)}
								class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-white hover:bg-black hover:bg-opacity-20 focus:outline-none focus:bg-black focus:bg-opacity-20"
							>
								<svg class="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
									<path d="M1.41 0l-1.41 1.41.72.72 1.78 1.81-1.78 1.81-.72.72 1.41 1.41.72-.72 1.81-1.78 1.81 1.78.72.72 1.41-1.41-.72-.72-1.78-1.81 1.78-1.81.72-.72-1.41-1.41-.72.72-1.81 1.78-1.81-1.78-.72-.72z"/>
								</svg>
							</button>
						{/if}
					</span>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Tag Selection -->
	{#if !disabled}
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">Available Tags</label>
			
			<!-- Search Tags -->
			<div class="mb-3">
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input
						bind:value={searchQuery}
						type="text"
						placeholder="Search tags..."
						class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					/>
				</div>
			</div>
			
			<!-- Available Tags -->
			<div class="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
				{#if filteredTags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each filteredTags as tag}
							<button
								type="button"
								on:click={() => toggleTag(tag)}
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity duration-200 {isTagSelected(tag) ? 'text-white' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}"
								style={isTagSelected(tag) ? `background-color: ${tag.color}` : ''}
							>
								{tag.name}
								{#if tag.usage_count !== undefined && tag.usage_count > 0}
									<span class="ml-1 text-xs opacity-75">({tag.usage_count})</span>
								{/if}
							</button>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-500 text-center py-2">
						{searchQuery ? 'No tags match your search' : 'No tags available'}
					</p>
				{/if}
			</div>
			
			<!-- Add New Tag -->
			<div class="mt-3">
				{#if !showAddTag}
					<button
						type="button"
						on:click={() => showAddTag = true}
						class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Create New Tag
					</button>
				{:else}
					<div class="border border-gray-200 rounded-md p-3 bg-gray-50">
						<div class="space-y-3">
							<div>
								<label for="tag-name" class="block text-sm font-medium text-gray-700">Tag Name</label>
								<input
									id="tag-name"
									bind:value={newTagName}
									type="text"
									placeholder="Enter tag name..."
									maxlength="50"
									class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Tag Color</label>
								<div class="flex flex-wrap gap-2">
									{#each tagColors as color}
										<button
											type="button"
											on:click={() => newTagColor = color}
											class="w-6 h-6 rounded-full border-2 {newTagColor === color ? 'border-gray-900' : 'border-gray-300'} hover:border-gray-500 focus:outline-none focus:border-gray-900"
											style="background-color: {color}"
											title={color}
										></button>
									{/each}
								</div>
							</div>
							
							<div class="flex items-center space-x-2">
								<button
									type="button"
									on:click={createTag}
									disabled={loading || !newTagName.trim()}
									class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{#if loading}
										<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Creating...
									{:else}
										Create Tag
									{/if}
								</button>
								<button
									type="button"
									on:click={() => {
										showAddTag = false
										newTagName = ''
										newTagColor = '#6B7280'
									}}
									class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>