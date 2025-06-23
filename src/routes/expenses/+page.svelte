<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import FormInput from '$lib/components/FormInput.svelte'
	import FormSelect, { type SelectOption } from '$lib/components/FormSelect.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import type { Envelope, Payee } from '$lib/types/database'
	
	// Form data
	let formData = {
		envelope_id: '',
		amount: 0,
		description: '',
		date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
		payee: ''
	}
	
	// Form state
	let loading = false
	let loadingEnvelopes = true
	let loadingPayees = true
	let errors: Record<string, string> = {}
	let envelopes: Envelope[] = []
	let payees: Payee[] = []
	let selectedEnvelope: Envelope | null = null
	let filteredPayees: Payee[] = []
	let showPayeeDropdown = false
	
	// Load envelopes for selection
	async function loadEnvelopes() {
		if (!$user) return
		
		loadingEnvelopes = true
		
		try {
			const { data, error } = await supabase
				.from('envelopes')
				.select(`
					*,
					categories!inner(name, color)
				`)
				.eq('user_id', $user.id)
				.order('name', { ascending: true })
			
			if (error) {
				console.error('Error fetching envelopes:', error)
				toastHelpers.error('Failed to load envelopes')
			} else {
				envelopes = data || []
			}
		} catch (error) {
			console.error('Error loading envelopes:', error)
			toastHelpers.error('Failed to load envelopes')
		} finally {
			loadingEnvelopes = false
		}
	}
	
	// Load payees for autocomplete
	async function loadPayees() {
		if (!$user) return
		
		loadingPayees = true
		
		try {
			const { data, error } = await supabase
				.from('payees')
				.select('*')
				.eq('user_id', $user.id)
				.order('usage_count', { ascending: false })
				.order('name', { ascending: true })
			
			if (error) {
				console.error('Error fetching payees:', error)
				toastHelpers.error('Failed to load payees')
			} else {
				payees = data || []
			}
		} catch (error) {
			console.error('Error loading payees:', error)
			toastHelpers.error('Failed to load payees')
		} finally {
			loadingPayees = false
		}
	}
	
	// Create envelope options for select
	$: envelopeOptions = envelopes
		.filter(envelope => envelope.balance > 0 || envelope.type === 'debt') // Show envelopes with balance or debt envelopes
		.map(envelope => ({
			value: envelope.id,
			label: `${envelope.name} (${formatCurrency(envelope.balance)})`
		})) as SelectOption[]
	
	// Update selected envelope when selection changes
	$: {
		if (formData.envelope_id) {
			selectedEnvelope = envelopes.find(envelope => envelope.id === formData.envelope_id) || null
		} else {
			selectedEnvelope = null
		}
	}
	
	// Filter payees based on input
	$: {
		if (formData.payee.trim()) {
			filteredPayees = payees.filter(payee => 
				payee.name.toLowerCase().includes(formData.payee.toLowerCase())
			).slice(0, 5) // Limit to 5 suggestions
		} else {
			filteredPayees = payees.slice(0, 5) // Show top 5 recent payees
		}
	}
	
	// Validation
	function validateForm(): boolean {
		errors = {}
		
		// Envelope validation
		if (!formData.envelope_id) {
			errors.envelope_id = 'Please select an envelope'
		}
		
		// Amount validation
		if (!formData.amount || formData.amount <= 0) {
			errors.amount = 'Amount must be greater than 0'
		} else if (formData.amount > 1000000) {
			errors.amount = 'Amount cannot exceed $1,000,000'
		} else if (selectedEnvelope) {
			// Check envelope balance for non-debt envelopes
			if (selectedEnvelope.type !== 'debt' && formData.amount > selectedEnvelope.balance) {
				errors.amount = `Insufficient balance. Available: ${formatCurrency(selectedEnvelope.balance)}`
			}
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
			toastHelpers.error('You must be logged in to record expenses')
			return
		}
		
		loading = true
		
		try {
			// Use the database function to process the expense transaction
			const { data: transaction, error: transactionError } = await supabase
				.rpc('process_expense_transaction', {
					user_uuid: $user.id,
					envelope_uuid: formData.envelope_id,
					transaction_amount: formData.amount,
					transaction_description: formData.description.trim(),
					transaction_payee: formData.payee.trim() || null,
					transaction_date: formData.date
				})
			
			if (transactionError) {
				console.error('Error creating expense transaction:', transactionError)
				if (transactionError.message.includes('Insufficient balance')) {
					toastHelpers.error(transactionError.message)
				} else {
					toastHelpers.error('Failed to record expense transaction. Please try again.')
				}
				return
			}
			
			// Create or update payee if provided
			if (formData.payee.trim()) {
				await createOrUpdatePayee(formData.payee.trim())
			}
			
			toastHelpers.success(`Expense of ${formatCurrency(formData.amount)} recorded successfully!`)
			
			// Navigate back to dashboard
			goto('/dashboard')
			
		} catch (error) {
			console.error('Error creating expense transaction:', error)
			toastHelpers.error('An unexpected error occurred. Please try again.')
		} finally {
			loading = false
		}
	}
	
	// Create or update payee
	async function createOrUpdatePayee(payeeName: string) {
		try {
			// Check if payee already exists
			const existingPayee = payees.find(p => p.name.toLowerCase() === payeeName.toLowerCase())
			
			if (existingPayee) {
				// Update usage count and last used date
				const { error } = await supabase
					.from('payees')
					.update({
						usage_count: existingPayee.usage_count + 1,
						last_used_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					})
					.eq('id', existingPayee.id)
					.eq('user_id', $user!.id)
				
				if (error) {
					console.error('Error updating payee:', error)
				}
			} else {
				// Create new payee
				const { error } = await supabase
					.from('payees')
					.insert([{
						user_id: $user!.id,
						name: payeeName,
						default_envelope_id: formData.envelope_id,
						usage_count: 1,
						last_used_at: new Date().toISOString(),
						is_favorite: false
					}])
				
				if (error) {
					console.error('Error creating payee:', error)
				}
			}
		} catch (error) {
			console.error('Error handling payee:', error)
		}
	}
	
	// Handle payee selection
	function selectPayee(payee: Payee) {
		formData.payee = payee.name
		showPayeeDropdown = false
		
		// Auto-fill envelope if payee has a default
		if (payee.default_envelope_id && !formData.envelope_id) {
			formData.envelope_id = payee.default_envelope_id
		}
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
		loadEnvelopes()
		loadPayees()
	})
