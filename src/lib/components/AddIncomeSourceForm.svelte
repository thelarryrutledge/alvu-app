<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import FormInput from '$lib/components/FormInput.svelte'
	import FormSelect, { type SelectOption } from '$lib/components/FormSelect.svelte'
	import FormTextarea from '$lib/components/FormTextarea.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import { supabase } from '$lib/utils/supabase'
	import { user } from '$lib/stores/auth'
	import { toastHelpers } from '$lib/stores/toast'
	import type { IncomeFrequency } from '$lib/types/database'
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		success: { id: string; name: string }
		cancel: void
	}>()
	
	// Form data
	let formData = {
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
	
	// Frequency options
	const frequencyOptions: SelectOption[] = [
		{ value: 'weekly', label: 'Weekly' },
		{ value: 'bi-weekly', label: 'Bi-weekly (Every 2 weeks)' },
		{ value: 'semi-monthly', label: 'Semi-monthly (Twice a month)' },
		{ value: 'monthly', label: 'Monthly' },
		{ value: 'custom', label: 'Custom frequency' }
	]
	
	// Validation functions
	function validateForm(): boolean {
		errors = {}
		
		// Name validation
		if (!formData.name.trim()) {
			errors.name = 'Income source name is required'
		} else if (formData.name.trim().length < 2) {
			errors.name = 'Name must be at least 2 characters long'
		} else if (formData.name.trim().length > 100) {
			errors.name = 'Name must be less than 100 characters'
		}
		
		// Amount validation
		if (!formData.amount || formData.amount <= 0) {
			errors.amount = 'Amount must be greater than 0'
		} else if (formData.amount > 1000000) {
			errors.amount = 'Amount must be less than $1,000,000'
		}
		
		// Frequency validation
		if (!formData.frequency) {
			errors.frequency = 'Please select a frequency'
		}
		
		// Custom frequency validation
		if (formData.frequency === 'custom') {
			if (!formData.custom_frequency_days || formData.custom_frequency_days < 1) {
				errors.custom_frequency_days = 'Custom frequency must be at least 1 day'
			} else if (formData.custom_frequency_days > 365) {
				errors.custom_frequency_days = 'Custom frequency must be less than 365 days'
			}
		}
		
		// Description validation (optional but with limits)
		if (formData.description && formData.description.length > 500) {
			errors.description = 'Description must be less than 500 characters'
		}
		
		return Object.keys(errors).length === 0
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
			
			const incomeSourceData = {
				user_id: $user.id,
				name: formData.name.trim(),
				amount: formData.amount,
				frequency: formData.frequency as IncomeFrequency,
				custom_frequency_days: formData.frequency === 'custom' ? formData.custom_frequency_days : null,
				description: formData.description.trim() || null,
				is_active: formData.is_active,
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
					toastHelpers.error('An income source with this name already exists')
				} else {
					toastHelpers.error('Failed to create income source. Please try again.')
				}
				return
			}
			
			toastHelpers.success(`Income source "${formData.name}" created successfully!`)
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
	
	// Reactive values
	$: frequencyDescription = getFrequencyDescription(formData.frequency, formData.custom_frequency_days)
	$: annualEstimate = calculateAnnualEstimate()
	$: showCustomFrequency = formData.frequency === 'custom'
</script>

<div class="add-income-source-form">
	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
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
				error={errors.name}
				required
				maxlength={100}
				hint="Give your income source a descriptive name"
			/>
			
			<!-- Amount -->
			<FormInput
				id="income-amount"
				name="amount"
				type="number"
				label="Amount per Payment"
				placeholder="0.00"
				bind:value={formData.amount}
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