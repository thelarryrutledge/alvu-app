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
			targetAmount: number
			targetDate?: string
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
	export let targetAmount = 0
	export let targetDate = ''
	export let description = ''
	export let categories: Category[] = []
	export let existingEnvelopeNames: string[] = []
	export let errors: Record<string, string> = {}
	export let disabled = false
	
	// Validation functions
	function validateName(value: string): string[] {
		const validationErrors: string[] = []
		
		if (!value.trim()) {
			validationErrors.push('Savings goal name is required')
			return validationErrors
		}
		
		if (value.trim().length < 2) {
			validationErrors.push('Savings goal name must be at least 2 characters long')
		}
		
		if (value.trim().length > 100) {
			validationErrors.push('Savings goal name must be 100 characters or less')
		}
		
		// Check for duplicate names (case-insensitive)
		const existingNames = existingEnvelopeNames.map(n => n.toLowerCase())
		if (existingNames.includes(value.trim().toLowerCase())) {
			validationErrors.push('A savings goal with this name already exists')
		}
		
		return validationErrors
	}
	
	function validateBalance(value: number): string[] {
		const validationErrors: string[] = []
		
		if (value < 0) {
			validationErrors.push('Starting balance cannot be negative for savings goals')
		}
		
		if (value > 10000000) {
			validationErrors.push('Starting balance cannot exceed $10,000,000')
		}
		
		return validationErrors
	}
	
	function validateTargetAmount(value: number): string[] {
		const validationErrors: string[] = []
		
		if (!value || value <= 0) {
			validationErrors.push('Target amount is required and must be greater than $0')
		}
		
		if (value > 10000000) {
			validationErrors.push('Target amount cannot exceed $10,000,000')
		}
		
		if (value <= balance) {
			validationErrors.push('Target amount should be greater than your starting balance')
		}
		
		return validationErrors
	}
	
	function validateTargetDate(value: string): string[] {
		const validationErrors: string[] = []
		
		if (value) {
			const targetDate = new Date(value)
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			
			if (isNaN(targetDate.getTime())) {
				validationErrors.push('Please enter a valid date (YYYY-MM-DD)')
			} else if (targetDate <= today) {
				validationErrors.push('Target date must be in the future')
			} else {
				// Check if date is too far in the future (50 years)
				const maxDate = new Date()
				maxDate.setFullYear(maxDate.getFullYear() + 50)
				if (targetDate > maxDate) {
					validationErrors.push('Target date cannot be more than 50 years in the future')
				}
			}
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
		
		// Validate target amount
		const targetAmountErrors = validateTargetAmount(targetAmount)
		if (targetAmountErrors.length > 0) {
			validationErrors.targetAmount = targetAmountErrors[0]
		}
		
		// Validate target date
		const targetDateErrors = validateTargetDate(targetDate)
		if (targetDateErrors.length > 0) {
			validationErrors.targetDate = targetDateErrors[0]
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
			targetAmount,
			targetDate: targetDate.trim(),
			description: description.trim()
		})
		
		// Validate and emit validation results
		const validation = validateAll()
		dispatch('validate', validation)
	}
	
	// Auto-select "Savings" category if available
	function autoSelectSavingsCategory() {
		if (!categoryId && categories.length > 0) {
			const savingsCategory = categories.find(cat => 
				cat.name.toLowerCase() === 'savings' || 
				(cat.is_default && cat.name.toLowerCase().includes('saving'))
			)
			if (savingsCategory) {
				categoryId = savingsCategory.id
				handleChange()
			}
		}
	}
	
	// Calculate progress percentage
	function calculateProgress(): number {
		if (!targetAmount || targetAmount === 0) return 0
		return Math.min(100, Math.max(0, (balance / targetAmount) * 100))
	}
	
	// Calculate remaining amount needed
	function calculateRemainingAmount(): number {
		return Math.max(0, targetAmount - balance)
	}
	
	// Calculate months to target date
	function calculateMonthsToTarget(): number {
		if (!targetDate) return 0
		const target = new Date(targetDate)
		const today = new Date()
		const monthsDiff = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth())
		return Math.max(0, monthsDiff)
	}
	
	// Calculate monthly savings needed
	function calculateMonthlySavingsNeeded(): number {
		const remaining = calculateRemainingAmount()
		const months = calculateMonthsToTarget()
		if (months === 0) return remaining
		return remaining / months
	}
	
	// Format currency for display
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}
	
	// Format date for display
	function formatDate(dateString: string): string {
		if (!dateString) return ''
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})
		} catch {
			return dateString
		}
	}
	
	// Generate suggestions for savings goals
	function getSavingsGoalSuggestions(): string[] {
		const suggestions: string[] = []
		
		if (targetAmount > 0 && balance >= targetAmount) {
			suggestions.push('Congratulations! You\'ve already reached your savings goal. Consider setting a new, higher target.')
		}
		
		if (targetDate && calculateMonthsToTarget() > 0) {
			const monthlyNeeded = calculateMonthlySavingsNeeded()
			if (monthlyNeeded > 0) {
				suggestions.push(`To reach your goal by ${formatDate(targetDate)}, save approximately ${formatCurrency(monthlyNeeded)} per month.`)
			}
		}
		
		if (targetAmount > 50000) {
			suggestions.push('Large savings goals are great! Consider breaking this into smaller milestones to track progress.')
		}
		
		if (name.toLowerCase().includes('emergency') && targetAmount < 5000) {
			suggestions.push('Emergency funds typically should cover 3-6 months of expenses. Consider if your target is sufficient.')
		}
		
		if (targetDate && calculateMonthsToTarget() < 6 && calculateRemainingAmount() > 5000) {
			suggestions.push('This is an ambitious timeline for your goal. Consider extending the target date or increasing monthly contributions.')
		}
		
		return suggestions
	}
	
	// Reactive category options
	$: categoryOptions = categories.map(cat => ({
		value: cat.id,
		label: cat.name
	}))
	
	// Reactive validation
	$: if (name || categoryId || balance !== undefined || targetAmount !== undefined || targetDate || description) {
		handleChange()
	}
	
	// Auto-select category when categories load
	$: if (categories.length > 0 && !categoryId) {
		autoSelectSavingsCategory()
	}
	
	// Reactive calculations
	$: progress = calculateProgress()
	$: remainingAmount = calculateRemainingAmount()
	$: monthsToTarget = calculateMonthsToTarget()
	$: monthlySavingsNeeded = calculateMonthlySavingsNeeded()
	$: suggestions = getSavingsGoalSuggestions()
