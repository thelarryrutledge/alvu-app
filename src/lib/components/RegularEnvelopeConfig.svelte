<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import FormInput from '$lib/components/FormInput.svelte'
	import FormSelect, { type SelectOption } from '$lib/components/FormSelect.svelte'
	import FormTextarea from '$lib/components/FormTextarea.svelte'
	import type { Category } from '$lib/types/database'
	
	const dispatch = createEventDispatcher<{
		change: {
			name: string
			categoryId: string
			balance: number
			description?: string
		}
		validate: {
			isValid: boolean
			errors: Record<string, string>
		}
	}>()
	
	// Props
	export let name = ''
	export let categoryId = ''
	export let balance = 0
	export let description = ''
	export let categories: Category[] = []
	export let existingEnvelopeNames: string[] = []
	export let errors: Record<string, string> = {}
	export let disabled = false
	
	// Validation functions
	function validateName(value: string): string[] {
		const validationErrors: string[] = []
		
		if (!value.trim()) {
			validationErrors.push('Envelope name is required')
			return validationErrors
		}
		
		if (value.trim().length < 2) {
			validationErrors.push('Envelope name must be at least 2 characters long')
		}
		
		if (value.trim().length > 100) {
			validationErrors.push('Envelope name must be 100 characters or less')
		}
		
		// Check for duplicate names (case-insensitive)
		const existingNames = existingEnvelopeNames.map(n => n.toLowerCase())
		if (existingNames.includes(value.trim().toLowerCase())) {
			validationErrors.push('An envelope with this name already exists')
		}
		
		// Check for reserved names
		const reservedNames = ['available', 'unallocated', 'total', 'balance']
		if (reservedNames.includes(value.trim().toLowerCase())) {
			validationErrors.push('This name is reserved and cannot be used')
		}
		
		return validationErrors
	}
	
	function validateBalance(value: number): string[] {
		const validationErrors: string[] = []
		
		if (value < 0) {
			validationErrors.push('Balance cannot be negative for regular envelopes')
		}
		
		if (value > 1000000) {
			validationErrors.push('Balance cannot exceed $1,000,000')
		}
		
		return validationErrors
	}
	
	function validateCategory(value: string): string[] {
		const validationErrors: string[] = []
		
		if (!value) {
			validationErrors.push('Please select a category')
		}
		
		// Verify category exists in the provided list
		if (value && !categories.find(cat => cat.id === value)) {
			validationErrors.push('Selected category is not valid')
		}
		
		return validationErrors
	}
	
	function validateDescription(value: string): string[] {
		const validationErrors: string[] = []
		
		if (value && value.length > 500) {
			validationErrors.push('Description must be 500 characters or less')
		}
		
		return validationErrors
	}
	
	// Comprehensive validation
	function validateAll(): { isValid: boolean; errors: Record<string, string> } {
		const validationErrors: Record<string, string> = {}
		
		// Validate name
		const nameErrors = validateName(name)
		if (nameErrors.length > 0) {
			validationErrors.name = nameErrors[0]
		}
		
		// Validate balance
		const balanceErrors = validateBalance(balance)
		if (balanceErrors.length > 0) {
			validationErrors.balance = balanceErrors[0]
		}
		
		// Validate category
		const categoryErrors = validateCategory(categoryId)
		if (categoryErrors.length > 0) {
			validationErrors.categoryId = categoryErrors[0]
		}
		
		// Validate description
		const descriptionErrors = validateDescription(description)
		if (descriptionErrors.length > 0) {
			validationErrors.description = descriptionErrors[0]
		}
		
		const isValid = Object.keys(validationErrors).length === 0
		
		return { isValid, errors: validationErrors }
	}
	
	// Handle input changes
	function handleChange() {
		// Emit change event with current values
		dispatch('change', {
			name: name.trim(),
			categoryId,
			balance,
			description: description.trim()
		})
		
		// Validate and emit validation results
		const validation = validateAll()
		dispatch('validate', validation)
	}
	
	// Auto-select "Unassigned" category if available
	function autoSelectUnassignedCategory() {
		if (!categoryId && categories.length > 0) {
			const unassignedCategory = categories.find(cat => 
				cat.name.toLowerCase() === 'unassigned' || cat.is_default
			)
			if (unassignedCategory) {
				categoryId = unassignedCategory.id
				handleChange()
			}
		}
	}
	
	// Format currency for display
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}
	
	// Generate suggestions for regular envelopes
	function getRegularEnvelopeSuggestions(): string[] {
		const suggestions: string[] = []
		
		if (balance > 10000) {
			suggestions.push('Consider splitting large amounts across multiple envelopes for better budget tracking.')
		}
		
		if (name.toLowerCase().includes('emergency') && balance < 1000) {
			suggestions.push('Financial experts recommend having 3-6 months of expenses in an emergency fund.')
		}
		
		if (name.toLowerCase().includes('vacation') || name.toLowerCase().includes('travel')) {
			suggestions.push('Consider setting a target date for your trip to help with planning.')
		}
		
		return suggestions
	}
	
	// Reactive category options
	$: categoryOptions = categories.map(cat => ({
		value: cat.id,
		label: cat.name
	}))
	
	// Reactive validation
	$: if (name || categoryId || balance !== undefined || description) {
		handleChange()
	}
	
	// Auto-select category when categories load
	$: if (categories.length > 0 && !categoryId) {
		autoSelectUnassignedCategory()
	}
	
	// Reactive suggestions
	$: suggestions = getRegularEnvelopeSuggestions()
