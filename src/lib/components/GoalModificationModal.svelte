<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import Modal from '$lib/components/Modal.svelte'
	import FormInput from '$lib/components/FormInput.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import { calculateSavingsGoalProgress, formatCurrency, formatDate } from '$lib/utils/savingsGoalCalculations'
	import { trackGoalModification, type GoalModificationChange } from '$lib/utils/goalHistoryTracking'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import { user } from '$lib/stores/auth'
	import type { Envelope } from '$lib/types/database'
	
	// Props
	export let open = false
	export let envelope: Envelope | null = null
	
	// Component state
	let loading = false
	let targetAmount = ''
	let targetDate = ''
	let originalTargetAmount = 0
	let originalTargetDate = ''
	
	// Form validation
	let errors: Record<string, string> = {}
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		success: { envelope: Envelope; changes: GoalModificationChange }
		cancel: void
		close: void
	}>()
	
	// Reactive values
	$: if (envelope && open) {
		initializeForm()
	}
	
	$: currentProgress = envelope ? calculateCurrentProgress() : null
	$: newProgress = targetAmount && envelope ? calculateNewProgress() : null
	$: progressImpact = currentProgress && newProgress ? calculateProgressImpact() : null
	$: isFormValid = validateForm()
	$: hasChanges = checkForChanges()
	
	/**
	 * Initialize form with envelope data
	 */
	function initializeForm() {
		if (!envelope) return
		
		targetAmount = envelope.target_amount?.toString() || ''
		targetDate = envelope.target_date || ''
		originalTargetAmount = envelope.target_amount || 0
		originalTargetDate = envelope.target_date || ''
		errors = {}
	}
	
	/**
	 * Calculate current progress
	 */
	function calculateCurrentProgress() {
		if (!envelope || !envelope.target_amount) return null
		
		return calculateSavingsGoalProgress(
			envelope.balance,
			envelope.target_amount,
			envelope.target_date
		)
	}
	
	/**
	 * Calculate new progress with modified values
	 */
	function calculateNewProgress() {
		if (!envelope) return null
		
		const newTargetAmount = parseFloat(targetAmount) || 0
		if (newTargetAmount <= 0) return null
		
		return calculateSavingsGoalProgress(
			envelope.balance,
			newTargetAmount,
			targetDate || undefined
		)
	}
	
	/**
	 * Calculate progress impact of changes
	 */
	function calculateProgressImpact() {
		if (!currentProgress || !newProgress) return null
		
		return {
			oldProgress: currentProgress.progressPercentage,
			newProgress: newProgress.progressPercentage,
			progressChange: newProgress.progressPercentage - currentProgress.progressPercentage
		}
	}
	
	/**
	 * Validate form inputs
	 */
	function validateForm(): boolean {
		errors = {}
		
		// Validate target amount
		const amount = parseFloat(targetAmount)
		if (!targetAmount.trim()) {
			errors.targetAmount = 'Target amount is required'
		} else if (isNaN(amount) || amount <= 0) {
			errors.targetAmount = 'Target amount must be a positive number'
		} else if (amount > 10000000) {
			errors.targetAmount = 'Target amount cannot exceed $10,000,000'
		}
		
		// Validate target date (optional)
		if (targetDate) {
			const date = new Date(targetDate)
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			
			if (isNaN(date.getTime())) {
				errors.targetDate = 'Invalid date format'
			} else if (date <= today) {
				errors.targetDate = 'Target date must be in the future'
			} else if (date.getFullYear() > today.getFullYear() + 50) {
				errors.targetDate = 'Target date cannot be more than 50 years in the future'
			}
		}
		
		return Object.keys(errors).length === 0
	}
	
	/**
	 * Check if form has changes
	 */
	function checkForChanges(): boolean {
		if (!envelope) return false
		
		const amountChanged = parseFloat(targetAmount) !== originalTargetAmount
		const dateChanged = targetDate !== originalTargetDate
		
		return amountChanged || dateChanged
	}
	
	/**
	 * Create goal modification object
	 */
	function createGoalModification(): GoalModificationChange {
		const newTargetAmount = parseFloat(targetAmount)
		const targetAmountChanged = newTargetAmount !== originalTargetAmount
		const targetDateChanged = targetDate !== originalTargetDate
		
		return {
			targetAmountChanged,
			targetDateChanged,
			oldTargetAmount: originalTargetAmount,
			newTargetAmount: newTargetAmount,
			oldTargetDate: originalTargetDate,
			newTargetDate: targetDate,
			progressImpact: progressImpact || {
				oldProgress: 0,
				newProgress: 0,
				progressChange: 0
			}
		}
	}
	
	/**
	 * Save goal modifications
	 */
	async function saveGoalModifications() {
		if (!envelope || !isFormValid || !hasChanges) return
		
		loading = true
		
		try {
			const newTargetAmount = parseFloat(targetAmount)
			const updateData: Partial<Envelope> = {
				target_amount: newTargetAmount,
				target_date: targetDate || undefined
			}
			
			const { data, error } = await supabase
				.from('envelopes')
				.update(updateData)
				.eq('id', envelope.id)
				.eq('user_id', envelope.user_id)
				.select()
				.single()
			
			if (error) {
				console.error('Error updating goal:', error)
				toastHelpers.error('Failed to update savings goal. Please try again.')
				return
			}
			
			if (!data) {
				toastHelpers.error('No data returned from update operation.')
				return
			}
			
			// Create modification tracking
			const modification = createGoalModification()
			
			// Track the modification in history
			const currentUser = $user
			if (currentUser) {
				await trackGoalModification(currentUser.id, data, modification)
			}
			
			// Show success message
			const changeDescription = getChangeDescription(modification)
			toastHelpers.success(`Savings goal updated successfully! ${changeDescription}`)
			
			// Dispatch success event
			dispatch('success', { envelope: data, changes: modification })
			
			// Close modal
			handleClose()
			
		} catch (error) {
			console.error('Error saving goal modifications:', error)
			toastHelpers.error('An unexpected error occurred. Please try again.')
		} finally {
			loading = false
		}
	}
	
	/**
	 * Get human-readable change description
	 */
	function getChangeDescription(modification: GoalModificationChange): string {
		const changes = []
		
		if (modification.targetAmountChanged) {
			changes.push(`Target: ${formatCurrency(modification.newTargetAmount || 0)}`)
		}
		
		if (modification.targetDateChanged) {
			if (modification.newTargetDate) {
				changes.push(`Date: ${formatDate(new Date(modification.newTargetDate))}`)
			} else {
				changes.push('Target date removed')
			}
		}
		
		if (modification.progressImpact.progressChange !== 0) {
			const change = modification.progressImpact.progressChange
			const direction = change > 0 ? 'increased' : 'decreased'
			changes.push(`Progress ${direction} by ${Math.abs(change).toFixed(1)}%`)
		}
		
		return changes.join(', ')
	}
	
	/**
	 * Handle modal close
	 */
	function handleClose() {
		open = false
		targetAmount = ''
		targetDate = ''
		errors = {}
		dispatch('close')
	}
	
	/**
	 * Handle cancel
	 */
	function handleCancel() {
		dispatch('cancel')
		handleClose()
	}
	
	/**
	 * Format progress change for display
	 */
	function formatProgressChange(change: number): string {
		const absChange = Math.abs(change)
		const direction = change > 0 ? '+' : '-'
		return `${direction}${absChange.toFixed(1)}%`
	}
	
	/**
	 * Get progress change color
	 */
	function getProgressChangeColor(change: number): string {
		if (change > 0) return 'text-green-600'
		if (change < 0) return 'text-red-600'
		return 'text-gray-600'
	}