</script>

<div class="savings-envelope-config space-y-6">
	<!-- Configuration Header -->
	<div class="border-b border-gray-200 pb-4">
		<h3 class="text-lg font-medium text-gray-900">Savings Goal Configuration</h3>
		<p class="text-sm text-gray-600 mt-1">
			Set up a savings goal with target amount and timeline to track your progress
		</p>
	</div>
	
	<!-- Basic Settings -->
	<div class="space-y-4">
		<h4 class="text-md font-medium text-gray-900">Basic Settings</h4>
		
		<!-- Savings Goal Name -->
		<FormInput
			label="Savings Goal Name"
			bind:value={name}
			type="text"
			placeholder="e.g., Emergency Fund, Vacation, New Car, House Down Payment"
			required={true}
			error={errors.name}
			hint="Choose a descriptive name that motivates you to reach your goal"
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
			hint="Choose which category this savings goal belongs to"
			placeholder="Select a category"
			{disabled}
		/>
		
		<!-- Starting Balance -->
		<FormInput
			label="Starting Balance"
			bind:value={balance}
			type="number"
			step="0.01"
			min="0"
			max="10000000"
			required={true}
			error={errors.balance}
			hint="Enter how much you already have saved toward this goal"
			{disabled}
		/>
	</div>
	
	<!-- Goal Settings -->
	<div class="space-y-4">
		<h4 class="text-md font-medium text-gray-900">Goal Settings</h4>
		
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
			hint="How much do you want to save in total?"
			{disabled}
		/>
		
		<!-- Target Date -->
		<FormInput
			label="Target Date (Optional)"
			bind:value={targetDate}
			type="text"
			placeholder="YYYY-MM-DD"
			error={errors.targetDate}
			hint="When do you want to reach your savings goal? (Format: YYYY-MM-DD)"
			{disabled}
		/>
		
		<!-- Description -->
		<FormTextarea
			label="Description (Optional)"
			bind:value={description}
			placeholder="Add notes about this savings goal, what you're saving for, or motivation..."
			error={errors.description}
			hint="Optional details to help you stay motivated and focused"
			maxlength={500}
			rows={3}
			{disabled}
		/>
	</div>
	
	<!-- Progress Tracking -->
	{#if targetAmount > 0}
		<div class="space-y-4">
			<h4 class="text-md font-medium text-gray-900">Progress Tracking</h4>
			
			<div class="bg-green-50 border border-green-200 rounded-lg p-4">
				<div class="space-y-3">
					<!-- Progress Bar -->
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-green-800">Progress</span>
						<span class="text-sm text-green-600">{Math.round(progress)}%</span>
					</div>
					<div class="w-full bg-green-200 rounded-full h-3">
						<div 
							class="bg-green-600 h-3 rounded-full transition-all duration-300" 
							style="width: {progress}%"
						></div>
					</div>
					
					<!-- Progress Details -->
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="text-green-700">Saved:</span>
							<span class="font-medium text-green-900 ml-1">{formatCurrency(balance)}</span>
						</div>
						<div>
							<span class="text-green-700">Target:</span>
							<span class="font-medium text-green-900 ml-1">{formatCurrency(targetAmount)}</span>
						</div>
						<div>
							<span class="text-green-700">Remaining:</span>
							<span class="font-medium text-green-900 ml-1">{formatCurrency(remainingAmount)}</span>
						</div>
						{#if targetDate && monthsToTarget > 0}
							<div>
								<span class="text-green-700">Monthly needed:</span>
								<span class="font-medium text-green-900 ml-1">{formatCurrency(monthlySavingsNeeded)}</span>
							</div>
						{/if}
					</div>
					
					{#if targetDate}
						<div class="text-xs text-green-600 pt-2 border-t border-green-200">
							Target date: {formatDate(targetDate)} ({monthsToTarget} months)
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Savings Features -->
	<div class="space-y-4">
		<h4 class="text-md font-medium text-gray-900">Savings Goal Features</h4>
		
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<div class="flex items-start">
				<svg class="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
				</svg>
				<div class="flex-1">
					<h5 class="text-sm font-medium text-blue-800">Savings Goal Benefits</h5>
					<ul class="text-sm text-blue-700 mt-1 space-y-1">
						<li>• Visual progress tracking with percentage completion</li>
						<li>• Target amount and date to keep you motivated</li>
						<li>• Automatic calculation of monthly savings needed</li>
						<li>• Progress indicators to celebrate milestones</li>
						<li>• Perfect for emergency funds, vacations, and major purchases</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Preview Section -->
	{#if name || targetAmount > 0}
		<div class="space-y-4">
			<h4 class="text-md font-medium text-gray-900">Preview</h4>
			
			<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
				<div class="flex items-center justify-between">
					<div class="flex-1 min-w-0">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
									Savings
								</span>
							</div>
							<div class="ml-4 flex-1 min-w-0">
								<h5 class="text-sm font-medium text-gray-900 truncate">
									{name || 'Savings Goal Name'}
								</h5>
								<div class="flex items-center mt-1 text-sm text-gray-500">
									<span>Balance: {formatCurrency(balance)}</span>
									{#if targetAmount > 0}
										<span class="mx-2">•</span>
										<span>Goal: {formatCurrency(targetAmount)}</span>
									{/if}
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
					
					<!-- Progress Display -->
					{#if targetAmount > 0}
						<div class="flex items-center space-x-2 ml-4">
							<div class="w-24 bg-gray-200 rounded-full h-2">
								<div 
									class="bg-green-600 h-2 rounded-full transition-all duration-300" 
									style="width: {progress}%"
								></div>
							</div>
							<span class="text-xs text-gray-600 w-10 text-right">
								{Math.round(progress)}%
							</span>
						</div>
					{/if}
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