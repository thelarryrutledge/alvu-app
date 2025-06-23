<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import FormInput from '$lib/components/FormInput.svelte'
	import FormSelect from '$lib/components/FormSelect.svelte'
	import FormTextarea from '$lib/components/FormTextarea.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import type { Envelope, Category, IncomeSource } from '$lib/types/database'
	
	// Props
	export let preselectedType: 'income' | 'expense' | 'transfer' | 'allocation' | null = null
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		success: { id: string; type: string; amount: number }
		cancel: void
	}>()
	
	// State
	let loading = false
	let envelopes: Envelope[] = []
	let categories: Category[] = []
	let incomeSources: IncomeSource[] = []
	let loadingData = true
	
	// Form data
	let transactionType: 'income' | 'expense' | 'transfer' | 'allocation' = preselectedType || 'income'
	let amount = ''
	let description = ''
	let payee = ''
	let date = new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
	let envelopeId = ''
	let sourceEnvelopeId = ''
	let destinationEnvelopeId = ''
	let incomeSourceId = ''
	
	// Validation state
	let errors: Record<string, string> = {}
	
	// Load required data
	async function loadFormData() {
		if (!$user) return
		
		loadingData = true
		
		try {
			// Load envelopes with categories
			const { data: envelopesData, error: envelopesError } = await supabase
				.from('envelopes')
				.select(`
					*,
					categories (
						id,
						name,
						color
					)
				`)
				.eq('user_id', $user.id)
				.order('name', { ascending: true })
			
			if (envelopesError) {
				console.error('Error fetching envelopes:', envelopesError)
				toastHelpers.error('Failed to load envelopes')
				return
			}
			
			// Load categories
			const { data: categoriesData, error: categoriesError } = await supabase
				.from('categories')
				.select('*')
				.eq('user_id', $user.id)
				.order('sort_order', { ascending: true })
			
			if (categoriesError) {
				console.error('Error fetching categories:', categoriesError)
				toastHelpers.error('Failed to load categories')
				return
			}
			
			// Load income sources
			const { data: incomeSourcesData, error: incomeSourcesError } = await supabase
				.from('income_sources')
				.select('*')
				.eq('user_id', $user.id)
				.eq('is_active', true)
				.order('name', { ascending: true })
			
			if (incomeSourcesError) {
				console.error('Error fetching income sources:', incomeSourcesError)
				toastHelpers.error('Failed to load income sources')
				return
			}
			
			envelopes = envelopesData || []
			categories = categoriesData || []
			incomeSources = incomeSourcesData || []
		} catch (error) {
			console.error('Error loading form data:', error)
			toastHelpers.error('Failed to load form data')
		} finally {
			loadingData = false
		}
	}
	
	// Validation functions
	function validateForm(): boolean {
		errors = {}
		
		// Common validations
		if (!amount || parseFloat(amount) <= 0) {
			errors.amount = 'Amount must be greater than 0'
		}
		
		if (!description.trim()) {
			errors.description = 'Description is required'
		}
		
		if (!date) {
			errors.date = 'Date is required'
		}
		
		// Type-specific validations
		switch (transactionType) {
			case 'income':
				if (!incomeSourceId) {
					errors.incomeSourceId = 'Income source is required'
				}
				break
				
			case 'expense':
				if (!envelopeId) {
					errors.envelopeId = 'Envelope is required'
				}
				if (!payee.trim()) {
					errors.payee = 'Payee is required for expenses'
				}
				break
				
			case 'transfer':
				if (!sourceEnvelopeId) {
					errors.sourceEnvelopeId = 'Source envelope is required'
				}
				if (!destinationEnvelopeId) {
					errors.destinationEnvelopeId = 'Destination envelope is required'
				}
				if (sourceEnvelopeId === destinationEnvelopeId) {
					errors.destinationEnvelopeId = 'Source and destination envelopes must be different'
				}
				break
				
			case 'allocation':
				if (!envelopeId) {
					errors.envelopeId = 'Envelope is required'
				}
				break
		}
		
		return Object.keys(errors).length === 0
	}
	
	// Submit form
	async function handleSubmit() {
		if (!validateForm()) {
			return
		}
		
		if (!$user) {
			toastHelpers.error('User not authenticated')
			return
		}
		
		loading = true
		
		try {
			const transactionAmount = parseFloat(amount)
			let result
			
			switch (transactionType) {
				case 'income':
					result = await supabase.rpc('process_income_transaction', {
						user_uuid: $user.id,
						income_source_uuid: incomeSourceId,
						transaction_amount: transactionAmount,
						transaction_description: description.trim(),
						transaction_date: date
					})
					break
					
				case 'expense':
					result = await supabase.rpc('process_expense_transaction', {
						user_uuid: $user.id,
						envelope_uuid: envelopeId,
						transaction_amount: transactionAmount,
						transaction_description: description.trim(),
						transaction_payee: payee.trim(),
						transaction_date: date
					})
					break
					
				case 'transfer':
					result = await supabase.rpc('process_transfer_transaction', {
						user_uuid: $user.id,
						source_envelope_uuid: sourceEnvelopeId,
						destination_envelope_uuid: destinationEnvelopeId,
						transaction_amount: transactionAmount,
						transaction_description: description.trim(),
						transaction_date: date
					})
					break
					
				case 'allocation':
					result = await supabase.rpc('process_allocation_transaction', {
						user_uuid: $user.id,
						envelope_uuid: envelopeId,
						transaction_amount: transactionAmount,
						transaction_description: description.trim(),
						transaction_date: date
					})
					break
			}
			
			if (result.error) {
				console.error('Transaction error:', result.error)
				toastHelpers.error(result.error.message || 'Failed to create transaction')
				return
			}
			
			toastHelpers.success(`${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} transaction created successfully`)
			dispatch('success', { 
				id: result.data, 
				type: transactionType, 
				amount: transactionAmount 
			})
		} catch (error) {
			console.error('Error creating transaction:', error)
			toastHelpers.error('Failed to create transaction')
		} finally {
			loading = false
		}
	}
	
	// Cancel form
	function handleCancel() {
		dispatch('cancel')
	}
	
	// Reset form when transaction type changes
	function handleTypeChange() {
		// Clear type-specific fields
		envelopeId = ''
		sourceEnvelopeId = ''
		destinationEnvelopeId = ''
		incomeSourceId = ''
		payee = ''
		
		// Clear errors
		errors = {}
	}
	
	// Get envelope name with category
	function getEnvelopeDisplayName(envelope: Envelope): string {
		const category = categories.find(c => c.id === envelope.category_id)
		return category ? `${envelope.name} (${category.name})` : envelope.name
	}
	
	// Get available envelopes for transfers (exclude selected source)
	function getAvailableDestinationEnvelopes(): Envelope[] {
		return envelopes.filter(e => e.id !== sourceEnvelopeId)
	}
	
	// Load data on mount
	$: if ($user) {
		loadFormData()
	}
	
	// Format currency for display
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}
</script>

