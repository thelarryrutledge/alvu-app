<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import FormInput from '$lib/components/FormInput.svelte'
	import FormSelect, { type SelectOption } from '$lib/components/FormSelect.svelte'
	import FormTextarea from '$lib/components/FormTextarea.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import { supabase } from '$lib/utils/supabase'
	import { user } from '$lib/stores/auth'
	import { toastHelpers } from '$lib/stores/toast'
	import type { IncomeFrequency } from '$lib/types/database'
	import {
		validateIncomeSourceForm,
		sanitizeIncomeSourceData,
		getValidationSuggestions,
		validateNameUniqueness,
		type IncomeSourceFormData,
		type ValidationResult
	} from '$lib/utils/incomeSourceValidation'
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		success: { id: string; name: string }
		cancel: void
	}>()
	
	// Form data
	let formData: IncomeSourceFormData = {
		name: '',
		amount: 0,
		frequency: '' as IncomeFrequency | '',
		custom_frequency_days: 30,
		description: '',
		is_active: true
	}
	
	// Form state
	let loading = false
	let errors: Record<string, string> = {}
	let validationResult: ValidationResult | null = null
	let suggestions: string[] = []
	let existingIncomeSourceNames: string[] = []
	
	// Frequency options
	const frequencyOptions: SelectOption[] = [
		{ value: 'weekly', label: 'Weekly' },
		{ value: 'bi-weekly', label: 'Bi-weekly (Every 2 weeks)' },
		{ value: 'semi-monthly', label: 'Semi-monthly (Twice a month)' },
		{ value: 'monthly', label: 'Monthly' },
		{ value: 'custom', label: 'Custom frequency' }
	]
	
	// Load existing income source names for uniqueness validation
	async function loadExistingIncomeSourceNames() {
		if (!$user) return
		
		try {
			const { data, error } = await supabase
				.from('income_sources')
				.select('name')
				.eq('user_id', $user.id)
			
			if (error) {
				console.error('Error fetching existing income source names:', error)
			} else {
				existingIncomeSourceNames = data?.map(item => item.name) || []
			}
		} catch (error) {
			console.error('Error loading existing income source names:', error)
		}
	}
	
	// Comprehensive validation using the validation utilities
	function validateForm(): boolean {
		// Sanitize the form data first
		const sanitizedData = sanitizeIncomeSourceData(formData)
		
		// Run comprehensive validation
		validationResult = validateIncomeSourceForm(sanitizedData)
		errors = { ...validationResult.errors }
		
		// Check name uniqueness
		const uniquenessError = validateNameUniqueness(
			sanitizedData.name,
			existingIncomeSourceNames
		)
		if (uniquenessError) {
			errors.name = uniquenessError
		}
		
		// Get validation suggestions
		suggestions = getValidationSuggestions(sanitizedData)
		
		// Update form data with sanitized values
		formData = sanitizedData
		
		return Object.keys(errors).length === 0
	}
	
	// Real-time validation on input changes
	function handleInputChange() {
		// Clear previous errors for real-time feedback
		if (Object.keys(errors).length > 0) {
			validateForm()
		}
		
		// Update suggestions
		suggestions = getValidationSuggestions(formData)
	}
	
	// Calculate next expected date based on frequency
	function calculateNextExpectedDate(): string | null {
		if (!formData.frequency) return null
		
		const now = new Date()
		let nextDate = new Date(now)
		
		switch (formData.frequency) {
			case 'weekly':
				nextDate.setDate(now.getDate() + 7)
				break
			case 'bi-weekly':
				nextDate.setDate(now.getDate() + 14)
				break
			case 'semi-monthly':
				// Next occurrence: 15th or last day of month
				const day = now.getDate()
				if (day < 15) {
					nextDate.setDate(15)
				} else {
					nextDate.setMonth(now.getMonth() + 1, 1)
					nextDate.setDate(0) // Last day of month
				}
				break
			case 'monthly':
				nextDate.setMonth(now.getMonth() + 1)
				break
			case 'custom':
				if (formData.custom_frequency_days) {
					nextDate.setDate(now.getDate() + formData.custom_frequency_days)
				}
				break
		}
		
		return nextDate.toISOString().split('T')[0] // Return YYYY-MM-DD format
	}
	
	// Submit form
	async function handleSubmit() {
		// Load existing names for uniqueness check
		await loadExistingIncomeSourceNames()
		
		if (!validateForm()) {
			toastHelpers.error('Please fix the errors below')
			return
		}
		
		if (!$user) {
			toastHelpers.error('You must be logged in to add an income source')
			return
		}
		
		loading = true
		
		try {
			const nextExpectedDate = calculateNextExpectedDate()
			
			// Use sanitized form data
			const sanitizedData = sanitizeIncomeSourceData(formData)
			
			const incomeSourceData = {
				user_id: $user.id,
				name: sanitizedData.name,
				amount: sanitizedData.amount,
				frequency: sanitizedData.frequency as IncomeFrequency,
				custom_frequency_days: sanitizedData.frequency === 'custom' ? sanitizedData.custom_frequency_days : null,
				description: sanitizedData.description || null,
				is_active: sanitizedData.is_active,
				next_expected_date: nextExpectedDate
			}
			
			const { data, error } = await supabase
				.from('income_sources')
				.insert([incomeSourceData])
				.select()
				.single()
			
			if (error) {
				console.error('Error creating income source:', error)
				
				// Handle specific database errors
				if (error.code === '23505') {
					errors.name = 'An income source with this name already exists'
					toastHelpers.error('An income source with this name already exists')
				} else {
					toastHelpers.error('Failed to create income source. Please try again.')
				}
				return
			}
			
			toastHelpers.success(`Income source "${sanitizedData.name}" created successfully!`)
			dispatch('success', { id: data.id, name: data.name })
			
			// Reset form
			formData = {
				name: '',
				amount: 0,
				frequency: '' as IncomeFrequency | '',
				custom_frequency_days: 30,
				description: '',
				is_active: true
			}
			errors = {}
			validationResult = null
			suggestions = []
			
		} catch (error) {
			console.error('Error creating income source:', error)
			toastHelpers.error('An unexpected error occurred. Please try again.')
		} finally {
			loading = false
		}
	}
	
	// Cancel form
	function handleCancel() {
		dispatch('cancel')
	}
	
	// Format frequency description
	function getFrequencyDescription(frequency: IncomeFrequency | '', customDays?: number): string {
		switch (frequency) {
			case 'weekly':
				return 'Every 7 days'
			case 'bi-weekly':
				return 'Every 14 days (26 times per year)'
			case 'semi-monthly':
				return 'Twice per month (24 times per year)'
			case 'monthly':
				return 'Every 30-31 days (12 times per year)'
			case 'custom':
				return customDays ? `Every ${customDays} day${customDays === 1 ? '' : 's'}` : 'Custom interval'
			default:
				return ''
		}
	}
	
	// Calculate estimated annual income
	function calculateAnnualEstimate(): number {
		if (!formData.amount || !formData.frequency) return 0
		
		switch (formData.frequency) {
			case 'weekly':
				return formData.amount * 52
			case 'bi-weekly':
				return formData.amount * 26
			case 'semi-monthly':
				return formData.amount * 24
			case 'monthly':
				return formData.amount * 12
			case 'custom':
				if (formData.custom_frequency_days) {
					return formData.amount * (365 / formData.custom_frequency_days)
				}
				return 0
			default:
				return 0
		}
	}
	
	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}
	
	// Load existing income source names on component mount
	onMount(() => {
		loadExistingIncomeSourceNames()
	})
	
	// Reactive values
	$: frequencyDescription = getFrequencyDescription(formData.frequency, formData.custom_frequency_days)
	$: annualEstimate = calculateAnnualEstimate()
	$: showCustomFrequency = formData.frequency === 'custom'
