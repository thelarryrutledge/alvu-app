<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import FormInput from '$lib/components/FormInput.svelte'
	import FormSelect, { type SelectOption } from '$lib/components/FormSelect.svelte'
	import FormTextarea from '$lib/components/FormTextarea.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import type { IncomeSource } from '$lib/types/database'
	
	// Form data
	let formData = {
		income_source_id: '',
		amount: 0,
		description: '',
		date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
		payee: ''
	}
	
	// Form state
	let loading = false
	let loadingIncomeSources = true
	let errors: Record<string, string> = {}
	let incomeSources: IncomeSource[] = []
	let selectedIncomeSource: IncomeSource | null = null
	
	// Load income sources for selection
	async function loadIncomeSources() {
		if (!$user) return
		
		loadingIncomeSources = true
		
		try {
			const { data, error } = await supabase
				.from('income_sources')
				.select('*')
				.eq('user_id', $user.id)
				.eq('is_active', true)
				.order('name', { ascending: true })
			
			if (error) {
				console.error('Error fetching income sources:', error)
				toastHelpers.error('Failed to load income sources')
			} else {
				incomeSources = data || []
			}
		} catch (error) {
			console.error('Error loading income sources:', error)
			toastHelpers.error('Failed to load income sources')
		} finally {
			loadingIncomeSources = false
		}
	}
	
	// Create income source options for select
	$: incomeSourceOptions = incomeSources.map(source => ({
		value: source.id,
		label: `${source.name} (${formatCurrency(source.amount)})`
	})) as SelectOption[]
	
	// Update selected income source when selection changes
	$: {
		if (formData.income_source_id) {
			selectedIncomeSource = incomeSources.find(source => source.id === formData.income_source_id) || null
			// Auto-fill amount if income source is selected
			if (selectedIncomeSource && formData.amount === 0) {
				formData.amount = selectedIncomeSource.amount
			}
		} else {
			selectedIncomeSource = null
		}
	}
	
	// Validation
	function validateForm(): boolean {
		errors = {}
		
		// Amount validation
		if (!formData.amount || formData.amount <= 0) {
			errors.amount = 'Amount must be greater than 0'
		} else if (formData.amount > 1000000) {
			errors.amount = 'Amount cannot exceed $1,000,000'
		}
		
		// Description validation
		if (!formData.description.trim()) {
			errors.description = 'Description is required'
		} else if (formData.description.length > 255) {
			errors.description = 'Description cannot exceed 255 characters'
		}
		
		// Date validation
		if (!formData.date) {
			errors.date = 'Date is required'
		} else {
			const selectedDate = new Date(formData.date)
			const today = new Date()
			const oneYearAgo = new Date()
			oneYearAgo.setFullYear(today.getFullYear() - 1)
			
			if (selectedDate > today) {
				errors.date = 'Date cannot be in the future'
			} else if (selectedDate < oneYearAgo) {
				errors.date = 'Date cannot be more than one year ago'
			}
		}
		
		// Payee validation (optional but if provided, must be valid)
		if (formData.payee && formData.payee.length > 100) {
			errors.payee = 'Payee name cannot exceed 100 characters'
		}
		
		return Object.keys(errors).length === 0
	}
	
	// Submit form
	async function handleSubmit() {
		if (!validateForm()) {
			toastHelpers.error('Please fix the errors below')
			return
		}
		
		if (!$user) {
			toastHelpers.error('You must be logged in to add income')
			return
		}
		
		loading = true
		
		try {
			// Create the income transaction
			const transactionData = {
				user_id: $user.id,
				type: 'income' as const,
				amount: formData.amount,
				description: formData.description.trim(),
				payee: formData.payee.trim() || null,
				date: formData.date,
				envelope_id: null // Income goes to available funds, not to an envelope
			}
			
			const { data: transaction, error: transactionError } = await supabase
				.from('transactions')
				.insert([transactionData])
				.select()
				.single()
			
			if (transactionError) {
				console.error('Error creating income transaction:', transactionError)
				toastHelpers.error('Failed to record income transaction. Please try again.')
				return
			}
			
			// Update the income source's next expected date if one was selected
			if (selectedIncomeSource) {
				const nextExpectedDate = calculateNextExpectedDate(selectedIncomeSource)
				if (nextExpectedDate) {
					const { error: updateError } = await supabase
						.from('income_sources')
						.update({
							next_expected_date: nextExpectedDate,
							updated_at: new Date().toISOString()
						})
						.eq('id', selectedIncomeSource.id)
						.eq('user_id', $user.id)
					
					if (updateError) {
						console.error('Error updating income source next expected date:', updateError)
						// Don't fail the transaction for this, just log it
					}
				}
			}
			
			toastHelpers.success(`Income of ${formatCurrency(formData.amount)} recorded successfully!`)
			
			// Navigate to dashboard with a query parameter to potentially show allocation prompt
			goto(`/dashboard?income_added=${transaction.id}&amount=${formData.amount}`)
			
		} catch (error) {
			console.error('Error creating income transaction:', error)
			toastHelpers.error('An unexpected error occurred. Please try again.')
		} finally {
			loading = false
		}
	}
	
	// Calculate next expected date for income source
	function calculateNextExpectedDate(incomeSource: IncomeSource): string | null {
		const now = new Date()
		let nextDate = new Date(now)
		
		switch (incomeSource.frequency) {
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
				if (incomeSource.custom_frequency_days) {
					nextDate.setDate(now.getDate() + incomeSource.custom_frequency_days)
				}
				break
		}
		
		return nextDate.toISOString().split('T')[0] // Return YYYY-MM-DD format
	}
	
	// Cancel and go back
	function handleCancel() {
		goto('/dashboard')
	}
	
	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}
	
	// Load data on mount
	onMount(() => {
		loadIncomeSources()
	})