<div class="add-transaction-form">
	{#if loadingData}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-3 text-gray-600">Loading form data...</span>
		</div>
	{:else}
		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<!-- Transaction Type Selection -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium text-gray-900">Transaction Type</h3>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<button
						type="button"
						on:click={() => { transactionType = 'income'; handleTypeChange(); }}
						class="relative rounded-lg border p-4 focus:outline-none {transactionType === 'income' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'}"
					>
						<div class="flex flex-col items-center">
							<svg class="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
							</svg>
							<span class="text-sm font-medium">Income</span>
						</div>
					</button>
					
					<button
						type="button"
						on:click={() => { transactionType = 'expense'; handleTypeChange(); }}
						class="relative rounded-lg border p-4 focus:outline-none {transactionType === 'expense' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'}"
					>
						<div class="flex flex-col items-center">
							<svg class="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
							</svg>
							<span class="text-sm font-medium">Expense</span>
						</div>
					</button>
					
					<button
						type="button"
						on:click={() => { transactionType = 'transfer'; handleTypeChange(); }}
						class="relative rounded-lg border p-4 focus:outline-none {transactionType === 'transfer' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'}"
					>
						<div class="flex flex-col items-center">
							<svg class="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
							</svg>
							<span class="text-sm font-medium">Transfer</span>
						</div>
					</button>
					
					<button
						type="button"
						on:click={() => { transactionType = 'allocation'; handleTypeChange(); }}
						class="relative rounded-lg border p-4 focus:outline-none {transactionType === 'allocation' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'}"
					>
						<div class="flex flex-col items-center">
							<svg class="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
							<span class="text-sm font-medium">Allocation</span>
						</div>
					</button>
				</div>
			</div>

			<!-- Common Fields -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<FormInput
					id="amount"
					label="Amount"
					type="number"
					step="0.01"
					min="0.01"
					max="1000000"
					bind:value={amount}
					error={errors.amount}
					required
					placeholder="0.00"
				/>
				
				<FormInput
					id="date"
					label="Date"
					type="date"
					bind:value={date}
					error={errors.date}
					required
				/>
			</div>

			<!-- Type-specific Fields -->
			{#if transactionType === 'income'}
				<FormSelect
					id="incomeSourceId"
					label="Income Source"
					bind:value={incomeSourceId}
					error={errors.incomeSourceId}
					required
				>
					<option value="">Select income source</option>
					{#each incomeSources as source}
						<option value={source.id}>{source.name} - {formatCurrency(source.amount)}</option>
					{/each}
				</FormSelect>
			{/if}

			{#if transactionType === 'expense'}
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<FormSelect
						id="envelopeId"
						label="Envelope"
						bind:value={envelopeId}
						error={errors.envelopeId}
						required
					>
						<option value="">Select envelope</option>
						{#each envelopes as envelope}
							<option value={envelope.id}>{getEnvelopeDisplayName(envelope)} - {formatCurrency(envelope.balance)}</option>
						{/each}
					</FormSelect>
					
					<FormInput
						id="payee"
						label="Payee"
						type="text"
						bind:value={payee}
						error={errors.payee}
						required
						placeholder="Who did you pay?"
					/>
				</div>
			{/if}

			{#if transactionType === 'transfer'}
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<FormSelect
						id="sourceEnvelopeId"
						label="From Envelope"
						bind:value={sourceEnvelopeId}
						error={errors.sourceEnvelopeId}
						required
					>
						<option value="">Select source envelope</option>
						{#each envelopes as envelope}
							<option value={envelope.id}>{getEnvelopeDisplayName(envelope)} - {formatCurrency(envelope.balance)}</option>
						{/each}
					</FormSelect>
					
					<FormSelect
						id="destinationEnvelopeId"
						label="To Envelope"
						bind:value={destinationEnvelopeId}
						error={errors.destinationEnvelopeId}
						required
					>
						<option value="">Select destination envelope</option>
						{#each getAvailableDestinationEnvelopes() as envelope}
							<option value={envelope.id}>{getEnvelopeDisplayName(envelope)} - {formatCurrency(envelope.balance)}</option>
						{/each}
					</FormSelect>
				</div>
			{/if}

			{#if transactionType === 'allocation'}
				<FormSelect
					id="envelopeId"
					label="Envelope"
					bind:value={envelopeId}
					error={errors.envelopeId}
					required
				>
					<option value="">Select envelope</option>
					{#each envelopes as envelope}
						<option value={envelope.id}>{getEnvelopeDisplayName(envelope)} - {formatCurrency(envelope.balance)}</option>
					{/each}
				</FormSelect>
			{/if}

			<!-- Description -->
			<FormTextarea
				id="description"
				label="Description"
				bind:value={description}
				error={errors.description}
				required
				placeholder="Enter transaction description..."
				rows={3}
			/>

			<!-- Action Buttons -->
			<div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
				<button
					type="button"
					on:click={handleCancel}
					class="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Cancel
				</button>
				
				<LoadingButton
					type="submit"
					{loading}
					variant="primary"
					size="md"
					fullWidth={false}
				>
					Create {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
				</LoadingButton>
			</div>
		</form>
	{/if}
</div>