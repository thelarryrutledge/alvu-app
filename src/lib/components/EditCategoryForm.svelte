<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { supabase } from '$lib/utils/supabase'
	import { user } from '$lib/stores/auth'
	import { toastHelpers } from '$lib/stores/toast'
	import FormInput from '$lib/components/FormInput.svelte'
	import FormTextarea from '$lib/components/FormTextarea.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import type { Category } from '$lib/types/database'
	
	export let category: Category
	
	const dispatch = createEventDispatcher<{
		success: { id: string; name: string }
		cancel: void
	}>()
	
	// Form state - initialize with category data
	let name = category.name
	let description = category.description || ''
	let color = category.color
	let icon = category.icon || ''
	let loading = false
	let existingCategoryNames: string[] = []
	
	// Validation state
	let errors: Record<string, string> = {}
	let suggestions: string[] = []
	
	// Predefined color options
	const colorOptions = [
		{ name: 'Gray', value: '#6B7280' },
		{ name: 'Red', value: '#EF4444' },
		{ name: 'Orange', value: '#F97316' },
		{ name: 'Amber', value: '#F59E0B' },
		{ name: 'Yellow', value: '#EAB308' },
		{ name: 'Lime', value: '#84CC16' },
		{ name: 'Green', value: '#10B981' },
		{ name: 'Emerald', value: '#059669' },
		{ name: 'Teal', value: '#14B8A6' },
		{ name: 'Cyan', value: '#06B6D4' },
		{ name: 'Sky', value: '#0EA5E9' },
		{ name: 'Blue', value: '#3B82F6' },
		{ name: 'Indigo', value: '#6366F1' },
		{ name: 'Violet', value: '#8B5CF6' },
		{ name: 'Purple', value: '#A855F7' },
		{ name: 'Fuchsia', value: '#D946EF' },
		{ name: 'Pink', value: '#EC4899' },
		{ name: 'Rose', value: '#F43F5E' }
	]
	
	// Load existing categories for validation
	async function loadExistingCategories() {
		if (!$user) return
		
		try {
			const { data, error } = await supabase
				.from('categories')
				.select('name')
				.eq('user_id', $user.id)
			
			if (error) {
				console.error('Error loading categories:', error)
			} else {
				// Only store the names for validation
				existingCategoryNames = (data || []).map(item => item.name)
			}
		} catch (error) {
			console.error('Error loading categories:', error)
		}
	}
	
	// Validation functions
	function validateName(value: string): string[] {
		const errors: string[] = []
		const suggestions: string[] = []
		
		// Required field
		if (!value.trim()) {
			errors.push('Category name is required')
			return errors
		}
		
		// Length validation
		if (value.trim().length < 2) {
			errors.push('Category name must be at least 2 characters long')
		}
		
		if (value.trim().length > 50) {
			errors.push('Category name must be 50 characters or less')
		}
		
		// Check for duplicate names (case-insensitive) - exclude current category
		const existingNames = existingCategoryNames
			.filter(existingName => existingName !== category.name) // Exclude current category
			.map(name => name.toLowerCase())
		if (existingNames.includes(value.trim().toLowerCase())) {
			errors.push('A category with this name already exists')
		}
		
		// Reserved names check - but allow if it's the current category name
		const reservedNames = ['unassigned', 'savings', 'debt', 'default', 'category']
		if (reservedNames.includes(value.trim().toLowerCase()) && value.trim().toLowerCase() !== category.name.toLowerCase()) {
			errors.push('This name is reserved and cannot be used')
			suggestions.push('Try adding a descriptive word like "Personal Savings" or "Monthly Debt"')
		}
		
		// Generic pattern detection
		const genericPatterns = /^(category|cat|group|type)\s*\d*$/i
		if (genericPatterns.test(value.trim())) {
			suggestions.push('Consider using a more descriptive name like "Entertainment" or "Utilities"')
		}
		
		return errors
	}
	
	function validateDescription(value: string): string[] {
		const errors: string[] = []
		
		if (value && value.length > 255) {
			errors.push('Description must be 255 characters or less')
		}
		
		return errors
	}
	
	function validateColor(value: string): string[] {
		const errors: string[] = []
		
		// Color format validation (hex color)
		const colorRegex = /^#[0-9A-Fa-f]{6}$/
		if (!colorRegex.test(value)) {
			errors.push('Color must be a valid hex color (e.g., #FF0000)')
		}
		
		return errors
	}
	
	// Real-time validation
	function handleInputChange() {
		errors = {}
		suggestions = []
		
		// Validate name
		const nameErrors = validateName(name)
		if (nameErrors.length > 0) {
			errors.name = nameErrors[0]
		}
		
		// Validate description
		const descriptionErrors = validateDescription(description)
		if (descriptionErrors.length > 0) {
			errors.description = descriptionErrors[0]
		}
		
		// Validate color
		const colorErrors = validateColor(color)
		if (colorErrors.length > 0) {
			errors.color = colorErrors[0]
		}
		
		// Add suggestions for name
		if (name.trim()) {
			const nameValidation = validateName(name)
			// Get suggestions from validation (this is a simplified approach)
			if (name.trim().toLowerCase().includes('category')) {
				suggestions.push('Consider removing "category" from the name for brevity')
			}
		}
	}
	
	// Check if form has changes
	function hasChanges(): boolean {
		return (
			name.trim() !== category.name ||
			description.trim() !== (category.description || '') ||
			color !== category.color ||
			icon.trim() !== (category.icon || '')
		)
	}
	
	// Form submission
	async function handleSubmit() {
		if (!$user) {
			toastHelpers.error('You must be logged in to edit a category')
			return
		}
		
		// Check if there are any changes
		if (!hasChanges()) {
			toastHelpers.info('No changes were made to the category')
			dispatch('cancel')
			return
		}
		
		// Final validation
		handleInputChange()
		if (Object.keys(errors).length > 0) {
			toastHelpers.error('Please fix the validation errors before submitting')
			return
		}
		
		loading = true
		
		try {
			// Sanitize input data
			const sanitizedData = {
				name: name.trim(),
				description: description.trim() || null,
				color: color.trim(),
				icon: icon.trim() || null,
				updated_at: new Date().toISOString()
			}
			
			const { data, error } = await supabase
				.from('categories')
				.update(sanitizedData)
				.eq('id', category.id)
				.eq('user_id', $user.id) // Extra security check
				.select()
				.single()
			
			if (error) {
				console.error('Error updating category:', error)
				if (error.code === '23505') {
					toastHelpers.error('A category with this name already exists')
				} else {
					toastHelpers.error('Failed to update category. Please try again.')
				}
			} else {
				toastHelpers.success(`Category "${data.name}" updated successfully`)
				dispatch('success', { id: data.id, name: data.name })
			}
		} catch (error) {
			console.error('Error updating category:', error)
			toastHelpers.error('Failed to update category. Please try again.')
		} finally {
			loading = false
		}
	}
	
	// Reset form to original values
	function resetForm() {
		name = category.name
		description = category.description || ''
		color = category.color
		icon = category.icon || ''
		errors = {}
		suggestions = []
	}
	
	// Cancel handler
	function handleCancel() {
		if (hasChanges()) {
			// Could add a confirmation dialog here
			const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?')
			if (!confirmed) return
		}
		resetForm()
		dispatch('cancel')
	}
	
	// Load existing categories on mount
	import { onMount } from 'svelte'
	onMount(() => {
		loadExistingCategories()
	})
	
	// Reactive validation
	$: if (name || description || color) {
		handleInputChange()
	}
	
	// Reactive change detection
	$: formHasChanges = hasChanges()