</script>

<ProtectedRoute>
	<AppLayout title="Add Income - Alvu">
		<div class="add-income-container max-w-2xl mx-auto">
			<!-- Page Header -->
			<header class="mb-8">
				<div class="flex items-center space-x-4 mb-4">
					<button
						on:click={handleCancel}
						class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
						title="Go back to dashboard"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<div>
						<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Add Income</h1>
						<p class="text-gray-600 mt-1">Record money coming into your budget</p>
					</div>
				</div>
				
				<!-- Info Banner -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div class="flex items-start">
						<svg class="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div class="text-sm text-blue-700">
							<p class="font-medium mb-1">How income works in Alvu:</p>
							<ul class="space-y-1 text-blue-600">
								<li>• Income is added to your "Available Funds" bucket</li>
								<li>• After recording income, you can allocate it to your envelopes</li>
								<li>• You can skip allocation and do it later from the dashboard</li>
							</ul>
						</div>
					</div>
				</div>
			</header>

			<!-- Main Form -->
			<div class="bg-white rounded-lg shadow-lg">
				<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6" novalidate>
					<!-- Income Source Selection -->
					<div class="space-y-4">
						<h3 class="text-lg font-medium text-gray-900">Income Details</h3>
						
						{#if loadingIncomeSources}
							<div class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
								<LoadingSpinner size="sm" color="primary" />
								<span class="text-sm text-gray-600">Loading your income sources...</span>
							</div>
						{:else if incomeSources.length > 0}
							<FormSelect
								id="income-source"
								name="income_source_id"
								label="Income Source (Optional)"
								placeholder="Select an income source or leave blank for one-time income"
								bind:value={formData.income_source_id}
								options={[
									{ value: '', label: 'One-time income (no source)' },
									...incomeSourceOptions
								]}
								error={errors.income_source_id}
								hint="Choose from your existing income sources or record as one-time income"
							/>
						{:else}
							<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
								<div class="flex items-start">
									<svg class="w-5 h-5 text-amber-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
									<div class="text-sm">
										<p class="font-medium text-amber-900 mb-1">No income sources found</p>
										<p class="text-amber-700 mb-2">You can still record income, but consider setting up income sources for regular payments.</p>
										<a href="/income" class="text-amber-600 hover:text-amber-500 font-medium">
											Set up income sources →
										</a>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Amount and Date -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormInput
							id="income-amount"
							name="amount"
							type="number"
							label="Amount"
							placeholder="0.00"
							bind:value={formData.amount}
							error={errors.amount}
							required
							min="0.01"
							max="1000000"
							step="0.01"
							hint="How much money did you receive?"
						/>
						
						<FormInput
							id="income-date"
							name="date"
							type="date"
							label="Date Received"
							bind:value={formData.date}
							error={errors.date}
							required
							hint="When did you receive this income?"
						/>
					</div>

					<!-- Description -->
					<FormInput
						id="income-description"
						name="description"
						type="text"
						label="Description"
						placeholder="e.g., Salary payment, Freelance project, Bonus"
						bind:value={formData.description}
						error={errors.description}
						required
						maxlength={255}
						hint="Describe this income transaction"
					/>

					<!-- Payee (Optional) -->
					<FormInput
						id="income-payee"
						name="payee"
						type="text"
						label="From (Optional)"
						placeholder="e.g., ABC Company, Client Name"
						bind:value={formData.payee}
						error={errors.payee}
						maxlength={100}
						hint="Who paid you? (Optional)"
					/>

					<!-- Selected Income Source Info -->
					{#if selectedIncomeSource}
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<h4 class="text-sm font-medium text-green-900 mb-2">Selected Income Source</h4>
							<div class="text-sm text-green-700 space-y-1">
								<p><span class="font-medium">Name:</span> {selectedIncomeSource.name}</p>
								<p><span class="font-medium">Typical Amount:</span> {formatCurrency(selectedIncomeSource.amount)}</p>
								<p><span class="font-medium">Frequency:</span> {selectedIncomeSource.frequency}</p>
								{#if selectedIncomeSource.description}
									<p><span class="font-medium">Notes:</span> {selectedIncomeSource.description}</p>
								{/if}
							</div>
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
							loadingText="Recording Income..."
						>
							Record Income
						</LoadingButton>
					</div>
				</form>
			</div>

			<!-- Next Steps Info -->
			<div class="mt-8 bg-gray-50 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">What happens next?</h3>
				<div class="space-y-3 text-sm text-gray-600">
					<div class="flex items-start">
						<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">1</span>
						</div>
						<p>Your income will be added to your "Available Funds" on the dashboard</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">2</span>
						</div>
						<p>You'll be prompted to allocate the funds to your envelopes (optional)</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">3</span>
						</div>
						<p>You can allocate funds later using the "Allocate" button on the dashboard</p>
					</div>
				</div>
			</div>
		</div>
	</AppLayout>
</ProtectedRoute>