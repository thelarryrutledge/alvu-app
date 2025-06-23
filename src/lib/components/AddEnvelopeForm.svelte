<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { supabase } from '$lib/utils/supabase'
	import { user } from '$lib/stores/auth'
	import { toastHelpers } from '$lib/stores/toast'
	import FormInput from '$lib/components/FormInput.svelte'
	import FormSelect, { type SelectOption } from '$lib/components/FormSelect.svelte'
	import FormTextarea from '$lib/components/FormTextarea.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import type { Envelope, Category } from '$lib/types/database'
	
	const dispatch = createEventDispatcher<{
		success: { id: string; name: string }
		cancel: void
	}>()
	
	// Form state
	let name = ''
	let type: 'regular' | 'savings' | 'debt' = 'regular'
	let categoryId = ''
	let balance = 0
	let targetAmount: number | undefined = undefined
	let targetDate = ''
	let apr: number | undefined = undefined
	let minimumPayment: number | undefined = undefined
	let loading = false
	let categories: Category[] = []
	let existingEnvelopeNames: string[] = []
	
	// Validation state
	let errors: Record<string, string> = {}
	let suggestions: string[] = []
	
	// Envelope type options
	const typeOptions: SelectOption[] = [
		{
			value: 'regular',
			label: 'Regular Envelope'
		},
		{
			value: 'savings',
			label: 'Savings Goal'
		},
		{
			value: 'debt',
			label: 'Debt Tracking'
		}
	]
	
	// Type descriptions
	const typeDescriptions: Record<string, string> = {
		regular: 'Standard budget envelope for everyday expenses',
		savings: 'Save money towards a specific target amount and date',
		debt: 'Track debt balance with APR and minimum payments'
	}
	
	// Load categories and existing envelope names
	async function loadFormData() {
		if (!$user) return
		
		try {
			// Load categories
			const { data: categoriesData, error: categoriesError } = await supabase
				.from('categories')
				.select('*')
				.eq('user_id', $user.id)
				.order('sort_order', { ascending: true })
			
			if (categoriesError) {
				console.error('Error loading categories:', categoriesError)
				toastHelpers.error('Failed to load categories')
				return
			}
			
			categories = categoriesData || []
			
			// Auto-select appropriate category based on type
			if (categories.length > 0 && !categoryId) {
				autoSelectCategory()
			}
			
			// Load existing envelope names for validation
			const { data: envelopesData, error: envelopesError } = await supabase
				.from('envelopes')
				.select('name')
				.eq('user_id', $user.id)
			
			if (envelopesError) {
				console.error('Error loading envelopes:', envelopesError)
			} else {
				existingEnvelopeNames = (envelopesData || []).map(item => item.name)
			}
		} catch (error) {
			console.error('Error loading form data:', error)
			toastHelpers.error('Failed to load form data')
		}
	}
	
	// Auto-select category based on envelope type
	function autoSelectCategory() {
		if (categories.length === 0) return
		
		let targetCategoryName = ''
		switch (type) {
			case 'savings':
				targetCategoryName = 'Savings'
				break
			case 'debt':
				targetCategoryName = 'Debt'
				break
			default:
				targetCategoryName = 'Unassigned'
				break
		}
		
		const targetCategory = categories.find(cat => 
			cat.name.toLowerCase() === targetCategoryName.toLowerCase()
		)
		
		if (targetCategory) {
			categoryId = targetCategory.id
		} else if (categories.length > 0) {
			// Fallback to first category
			categoryId = categories[0].id
		}
	}
	
	// Validation functions
	function validateName(value: string): string[] {
		const errors: string[] = []
		
		if (!value.trim()) {
			errors.push('Envelope name is required')
			return errors
		}
		
		if (value.trim().length < 2) {
			errors.push('Envelope name must be at least 2 characters long')
		}
		
		if (value.trim().length > 100) {
			errors.push('Envelope name must be 100 characters or less')
		}
		
		// Check for duplicate names (case-insensitive)
		const existingNames = existingEnvelopeNames.map(name => name.toLowerCase())
		if (existingNames.includes(value.trim().toLowerCase())) {
			errors.push('An envelope with this name already exists')
		}
		
		return errors
	}
	
	function validateBalance(value: number, envelopeType: string): string[] {
		const errors: string[] = []
		
		if (envelopeType === 'debt') {
			if (value < 0) {
				errors.push('Remaining balance cannot be negative')
			}
		} else {
			if (value < 0) {
				errors.push('Balance cannot be negative for regular and savings envelopes')
			}
		}
		
		if (Math.abs(value) > 1000000) {
			errors.push('Balance cannot exceed $1,000,000')
		}
		
		return errors
	}
	
	function validateTargetAmount(value: number | undefined, envelopeType: string): string[] {
		const errors: string[] = []
		
		if (envelopeType === 'savings') {
			if (!value || value <= 0) {
				errors.push('Target amount is required for savings envelopes and must be greater than 0')
			} else if (value > 10000000) {
				errors.push('Target amount cannot exceed $10,000,000')
			}
		}
		
		return errors
	}
	
	function validateApr(value: number | undefined, envelopeType: string): string[] {
		const errors: string[] = []
		
		if (envelopeType === 'debt') {
			if (value === undefined || value < 0) {
				errors.push('APR is required for debt envelopes and must be 0 or greater')
			} else if (value > 100) {
				errors.push('APR cannot exceed 100%')
			}
		}
		
		return errors
	}
	
	function validateMinimumPayment(value: number | undefined, envelopeType: string): string[] {
		const errors: string[] = []
		
		if (envelopeType === 'debt' && value !== undefined) {
			if (value < 0) {
				errors.push('Minimum payment cannot be negative')
			} else if (value > 100000) {
				errors.push('Minimum payment cannot exceed $100,000')
			}
		}
		
		return errors
	}
	
	function validateTargetDate(value: string, envelopeType: string): string[] {
		const errors: string[] = []
		
		if (envelopeType === 'savings' && value) {
			const targetDate = new Date(value)
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			
			if (targetDate <= today) {
				errors.push('Target date must be in the future')
			}
			
			// Check if date is too far in the future (100 years)
			const maxDate = new Date()
			maxDate.setFullYear(maxDate.getFullYear() + 100)
			if (targetDate > maxDate) {
				errors.push('Target date cannot be more than 100 years in the future')
			}
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
		
		// Validate balance
		const balanceErrors = validateBalance(balance, type)
		if (balanceErrors.length > 0) {
			errors.balance = balanceErrors[0]
		}
		
		// Validate target amount
		const targetAmountErrors = validateTargetAmount(targetAmount, type)
		if (targetAmountErrors.length > 0) {
			errors.targetAmount = targetAmountErrors[0]
		}
		
		// Validate APR
		const aprErrors = validateApr(apr, type)
		if (aprErrors.length > 0) {
			errors.apr = aprErrors[0]
		}
		
		// Validate minimum payment
		const minimumPaymentErrors = validateMinimumPayment(minimumPayment, type)
		if (minimumPaymentErrors.length > 0) {
			errors.minimumPayment = minimumPaymentErrors[0]
		}
		
		// Validate target date
		const targetDateErrors = validateTargetDate(targetDate, type)
		if (targetDateErrors.length > 0) {
			errors.targetDate = targetDateErrors[0]
		}
		
		// Category validation
		if (!categoryId) {
			errors.categoryId = 'Please select a category'
		}
		
		// Generate suggestions
		generateSuggestions()
	}
	
	function generateSuggestions() {
		suggestions = []
		
		if (type === 'savings' && targetAmount && balance > targetAmount) {
			suggestions.push('Your current balance exceeds your target amount. Consider adjusting the target.')
		}
		
		if (type === 'debt' && apr && apr > 20) {
			suggestions.push('High APR detected. Consider prioritizing this debt for faster payoff.')
		}
		
		if (type === 'savings' && targetDate) {
			const target = new Date(targetDate)
			const today = new Date()
			const monthsToTarget = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth())
			
			if (targetAmount && monthsToTarget > 0) {
				const monthlyRequired = (targetAmount - balance) / monthsToTarget
				if (monthlyRequired > 0) {
					suggestions.push(`To reach your goal, save approximately $${monthlyRequired.toFixed(2)} per month.`)
				}
			}
		}
	}
	
	// Handle type change
	function handleTypeChange() {
		// Reset type-specific fields
		if (type !== 'savings') {
			targetAmount = undefined
			targetDate = ''
		}
		if (type !== 'debt') {
			apr = undefined
			minimumPayment = undefined
		}
		
		// Auto-select appropriate category
		autoSelectCategory()
		
		// Re-validate
		handleInputChange()
	}
	
	// Form submission
	async function handleSubmit() {
		if (!$user) {
			toastHelpers.error('You must be logged in to create an envelope')
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
			// Prepare envelope data based on type
			const envelopeData: any = {
				user_id: $user.id,
				category_id: categoryId,
				name: name.trim(),
				type: type,
				balance: type === 'debt' ? -Math.abs(balance) : balance
			}
			
			// Add type-specific fields
			if (type === 'savings') {
				envelopeData.target_amount = targetAmount
				envelopeData.target_date = targetDate || null
			} else if (type === 'debt') {
				envelopeData.apr = apr
				envelopeData.minimum_payment = minimumPayment
			}
			
			const { data, error } = await supabase
				.from('envelopes')
				.insert([envelopeData])
				.select()
				.single()
			
			if (error) {
				console.error('Error creating envelope:', error)
				if (error.code === '23505') {
					toastHelpers.error('An envelope with this name already exists')
				} else if (error.message.includes('Balance cannot be negative')) {
					toastHelpers.error('Balance cannot be negative for this envelope type')
				} else if (error.message.includes('Debt envelope balance cannot be positive')) {
					toastHelpers.error('Debt envelope balance cannot be positive')
				} else {
					toastHelpers.error('Failed to create envelope. Please try again.')
				}
			} else {
				toastHelpers.success(`Envelope "${data.name}" created successfully`)
				dispatch('success', { id: data.id, name: data.name })
				resetForm()
			}
		} catch (error) {
			console.error('Error creating envelope:', error)
			toastHelpers.error('Failed to create envelope. Please try again.')
		} finally {
			loading = false
		}
	}
	
	// Reset form
	function resetForm() {
		name = ''
		type = 'regular'
		categoryId = ''
		balance = 0
		targetAmount = undefined
		targetDate = ''
		apr = undefined
		minimumPayment = undefined
		errors = {}
		suggestions = []
		
		// Auto-select category for new type
		if (categories.length > 0) {
			autoSelectCategory()
		}
	}
	
	// Cancel handler
	function handleCancel() {
		resetForm()
		dispatch('cancel')
	}
	
	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}
	
	// Get type description
	function getTypeDescription(envelopeType: string): string {
		return typeDescriptions[envelopeType] || ''
	}
	
	// Load form data on mount
	onMount(() => {
		loadFormData()
	})
	
	// Reactive validation
	$: if (name || balance !== undefined || targetAmount !== undefined || apr !== undefined || minimumPayment !== undefined || targetDate || categoryId) {
		handleInputChange()
	}
	
	// Reactive type change
	$: if (type) {
		handleTypeChange()
	}
	
	// Reactive category options
	$: categoryOptions = categories.map(cat => ({
		value: cat.id,
		label: cat.name,
		description: cat.description || undefined
	}))