</script>

<ProtectedRoute>
	<AppLayout title="Add Expense - Alvu">
		<div class="add-expense-container max-w-2xl mx-auto">
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
						<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Add Expense</h1>
						<p class="text-gray-600 mt-1">Record money spent from your envelopes</p>
					</div>
				</div>
				
				<!-- Info Banner -->
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="flex items-start">
						<svg class="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div class="text-sm text-red-700">
							<p class="font-medium mb-1">How expenses work in Alvu:</p>
							<ul class="space-y-1 text-red-600">
								<li>• Expenses are deducted from the selected envelope</li>
								<li>• You can only spend what's available in the envelope</li>
								<li>• Payee information is saved for future use</li>
							</ul>
						</div>
					</div>
				</div>
			</header>

			<!-- Main Form -->
			<div class="bg-white rounded-lg shadow-lg">
				<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6" novalidate>
					<!-- Envelope Selection -->
					<div class="space-y-4">
						<h3 class="text-lg font-medium text-gray-900">Expense Details</h3>
						
						{#if loadingEnvelopes}
							<div class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
								<LoadingSpinner size="sm" color="primary" />
								<span class="text-sm text-gray-600">Loading your envelopes...</span>
							</div>
						{:else if envelopeOptions.length > 0}
							<FormSelect
								id="envelope"
								name="envelope_id"
								label="Envelope"
								placeholder="Select an envelope to spend from"
								bind:value={formData.envelope_id}
								options={envelopeOptions}
								error={errors.envelope_id}
								required
								hint="Choose which envelope to deduct this expense from"
							/>
						{:else}
							<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
								<div class="flex items-start">
									<svg class="w-5 h-5 text-amber-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
									<div class="text-sm">
										<p class="font-medium text-amber-900 mb-1">No envelopes with available funds</p>
										<p class="text-amber-700 mb-2">You need to add income and allocate it to envelopes before recording expenses.</p>
										<a href="/dashboard" class="text-amber-600 hover:text-amber-500 font-medium">
											Go to dashboard →
										</a>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Amount and Date -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormInput
							id="expense-amount"
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
							hint="How much did you spend?"
						/>
						
						<FormInput
							id="expense-date"
							name="date"
							type="date"
							label="Date"
							bind:value={formData.date}
							error={errors.date}
							required
							hint="When did you make this purchase?"
						/>
					</div>

					<!-- Description -->
					<FormInput
						id="expense-description"
						name="description"
						type="text"
						label="Description"
						placeholder="e.g., Groceries, Gas, Restaurant"
						bind:value={formData.description}
						error={errors.description}
						required
						maxlength={255}
						hint="What was this expense for?"
					/>

					<!-- Payee with Autocomplete -->
					<div class="relative">
						<FormInput
							id="expense-payee"
							name="payee"
							type="text"
							label="Payee (Optional)"
							placeholder="e.g., Walmart, Shell, McDonald's"
							bind:value={formData.payee}
							error={errors.payee}
							maxlength={100}
							hint="Who did you pay? (Optional)"
							on:focus={() => showPayeeDropdown = true}
							on:blur={() => setTimeout(() => showPayeeDropdown = false, 200)}
						/>
						
						<!-- Payee Dropdown -->
						{#if showPayeeDropdown && filteredPayees.length > 0}
							<div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
								{#each filteredPayees as payee}
									<button
										type="button"
										class="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
										on:click={() => selectPayee(payee)}
									>
										<div class="font-medium text-gray-900">{payee.name}</div>
										{#if payee.category}
											<div class="text-sm text-gray-500">{payee.category}</div>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Selected Envelope Info -->
					{#if selectedEnvelope}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h4 class="text-sm font-medium text-blue-900 mb-2">Selected Envelope</h4>
							<div class="text-sm text-blue-700 space-y-1">
								<p><span class="font-medium">Name:</span> {selectedEnvelope.name}</p>
								<p><span class="font-medium">Available Balance:</span> {formatCurrency(selectedEnvelope.balance)}</p>
								<p><span class="font-medium">Type:</span> {selectedEnvelope.type}</p>
								{#if selectedEnvelope.type === 'debt'}
									<p class="text-blue-600 text-xs">Note: Expenses on debt envelopes increase the debt balance</p>
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
							disabled={loading || envelopeOptions.length === 0}
							variant="primary"
							size="md"
							fullWidth={false}
							loadingText="Recording Expense..."
						>
							Record Expense
						</LoadingButton>
					</div>
				</form>
			</div>

			<!-- Next Steps Info -->
			<div class="mt-8 bg-gray-50 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">What happens next?</h3>
				<div class="space-y-3 text-sm text-gray-600">
					<div class="flex items-start">
						<div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">1</span>
						</div>
						<p>The expense amount will be deducted from the selected envelope</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">2</span>
						</div>
						<p>The payee information will be saved for future use</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">3</span>
						</div>
						<p>You can view the transaction in your transaction history</p>
					</div>
				</div>
			</div>
		</div>
	</AppLayout>
</ProtectedRoute>