</script>

<Modal
	bind:open
	size="lg"
	title="Modify Savings Goal"
	showCloseButton={true}
	closeOnBackdrop={false}
	closeOnEscape={true}
	on:close={handleClose}
>
	{#if envelope}
		<div class="space-y-6">
			<!-- Current Goal Information -->
			<div class="bg-blue-50 rounded-lg p-4">
				<h3 class="text-sm font-medium text-blue-900 mb-2">Current Goal</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-blue-700 font-medium">Target Amount:</span>
						<span class="text-blue-900 ml-2">{formatCurrency(envelope.target_amount || 0)}</span>
					</div>
					<div>
						<span class="text-blue-700 font-medium">Target Date:</span>
						<span class="text-blue-900 ml-2">
							{envelope.target_date ? formatDate(new Date(envelope.target_date)) : 'Not set'}
						</span>
					</div>
					<div>
						<span class="text-blue-700 font-medium">Current Balance:</span>
						<span class="text-blue-900 ml-2">{formatCurrency(envelope.balance)}</span>
					</div>
					<div>
						<span class="text-blue-700 font-medium">Current Progress:</span>
						<span class="text-blue-900 ml-2">
							{currentProgress ? `${currentProgress.progressPercentage.toFixed(1)}%` : '0%'}
						</span>
					</div>
				</div>
			</div>
			
			<!-- Modification Form -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium text-gray-900">Update Goal Details</h3>
				
				<!-- Target Amount -->
				<FormInput
					label="Target Amount"
					type="number"
					bind:value={targetAmount}
					placeholder="Enter target amount"
					error={errors.targetAmount}
					required={true}
					min="0.01"
					max="10000000"
					step="0.01"
				/>
				
				<!-- Target Date -->
				<FormInput
					label="Target Date (Optional)"
					type="date"
					bind:value={targetDate}
					error={errors.targetDate}
					helpText="Leave empty if you don't want to set a target date"
				/>
			</div>
			
			<!-- Progress Impact Preview -->
			{#if progressImpact && hasChanges && isFormValid}
				<div class="bg-gray-50 rounded-lg p-4">
					<h3 class="text-sm font-medium text-gray-900 mb-3">Impact Preview</h3>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
						<div>
							<span class="text-gray-600">Current Progress:</span>
							<div class="font-medium text-gray-900">{progressImpact.oldProgress.toFixed(1)}%</div>
						</div>
						<div>
							<span class="text-gray-600">New Progress:</span>
							<div class="font-medium text-gray-900">{progressImpact.newProgress.toFixed(1)}%</div>
						</div>
						<div>
							<span class="text-gray-600">Change:</span>
							<div class="font-medium {getProgressChangeColor(progressImpact.progressChange)}">
								{formatProgressChange(progressImpact.progressChange)}
							</div>
						</div>
					</div>
					
					{#if newProgress}
						<div class="mt-3 pt-3 border-t border-gray-200">
							<div class="flex items-center justify-between text-xs text-gray-600 mb-1">
								<span>New Progress</span>
								<span>{newProgress.progressPercentage.toFixed(1)}%</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div
									class="bg-blue-600 h-2 rounded-full transition-all duration-300"
									style="width: {Math.min(100, newProgress.progressPercentage)}%"
								></div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
			
			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-3 pt-4">
				<LoadingButton
					{loading}
					disabled={!isFormValid || !hasChanges}
					variant="primary"
					fullWidth={true}
					on:click={saveGoalModifications}
				>
					Save Changes
				</LoadingButton>
				<button
					type="button"
					on:click={handleCancel}
					disabled={loading}
					class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}
</Modal>

<style>
	/* Additional styles if needed */
</style>