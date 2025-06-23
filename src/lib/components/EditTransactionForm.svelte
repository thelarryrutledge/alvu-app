<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import FormInput from '$lib/components/FormInput.svelte'
	import FormSelect from '$lib/components/FormSelect.svelte'
	import FormTextarea from '$lib/components/FormTextarea.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import type { Transaction, Envelope, Category, IncomeSource } from '$lib/types/database'
	
	// Props
	export let transaction: Transaction
	
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
	
	// Form data - initialize with transaction data
	let transactionType: 'income' | 'expense' | 'transfer' | 'allocation' = transaction.type
	let amount = transaction.amount.toString()
	let description = transaction.description
	let payee = transaction.payee || ''
	let date = transaction.date
	let envelopeId = transaction.envelope_id || ''
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
			
			// Set initial values based on transaction type
			initializeFormFields()
		} catch (error) {
			console.error('Error loading form data:', error)
			toastHelpers.error('Failed to load form data')
		} finally {
			loadingData = false
		}
	}
	
	// Initialize form fields based on transaction data
	function initializeFormFields() {
		// For transfer transactions, we need to get source and destination from the database
		// This is a simplified approach - in a full implementation, you'd store these in the transaction
		if (transaction.type === 'transfer') {
			// For now, we'll disable editing transfer transactions
			// In a full implementation, you'd need to track source/destination envelopes
			toastHelpers.warning('Transfer transaction editing is not yet supported')
			dispatch('cancel')
			return
		}
		
		// For income transactions, try to find the income source
		if (transaction.type === 'income') {
			// The income source would be stored in a separate field in a full implementation
			// For now, we'll allow editing other fields but not the income source
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
				// Income source validation would go here
				break
				
			case 'expense':
				if (!envelopeId) {
					errors.envelopeId = 'Envelope is required'
				}
				if (!payee.trim()) {
					errors.payee = 'Payee is required for expenses'
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
			
			// Update the transaction record
			const { error } = await supabase
				.from('transactions')
				.update({
					amount: transactionAmount,
					description: description.trim(),
					payee: payee.trim() || null,
					date: date,
					envelope_id: envelopeId || null,
					updated_at: new Date().toISOString()
				})
				.eq('id', transaction.id)
				.eq('user_id', $user.id)
			
			if (error) {
				console.error('Transaction update error:', error)
				toastHelpers.error(error.message || 'Failed to update transaction')
				return
			}
			
			toastHelpers.success('Transaction updated successfully')
			dispatch('success', { 
				id: transaction.id, 
				type: transactionType, 
				amount: transactionAmount 
			})
		} catch (error) {
			console.error('Error updating transaction:', error)
			toastHelpers.error('Failed to update transaction')
		} finally {
			loading = false
		}
	}
	
	// Cancel form
	function handleCancel() {
		dispatch('cancel')
	}
	
	// Get envelope name with category
	function getEnvelopeDisplayName(envelope: Envelope): string {
		const category = categories.find(c => c.id === envelope.category_id)
		return category ? `${envelope.name} (${category.name})` : envelope.name
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

<div class="edit-transaction-form">
	{#if loadingData}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-3 text-gray-600">Loading transaction data...</span>
		</div>
	{:else}
		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<!-- Transaction Type Display (Read-only) -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium text-gray-900">Transaction Type</h3>
				<div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
					<div class="flex items-center">
						<div class="flex-shrink-0 mr-3">
							{#if transactionType === 'income'}
								<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
									</svg>
								</div>
							{:else if transactionType === 'expense'}
								<div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
									</svg>
								</div>
							{:else if transactionType === 'transfer'}
								<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
									</svg>
								</div>
							{:else if transactionType === 'allocation'}
								<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
							{/if}
						</div>
						<div>
							<p class="text-sm font-medium text-gray-900 capitalize">{transactionType} Transaction</p>
							<p class="text-xs text-gray-500">Transaction type cannot be changed when editing</p>
						</div>
					</div>
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
				<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p class="text-sm text-blue-800">
							Income source cannot be changed when editing. Only amount, description, and date can be modified.
						</p>
					</div>
				</div>
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
				<div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
						<p class="text-sm text-yellow-800">
							Transfer transactions cannot be edited at this time. Please delete and recreate if changes are needed.
						</p>
					</div>
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
					disabled={transactionType === 'transfer'}
				>
					Update Transaction
				</LoadingButton>
			</div>
		</form>
	{/if}
</div>