</script>

<div class="regular-envelope-config space-y-6">
	<!-- Configuration Header -->
	<div class="border-b border-gray-200 pb-4">
		<h3 class="text-lg font-medium text-gray-900">Regular Envelope Configuration</h3>
		<p class="text-sm text-gray-600 mt-1">
			Configure a standard budget envelope for everyday expenses and financial goals
		</p>
	</div>
	
	<!-- Basic Settings -->
	<div class="space-y-4">
		<h4 class="text-md font-medium text-gray-900">Basic Settings</h4>
		
		<!-- Envelope Name -->
		<FormInput
			label="Envelope Name"
			bind:value={name}
			type="text"
			placeholder="e.g., Groceries, Entertainment, Emergency Fund"
			required={true}
			error={errors.name}
			hint="Choose a descriptive name that clearly identifies this envelope's purpose"
			maxlength={100}
			{disabled}
		/>
		
		<!-- Category Selection -->
		<FormSelect
			label="Category"
			bind:value={categoryId}
			options={categoryOptions}
			required={true}
			error={errors.categoryId}
			hint="Choose which category this envelope belongs to for organization"
			placeholder="Select a category"
			{disabled}
		/>
		
		<!-- Initial Balance -->
		<FormInput
			label="Initial Balance"
			bind:value={balance}
			type="number"
			step="0.01"
			min="0"
			max="1000000"
			required={true}
			error={errors.balance}
			hint="Enter the starting balance for this envelope (must be $0 or positive)"
			{disabled}
		/>
		
		<!-- Description (Optional) -->
		<FormTextarea
			label="Description (Optional)"
			bind:value={description}
			placeholder="Add notes about this envelope's purpose, spending rules, or goals..."
			error={errors.description}
			hint="Optional details to help you remember this envelope's purpose"
			maxlength={500}
			rows={3}
			{disabled}
		/>
	</div>
	
	<!-- Regular Envelope Features -->
	<div class="space-y-4">
		<h4 class="text-md font-medium text-gray-900">Regular Envelope Features</h4>
		
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<div class="flex items-start">
				<svg class="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div class="flex-1">
					<h5 class="text-sm font-medium text-blue-800">Regular Envelope Benefits</h5>
					<ul class="text-sm text-blue-700 mt-1 space-y-1">
						<li>• Simple balance tracking with positive amounts only</li>
						<li>• Perfect for everyday expenses and discretionary spending</li>
						<li>• Easy to allocate income and track spending</li>
						<li>• No complex calculations or target dates required</li>
						<li>• Ideal for categories like groceries, entertainment, and utilities</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Preview Section -->
	{#if name || balance > 0}
		<div class="space-y-4">
			<h4 class="text-md font-medium text-gray-900">Preview</h4>
			
			<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
				<div class="flex items-center justify-between">
					<div class="flex-1 min-w-0">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									Regular
								</span>
							</div>
							<div class="ml-4 flex-1 min-w-0">
								<h5 class="text-sm font-medium text-gray-900 truncate">
									{name || 'Envelope Name'}
								</h5>
								<div class="flex items-center mt-1 text-sm text-gray-500">
									<span>Balance: {formatCurrency(balance)}</span>
									{#if categoryId}
										<span class="mx-2">•</span>
										<span>
											{categories.find(cat => cat.id === categoryId)?.name || 'Category'}
										</span>
									{/if}
								</div>
								{#if description}
									<p class="text-xs text-gray-500 mt-1 truncate">{description}</p>
								{/if}
							</div>
						</div>
					</div>
					
					<div class="flex items-center space-x-2 ml-4">
						<div class="text-right">
							<p class="text-lg font-semibold text-gray-900">{formatCurrency(balance)}</p>
							<p class="text-xs text-gray-500">Available</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Suggestions -->
	{#if suggestions.length > 0}
		<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
			<div class="flex items-start">
				<svg class="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
				</svg>
				<div class="flex-1">
					<h5 class="text-sm font-medium text-amber-800">Helpful Tips</h5>
					<ul class="text-sm text-amber-700 mt-1 space-y-1">
						{#each suggestions as suggestion}
							<li>• {suggestion}</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	{/if}
</div>