</script>

<div class="add-envelope-form">
	<form on:submit|preventDefault={handleSubmit} class="space-y-6" novalidate>
		<!-- Basic Information Section -->
		<div class="space-y-4">
			<div class="border-b border-gray-200 pb-4">
				<h3 class="text-lg font-medium text-gray-900">Basic Information</h3>
				<p class="text-sm text-gray-600 mt-1">Enter the basic details for your new envelope</p>
			</div>
			
			<!-- Envelope Name -->
			<FormInput
				label="Envelope Name"
				bind:value={name}
				type="text"
				placeholder="e.g., Emergency Fund, Vacation, Credit Card"
				required={true}
				error={errors.name}
				hint="Choose a descriptive name that clearly identifies this envelope"
				maxlength={100}
				pattern=""
			/>
			
			<!-- Envelope Type -->
			<FormSelect
				label="Envelope Type"
				bind:value={type}
				options={typeOptions}
				required={true}
				error={errors.type}
				hint={getTypeDescription(type)}
				placeholder="Select the type of envelope"
			/>
			
			<!-- Category -->
			<FormSelect
				label="Category"
				bind:value={categoryId}
				options={categoryOptions}
				required={true}
				error={errors.categoryId}
				hint="Choose which category this envelope belongs to"
				placeholder="Select a category"
			/>
			
			<!-- Initial Balance -->
			<FormInput
				label={type === 'debt' ? 'Remaining Balance Owed' : 'Initial Balance'}
				bind:value={balance}
				type="number"
				step="0.01"
				min="0"
				max="1000000"
				required={true}
				error={errors.balance}
				hint={type === 'debt' ? 'Enter how much you still owe on this debt (positive amount)' : 'Enter the starting balance for this envelope'}
			/>
		</div>
		
		<!-- Type-Specific Configuration -->
		{#if type === 'savings'}
			<div class="space-y-4">
				<div class="border-b border-gray-200 pb-4">
					<h3 class="text-lg font-medium text-gray-900">Savings Goal Configuration</h3>
					<p class="text-sm text-gray-600 mt-1">Set your savings target and timeline</p>
				</div>
				
				<!-- Target Amount -->
				<FormInput
					label="Target Amount"
					bind:value={targetAmount}
					type="number"
					step="0.01"
					min="0.01"
					max="10000000"
					required={true}
					error={errors.targetAmount}
					hint="How much do you want to save in this envelope?"
				/>
				
				<!-- Target Date -->
				<FormInput
					label="Target Date (Optional)"
					bind:value={targetDate}
					type="text"
					placeholder="YYYY-MM-DD"
					error={errors.targetDate}
					hint="When do you want to reach your savings goal? (Format: YYYY-MM-DD)"
				/>
			</div>
		{:else if type === 'debt'}
			<div class="space-y-4">
				<div class="border-b border-gray-200 pb-4">
					<h3 class="text-lg font-medium text-gray-900">Debt Configuration</h3>
					<p class="text-sm text-gray-600 mt-1">Enter debt details for tracking and payoff planning</p>
				</div>
				
				<!-- APR -->
				<FormInput
					label="Annual Percentage Rate (APR)"
					bind:value={apr}
					type="number"
					step="0.01"
					min="0"
					max="100"
					required={true}
					error={errors.apr}
					hint="Enter the interest rate for this debt (e.g., 18.5 for 18.5%)"
				/>
				
				<!-- Minimum Payment -->
				<FormInput
					label="Minimum Payment (Optional)"
					bind:value={minimumPayment}
					type="number"
					step="0.01"
					min="0"
					max="100000"
					error={errors.minimumPayment}
					hint="Enter the minimum monthly payment required"
				/>
			</div>
		{/if}
		
		<!-- Preview Section -->
		<div class="space-y-4">
			<div class="border-b border-gray-200 pb-4">
				<h3 class="text-lg font-medium text-gray-900">Preview</h3>
				<p class="text-sm text-gray-600 mt-1">See how your envelope will look</p>
			</div>
			
			<div class="bg-gray-50 rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div class="flex-1 min-w-0">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {type === 'regular' ? 'bg-blue-100 text-blue-800' : type === 'savings' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
									{type}
								</span>
							</div>
							<div class="ml-4 flex-1 min-w-0">
								<h4 class="text-sm font-medium text-gray-900 truncate">
									{name || 'Envelope Name'}
								</h4>
								<div class="flex items-center mt-1 text-sm text-gray-500">
									<span>Balance: {formatCurrency(type === 'debt' ? -Math.abs(balance) : balance)}</span>
									{#if type === 'savings' && targetAmount}
										<span class="mx-2">•</span>
										<span>Goal: {formatCurrency(targetAmount)}</span>
									{/if}
									{#if type === 'debt' && apr}
										<span class="mx-2">•</span>
										<span>APR: {apr}%</span>
									{/if}
								</div>
							</div>
						</div>
					</div>
					
					<!-- Progress Bar for Savings -->
					{#if type === 'savings' && targetAmount && targetAmount > 0}
						<div class="flex items-center space-x-2 ml-4">
							<div class="w-24 bg-gray-200 rounded-full h-2">
								<div
									class="bg-green-600 h-2 rounded-full transition-all duration-300"
									style="width: {Math.min(100, Math.max(0, (balance / targetAmount) * 100))}%"
								></div>
							</div>
							<span class="text-xs text-gray-600 w-10 text-right">
								{Math.round(Math.min(100, Math.max(0, (balance / targetAmount) * 100)))}%
							</span>
						</div>
					{/if}
					
					<!-- Progress Bar for Debt (reverse progress showing amount owed) -->
					{#if type === 'debt' && balance > 0}
						<div class="flex items-center space-x-2 ml-4">
							<div class="w-24 bg-red-200 rounded-full h-2">
								<div
									class="bg-red-600 h-2 rounded-full transition-all duration-300"
									style="width: 100%"
								></div>
							</div>
							<span class="text-xs text-gray-600 w-10 text-right">
								100%
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
		
		<!-- Validation Suggestions -->
		{#if suggestions.length > 0}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div class="flex items-start">
					<svg class="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-blue-800">Helpful Tips</h4>
						<ul class="text-sm text-blue-700 mt-1 space-y-1">
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
					disabled={loading || Object.keys(errors).length > 0 || !name.trim() || !categoryId}
					fullWidth={true}
				>
					{loading ? 'Creating Envelope...' : 'Create Envelope'}
				</LoadingButton>
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
	</form>
</div>