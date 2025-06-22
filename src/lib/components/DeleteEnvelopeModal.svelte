<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { supabase } from '$lib/utils/supabase'
	import { user } from '$lib/stores/auth'
	import { toastHelpers } from '$lib/stores/toast'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import type { Envelope } from '$lib/types/database'
	
	const dispatch = createEventDispatcher<{
		success: { id: string; name: string }
		cancel: void
	}>()
	
	// Props
	export let envelope: Envelope
	
	// State
	let loading = false
	let transferToEnvelopeId = ''
	let availableEnvelopes: { id: string; name: string; type: string }[] = []
	
	// Load available envelopes for balance transfer
	async function loadAvailableEnvelopes() {
		if (!$user) return
		
		try {
			const { data, error } = await supabase
				.from('envelopes')
				.select('id, name, type')
				.eq('user_id', $user.id)
				.neq('id', envelope.id)
				.order('name', { ascending: true })
			
			if (error) {
				console.error('Error loading envelopes:', error)
				toastHelpers.error('Failed to load available envelopes')
				return
			}
			
			availableEnvelopes = data || []
		} catch (error) {
			console.error('Error loading envelopes:', error)
			toastHelpers.error('Failed to load available envelopes')
		}
	}
	
	// Handle delete
	async function handleDelete() {
		if (!$user) {
			toastHelpers.error('You must be logged in to delete an envelope')
			return
		}
		
		// Validate balance transfer if needed
		if (envelope.balance !== 0 && !transferToEnvelopeId) {
			toastHelpers.error('Please select an envelope to transfer the balance to, or ensure the balance is zero')
			return
		}
		
		loading = true
		
		try {
			// If there's a balance, transfer it first
			if (envelope.balance !== 0 && transferToEnvelopeId) {
				// Get the target envelope
				const { data: targetEnvelope, error: targetError } = await supabase
					.from('envelopes')
					.select('balance')
					.eq('id', transferToEnvelopeId)
					.eq('user_id', $user.id)
					.single()
				
				if (targetError) {
					console.error('Error fetching target envelope:', targetError)
					toastHelpers.error('Failed to fetch target envelope for balance transfer')
					return
				}
				
				// Update target envelope balance
				const newBalance = targetEnvelope.balance + envelope.balance
				const { error: updateError } = await supabase
					.from('envelopes')
					.update({ balance: newBalance })
					.eq('id', transferToEnvelopeId)
					.eq('user_id', $user.id)
				
				if (updateError) {
					console.error('Error transferring balance:', updateError)
					toastHelpers.error('Failed to transfer balance to target envelope')
					return
				}
				
				// Create a transaction record for the transfer
				const { error: transactionError } = await supabase
					.from('transactions')
					.insert([
						{
							user_id: $user.id,
							envelope_id: transferToEnvelopeId,
							type: 'transfer',
							amount: envelope.balance,
							description: `Balance transfer from deleted envelope: ${envelope.name}`,
							date: new Date().toISOString()
						}
					])
				
				if (transactionError) {
					console.error('Error creating transaction record:', transactionError)
					// Don't fail the deletion for this, just log it
				}
			}
			
			// Delete the envelope
			const { error: deleteError } = await supabase
				.from('envelopes')
				.delete()
				.eq('id', envelope.id)
				.eq('user_id', $user.id)
			
			if (deleteError) {
				console.error('Error deleting envelope:', deleteError)
				toastHelpers.error('Failed to delete envelope. Please try again.')
				return
			}
			
			const balanceMessage = envelope.balance !== 0 
				? ` and transferred ${formatCurrency(envelope.balance)} to the selected envelope`
				: ''
			
			toastHelpers.success(`Envelope "${envelope.name}" deleted successfully${balanceMessage}`)
			dispatch('success', { id: envelope.id, name: envelope.name })
		} catch (error) {
			console.error('Error deleting envelope:', error)
			toastHelpers.error('Failed to delete envelope. Please try again.')
		} finally {
			loading = false
		}
	}
	
	// Handle cancel
	function handleCancel() {
		dispatch('cancel')
	}
	
	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}
	
	// Get envelope type badge color
	function getEnvelopeTypeBadge(type: string) {
		switch (type) {
			case 'regular':
				return 'bg-blue-100 text-blue-800'
			case 'savings':
				return 'bg-green-100 text-green-800'
			case 'debt':
				return 'bg-red-100 text-red-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}
	
	// Load available envelopes on mount
	$: if (envelope) {
		loadAvailableEnvelopes()
	}
	
	// Reactive validation
	$: hasBalance = envelope.balance !== 0
	$: canDelete = !hasBalance || transferToEnvelopeId !== ''
	$: selectedEnvelope = availableEnvelopes.find(env => env.id === transferToEnvelopeId)
</script>

<div class="delete-envelope-modal">
	<div class="space-y-6">
		<!-- Warning Header -->
		<div class="flex items-start">
			<div class="flex-shrink-0">
				<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			</div>
			<div class="ml-3">
				<h3 class="text-lg font-medium text-gray-900">Delete Envelope</h3>
				<p class="text-sm text-gray-500 mt-1">
					This action cannot be undone. The envelope will be permanently deleted.
				</p>
			</div>
		</div>
		
		<!-- Envelope Details -->
		<div class="bg-gray-50 rounded-lg p-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getEnvelopeTypeBadge(envelope.type)}">
						{envelope.type}
					</span>
					<div class="ml-3">
						<h4 class="text-sm font-medium text-gray-900">{envelope.name}</h4>
						<p class="text-sm text-gray-500">Current Balance: {formatCurrency(envelope.balance)}</p>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Balance Transfer Section -->
		{#if hasBalance}
			<div class="space-y-4">
				<div class="border-l-4 border-yellow-400 bg-yellow-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
						</div>
						<div class="ml-3">
							<h4 class="text-sm font-medium text-yellow-800">Balance Transfer Required</h4>
							<p class="text-sm text-yellow-700 mt-1">
								This envelope has a balance of {formatCurrency(envelope.balance)}. 
								You must transfer this balance to another envelope before deletion.
							</p>
						</div>
					</div>
				</div>
				
				{#if availableEnvelopes.length > 0}
					<div>
						<label for="transfer-envelope" class="block text-sm font-medium text-gray-700 mb-2">
							Transfer balance to:
						</label>
						<select
							id="transfer-envelope"
							bind:value={transferToEnvelopeId}
							class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
						>
							<option value="">Select an envelope...</option>
							{#each availableEnvelopes as availableEnvelope}
								<option value={availableEnvelope.id}>
									{availableEnvelope.name} ({availableEnvelope.type})
								</option>
							{/each}
						</select>
						
						{#if selectedEnvelope}
							<p class="text-xs text-gray-500 mt-1">
								The balance will be added to "{selectedEnvelope.name}"
							</p>
						{/if}
					</div>
				{:else}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="ml-3">
								<h4 class="text-sm font-medium text-red-800">No Available Envelopes</h4>
								<p class="text-sm text-red-700 mt-1">
									You don't have any other envelopes to transfer the balance to. 
									Please create another envelope first or manually adjust the balance to zero.
								</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="bg-green-50 border border-green-200 rounded-lg p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h4 class="text-sm font-medium text-green-800">Ready to Delete</h4>
						<p class="text-sm text-green-700 mt-1">
							This envelope has a zero balance and can be safely deleted.
						</p>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Confirmation -->
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<p class="text-sm text-red-800">
				<strong>Are you sure you want to delete this envelope?</strong>
			</p>
			<p class="text-sm text-red-700 mt-1">
				This action cannot be undone. All transaction history associated with this envelope will remain, 
				but the envelope itself will be permanently removed.
			</p>
		</div>
		
		<!-- Actions -->
		<div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
			<div class="flex-1 sm:flex-none">
				<LoadingButton
					type="button"
					variant="primary"
					size="md"
					{loading}
					disabled={loading || !canDelete}
					fullWidth={true}
					on:click={handleDelete}
				>
					{loading ? 'Deleting...' : 'Delete Envelope'}
				</LoadingButton>
			</div>
			
			<button
				type="button"
				on:click={handleCancel}
				disabled={loading}
				class="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
			>
				Cancel
			</button>
		</div>
	</div>
</div>