</script>

<div class="add-income-source-form">
	<form on:submit|preventDefault={handleSubmit} class="space-y-6" novalidate>
		<!-- Form Header -->
		<div class="border-b border-gray-200 pb-4">
			<h3 class="text-lg font-medium text-gray-900">Add Income Source</h3>
			<p class="text-sm text-gray-600 mt-1">
				Create a new income source to track your earnings and payment schedule.
			</p>
		</div>
		
		<!-- Basic Information -->
		<div class="space-y-4">
			<h4 class="text-md font-medium text-gray-900">Basic Information</h4>
			
			<!-- Name -->
			<FormInput
				id="income-name"
				name="name"
				type="text"
				label="Income Source Name"
				placeholder="e.g., Main Job, Freelance Work, Side Hustle"
				bind:value={formData.name}
				on:input={handleInputChange}
				error={errors.name}
				required
				maxlength={100}
				hint="Give your income source a descriptive name"
				pattern=""
			/>
			
			<!-- Amount -->
			<FormInput
				id="income-amount"
				name="amount"
				type="number"
				label="Amount per Payment"
				placeholder="0.00"
				bind:value={formData.amount}
				on:input={handleInputChange}
				error={errors.amount}
				required
				min="0.01"
				max="1000000"
				step="0.01"
				hint="Enter the amount you receive each time"
			/>
		</div>
		
		<!-- Payment Schedule -->
		<div class="space-y-4">
			<h4 class="text-md font-medium text-gray-900">Payment Schedule</h4>
			
			<!-- Frequency -->
			<FormSelect
				id="income-frequency"
				name="frequency"
				label="Payment Frequency"
				placeholder="Select how often you receive this income"
				bind:value={formData.frequency}
				on:change={handleInputChange}
				options={frequencyOptions}
				error={errors.frequency}
				required
				hint={frequencyDescription}
			/>
			
			<!-- Custom Frequency Days (conditional) -->
			{#if showCustomFrequency}
				<FormInput
					id="custom-frequency-days"
					name="custom_frequency_days"
					type="number"
					label="Custom Frequency (Days)"
					placeholder="30"
					bind:value={formData.custom_frequency_days}
					on:input={handleInputChange}
					error={errors.custom_frequency_days}
					required
					min="1"
					max="365"
					step="1"
					hint="How many days between each payment?"
				/>
			{/if}
		</div>
		
		<!-- Additional Details -->
		<div class="space-y-4">
			<h4 class="text-md font-medium text-gray-900">Additional Details</h4>
			
			<!-- Description -->
			<FormTextarea
				id="income-description"
				name="description"
				label="Description (Optional)"
				placeholder="Add any additional notes about this income source..."
				bind:value={formData.description}
				on:input={handleInputChange}
				error={errors.description}
				maxlength={500}
				rows={3}
				hint="Optional details about this income source"
			/>
			
			<!-- Active Status -->
			<div class="flex items-center space-x-3">
				<input
					id="income-active"
					name="is_active"
					type="checkbox"
					bind:checked={formData.is_active}
					class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
				/>
				<label for="income-active" class="text-sm font-medium text-gray-700">
					Active income source
				</label>
			</div>
			<p class="text-sm text-gray-500 ml-7">
				Active sources are included in monthly estimates and payment schedules
			</p>
		</div>
		
		<!-- Validation Suggestions -->
		{#if suggestions.length > 0}
			<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
				<h5 class="text-sm font-medium text-amber-900 mb-2">💡 Suggestions</h5>
				<ul class="text-sm text-amber-700 space-y-1">
					{#each suggestions as suggestion}
						<li class="flex items-start">
							<span class="text-amber-500 mr-2">•</span>
							{suggestion}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		
		<!-- Income Estimate -->
		{#if formData.amount && formData.frequency && annualEstimate > 0}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h5 class="text-sm font-medium text-blue-900 mb-2">Income Estimate</h5>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-blue-700">Monthly:</span>
						<span class="font-medium text-blue-900 ml-2">
							{formatCurrency(annualEstimate / 12)}
						</span>
					</div>
					<div>
						<span class="text-blue-700">Annual:</span>
						<span class="font-medium text-blue-900 ml-2">
							{formatCurrency(annualEstimate)}
						</span>
					</div>
				</div>
				<p class="text-xs text-blue-600 mt-2">
					*Estimates based on {frequencyDescription.toLowerCase()}
				</p>
			</div>
		{/if}
		
		<!-- Form Actions -->
		<div class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
			<button
				type="button"
				on:click={handleCancel}
				disabled={loading}
				class="w-full sm:w-auto px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
			>
				Cancel
			</button>
			<LoadingButton
				type="submit"
				{loading}
				disabled={loading}
				variant="primary"
				size="md"
				fullWidth={false}
				loadingText="Creating..."
			>
				Create Income Source
			</LoadingButton>
		</div>
	</form>
</div>