</script>

<div class="edit-category-form">
	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
		<!-- Category Info Header -->
		<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: {category.color}">
					{#if category.icon}
						<span class="text-white text-lg">{category.icon}</span>
					{:else}
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="font-semibold text-gray-900 truncate">Editing: {category.name}</h3>
					<div class="flex items-center space-x-2 mt-1">
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {category.is_default ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}">
							{category.is_default ? 'Default' : 'Custom'}
						</span>
						{#if category.is_default}
							<span class="text-xs text-gray-500">(Limited editing)</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Basic Information Section -->
		<div class="space-y-4">
			<div class="border-b border-gray-200 pb-4">
				<h3 class="text-lg font-medium text-gray-900">Basic Information</h3>
				<p class="text-sm text-gray-600 mt-1">Update the basic details for your category</p>
			</div>
			
			<!-- Category Name -->
			<FormInput
				label="Category Name"
				bind:value={name}
				type="text"
				placeholder="e.g., Entertainment, Utilities, Transportation"
				required={true}
				error={errors.name}
				hint={category.is_default ? "Default category names should be descriptive but not changed drastically" : "Choose a descriptive name that clearly identifies this category"}
				maxlength={50}
				disabled={category.is_default && ['Unassigned', 'Savings', 'Debt'].includes(category.name)}
			/>
			
			<!-- Description -->
			<FormTextarea
				label="Description"
				bind:value={description}
				placeholder="Optional description of what this category is for..."
				error={errors.description}
				hint="Provide additional context about when to use this category"
				maxlength={255}
				rows={3}
			/>
		</div>
		
		<!-- Appearance Section -->
		<div class="space-y-4">
			<div class="border-b border-gray-200 pb-4">
				<h3 class="text-lg font-medium text-gray-900">Appearance</h3>
				<p class="text-sm text-gray-600 mt-1">Customize how your category looks</p>
			</div>
			
			<!-- Color Selection -->
			<div class="space-y-2">
				<label class="block text-sm font-medium text-gray-700">Color</label>
				<div class="grid grid-cols-6 sm:grid-cols-9 gap-2">
					{#each colorOptions as colorOption}
						<button
							type="button"
							on:click={() => color = colorOption.value}
							class="w-8 h-8 rounded-lg border-2 transition-all duration-200 {color === colorOption.value ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-400'}"
							style="background-color: {colorOption.value}"
							title={colorOption.name}
						>
							{#if color === colorOption.value}
								<svg class="w-4 h-4 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							{/if}
						</button>
					{/each}
				</div>
				{#if errors.color}
					<p class="text-sm text-red-600">{errors.color}</p>
				{/if}
				<p class="text-xs text-gray-500">Selected color: {color}</p>
			</div>
			
			<!-- Icon (Optional) -->
			<FormInput
				label="Icon (Optional)"
				bind:value={icon}
				type="text"
				placeholder="e.g., 🎬, 💡, 🚗 (emoji or icon class)"
				error={errors.icon}
				hint="Add an emoji or icon to make your category more recognizable"
				maxlength={10}
			/>
		</div>
		
		<!-- Preview Section -->
		<div class="space-y-4">
			<div class="border-b border-gray-200 pb-4">
				<h3 class="text-lg font-medium text-gray-900">Preview</h3>
				<p class="text-sm text-gray-600 mt-1">See how your updated category will look</p>
			</div>
			
			<div class="bg-gray-50 rounded-lg p-4">
				<div class="flex items-center space-x-3">
					<div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: {color}">
						{#if icon}
							<span class="text-white text-lg">{icon}</span>
						{:else}
							<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
							</svg>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<h4 class="font-semibold text-gray-900 text-lg truncate">
							{name || 'Category Name'}
						</h4>
						<div class="flex items-center space-x-2 mt-1">
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {category.is_default ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}">
								{category.is_default ? 'Default' : 'Custom'}
							</span>
							{#if formHasChanges}
								<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									Modified
								</span>
							{/if}
						</div>
						{#if description}
							<p class="text-sm text-gray-600 mt-2">{description}</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
		
		<!-- Changes Summary -->
		{#if formHasChanges}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div class="flex items-start">
					<svg class="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-blue-800">Changes Detected</h4>
						<div class="text-sm text-blue-700 mt-1">
							<ul class="space-y-1">
								{#if name.trim() !== category.name}
									<li>• Name: "{category.name}" → "{name.trim()}"</li>
								{/if}
								{#if description.trim() !== (category.description || '')}
									<li>• Description: "{category.description || 'None'}" → "{description.trim() || 'None'}"</li>
								{/if}
								{#if color !== category.color}
									<li>• Color: {category.color} → {color}</li>
								{/if}
								{#if icon.trim() !== (category.icon || '')}
									<li>• Icon: "{category.icon || 'None'}" → "{icon.trim() || 'None'}"</li>
								{/if}
							</ul>
						</div>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Validation Suggestions -->
		{#if suggestions.length > 0}
			<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
				<div class="flex items-start">
					<svg class="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-amber-800">Suggestions</h4>
						<ul class="text-sm text-amber-700 mt-1 space-y-1">
							{#each suggestions as suggestion}
								<li>• {suggestion}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Form Actions -->
		<div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
			<div class="flex-1 sm:flex-none">
				<LoadingButton
					type="submit"
					variant="primary"
					size="md"
					{loading}
					disabled={loading || Object.keys(errors).length > 0 || !name.trim() || !formHasChanges}
					fullWidth={true}
				>
					{loading ? 'Updating Category...' : 'Update Category'}
				</LoadingButton>
			</div>
			
			<button
				type="button"
				on:click={resetForm}
				disabled={loading || !formHasChanges}
				class="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
			>
				Reset
			</button>
			
			<button
				type="button"
				on:click={handleCancel}
				disabled={loading}
				class="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
			>
				Cancel
			</button>
		</div>
	</form>
</div>