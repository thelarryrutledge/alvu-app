<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import PageLoading from '$lib/components/PageLoading.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import AddTransactionForm from '$lib/components/AddTransactionForm.svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import type { Envelope, Transaction } from '$lib/types/database'
	
	// Dashboard data state
	let loading = true
	let initialLoad = true
	let loadingEnvelopes = false
	let loadingTransactions = false
	let loadingFunds = false
	let loadingRefresh = false
	let availableFunds = 0
	let totalEnvelopes = 0
	let recentTransactionsCount = 0
	let envelopes: Envelope[] = []
	let recentTransactions: Transaction[] = []
	let lastUpdated = new Date()
	let refreshInterval: NodeJS.Timeout | null = null
	let autoRefreshEnabled = true
	let refreshCountdown = 0
	let countdownInterval: NodeJS.Timeout | null = null
	
	// Transaction modal state
	let showTransactionModal = false
	let preselectedTransactionType: 'income' | 'expense' | 'transfer' | 'allocation' | null = null
	
	// Loading progress tracking
	let loadingProgress = 0
	let loadingSteps = ['Initializing...', 'Loading envelopes...', 'Loading transactions...', 'Calculating funds...', 'Finalizing...']
	let currentLoadingStep = 0
	let loadingMessage = ''
	
	// Error states
	let hasError = false
	let errorMessage = ''
	
	// Load dashboard data
	async function loadDashboardData(isRefresh = false) {
		if (!$user) return
		
		// Set loading states
		if (isRefresh) {
			loadingRefresh = true
		} else {
			loading = true
		}
		
		loadingProgress = 0
		currentLoadingStep = 0
		hasError = false
		errorMessage = ''
		
		try {
			// Step 1: Initialize
			currentLoadingStep = 0
			loadingProgress = 10
			loadingMessage = loadingSteps[0]
			await new Promise(resolve => setTimeout(resolve, 100)) // Brief pause for UX
			
			// Step 2: Fetch envelopes
			currentLoadingStep = 1
			loadingProgress = 25
			loadingMessage = loadingSteps[1]
			loadingEnvelopes = true
			
			const { data: envelopesData, error: envelopesError } = await supabase
				.from('envelopes')
				.select('*')
				.eq('user_id', $user.id)
				.order('created_at', { ascending: false })
			
			if (envelopesError) {
				console.error('Error fetching envelopes:', envelopesError)
				if (!isRefresh) {
					hasError = true
					errorMessage = 'Failed to load envelopes'
				}
				toastHelpers.error('Failed to load envelopes. Some data may be incomplete.')
			} else {
				envelopes = envelopesData || []
				totalEnvelopes = envelopes.length
			}
			
			loadingEnvelopes = false
			loadingProgress = 50
			
			// Step 3: Fetch recent transactions
			currentLoadingStep = 2
			loadingProgress = 60
			loadingMessage = loadingSteps[2]
			loadingTransactions = true
			
			const { data: transactionsData, error: transactionsError } = await supabase
				.from('transactions')
				.select('*')
				.eq('user_id', $user.id)
				.order('created_at', { ascending: false })
				.limit(5)
			
			if (transactionsError) {
				console.error('Error fetching transactions:', transactionsError)
				if (!isRefresh) {
					hasError = true
					errorMessage = 'Failed to load transactions'
				}
				toastHelpers.error('Failed to load recent transactions. Some data may be incomplete.')
			} else {
				recentTransactions = transactionsData || []
				recentTransactionsCount = recentTransactions.length
			}
			
			loadingTransactions = false
			loadingProgress = 80
			
			// Step 4: Calculate available funds
			currentLoadingStep = 3
			loadingProgress = 90
			loadingMessage = loadingSteps[3]
			loadingFunds = true
			
			// Calculate available funds (this would be from a dedicated available_funds calculation)
			// For now, we'll use a placeholder calculation
			availableFunds = calculateAvailableFunds()
			
			loadingFunds = false
			
			// Step 5: Finalize
			currentLoadingStep = 4
			loadingProgress = 100
			loadingMessage = loadingSteps[4]
			
			lastUpdated = new Date()
			
			// Brief pause to show completion
			await new Promise(resolve => setTimeout(resolve, 200))
			
		} catch (error) {
			console.error('Error loading dashboard data:', error)
			hasError = true
			errorMessage = 'Failed to load dashboard data'
			if (!isRefresh) {
				toastHelpers.error('Failed to load dashboard data. Please try again.')
			}
		} finally {
			loading = false
			initialLoad = false
			loadingRefresh = false
			loadingEnvelopes = false
			loadingTransactions = false
			loadingFunds = false
			loadingProgress = 0
			currentLoadingStep = 0
			loadingMessage = ''
		}
	}
	
	// Calculate available funds (placeholder implementation)
	function calculateAvailableFunds(): number {
		// This would typically come from a database function or calculation
		// For now, return 0 as we haven't implemented income/allocation logic yet
		return 0
	}
	
	// Refresh dashboard data
	async function refreshData() {
		await loadDashboardData(true)
		resetRefreshCountdown()
		toastHelpers.success('Dashboard data refreshed successfully')
	}
	
	// Auto-refresh functionality
	function startAutoRefresh() {
		if (refreshInterval) clearInterval(refreshInterval)
		if (countdownInterval) clearInterval(countdownInterval)
		
		// Refresh every 5 minutes (300 seconds)
		refreshInterval = setInterval(() => {
			if (autoRefreshEnabled && !loading) {
				loadDashboardData()
			}
		}, 300000)
		
		resetRefreshCountdown()
	}
	
	function stopAutoRefresh() {
		if (refreshInterval) {
			clearInterval(refreshInterval)
			refreshInterval = null
		}
		if (countdownInterval) {
			clearInterval(countdownInterval)
			countdownInterval = null
		}
		refreshCountdown = 0
	}
	
	function resetRefreshCountdown() {
		refreshCountdown = 300 // 5 minutes in seconds
		
		if (countdownInterval) clearInterval(countdownInterval)
		
		if (autoRefreshEnabled) {
			countdownInterval = setInterval(() => {
				refreshCountdown--
				if (refreshCountdown <= 0) {
					refreshCountdown = 300
				}
			}, 1000)
		}
	}
	
	function toggleAutoRefresh() {
		autoRefreshEnabled = !autoRefreshEnabled
		if (autoRefreshEnabled) {
			startAutoRefresh()
		} else {
			stopAutoRefresh()
		}
	}
	
	// Format countdown time
	function formatCountdown(seconds: number): string {
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
	}
	
	// Load data when component mounts
	onMount(() => {
		loadDashboardData()
		startAutoRefresh()
		
		// Cleanup on component destroy
		return () => {
			stopAutoRefresh()
		}
	})
	
	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}
	
	// Format date
	function formatDate(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		})
	}
	
	// Quick Action Handlers
	function handleAddIncome() {
		preselectedTransactionType = 'income'
		showTransactionModal = true
	}
	
	function handleAddExpense() {
		// Check if user has envelopes first
		if (totalEnvelopes === 0) {
			toastHelpers.warning('Please create some envelopes first before adding expenses.')
			goto('/envelopes')
			return
		}
		preselectedTransactionType = 'expense'
		showTransactionModal = true
	}
	
	function handleTransfer() {
		// Check if user has at least 2 envelopes for transfer
		if (totalEnvelopes < 2) {
			toastHelpers.warning('You need at least 2 envelopes to transfer funds between them.')
			goto('/envelopes')
			return
		}
		preselectedTransactionType = 'transfer'
		showTransactionModal = true
	}
	
	function handleAllocate() {
		// Check if user has available funds to allocate
		if (availableFunds <= 0) {
			toastHelpers.warning('No available funds to allocate. Please add some income first.')
			return
		}
		// Check if user has envelopes to allocate to
		if (totalEnvelopes === 0) {
			toastHelpers.warning('Please create some envelopes first before allocating funds.')
			goto('/envelopes')
			return
		}
		preselectedTransactionType = 'allocation'
		showTransactionModal = true
	}
	
	// Transaction modal handlers
	function handleTransactionSuccess(event: CustomEvent<{ id: string; type: string; amount: number }>) {
		showTransactionModal = false
		preselectedTransactionType = null
		// Refresh dashboard data to show updated balances
		loadDashboardData(true)
		// Success message is handled by the form component
	}
	
	function handleTransactionCancel() {
		showTransactionModal = false
		preselectedTransactionType = null
	}
	
	// Progress calculation helpers
	function calculateSavingsProgress(envelope: Envelope): { percentage: number; status: string; timeToGoal?: string } {
		if (!envelope.target_amount || envelope.target_amount <= 0) {
			return { percentage: 0, status: 'no-goal' }
		}
		
		const percentage = Math.min(100, Math.max(0, (envelope.balance / envelope.target_amount) * 100))
		let status = 'in-progress'
		
		if (percentage >= 100) {
			status = 'completed'
		} else if (percentage >= 75) {
			status = 'near-completion'
		} else if (percentage >= 50) {
			status = 'halfway'
		} else if (percentage >= 25) {
			status = 'quarter'
		} else {
			status = 'starting'
		}
		
		// Calculate estimated time to goal (simplified calculation)
		let timeToGoal = undefined
		if (percentage > 0 && percentage < 100) {
			const remaining = envelope.target_amount - envelope.balance
			// Assume average monthly contribution based on current progress
			// This is a simplified calculation - in real app would use transaction history
			const monthlyContribution = envelope.balance / 3 // Assume 3 months of data
			if (monthlyContribution > 0) {
				const monthsToGoal = Math.ceil(remaining / monthlyContribution)
				if (monthsToGoal <= 12) {
					timeToGoal = `${monthsToGoal} month${monthsToGoal === 1 ? '' : 's'}`
				} else {
					const yearsToGoal = Math.round(monthsToGoal / 12 * 10) / 10
					timeToGoal = `${yearsToGoal} year${yearsToGoal === 1 ? '' : 's'}`
				}
			}
		}
		
		return { percentage, status, timeToGoal }
	}
	
	function calculateDebtProgress(envelope: Envelope): { percentage: number; status: string; payoffProjection?: string } {
		if (!envelope.target_amount || envelope.target_amount >= 0) {
			return { percentage: 0, status: 'no-debt' }
		}
		
		const totalDebt = Math.abs(envelope.target_amount)
		const currentDebt = Math.abs(envelope.balance)
		const paidOff = totalDebt - currentDebt
		const percentage = Math.min(100, Math.max(0, (paidOff / totalDebt) * 100))
		
		let status = 'paying-down'
		
		if (percentage >= 100) {
			status = 'paid-off'
		} else if (percentage >= 75) {
			status = 'almost-done'
		} else if (percentage >= 50) {
			status = 'halfway-paid'
		} else if (percentage >= 25) {
			status = 'making-progress'
		} else {
			status = 'starting-payoff'
		}
		
		// Calculate payoff projection (simplified)
		let payoffProjection = undefined
		if (percentage > 0 && percentage < 100) {
			// Assume average monthly payment based on progress
			const monthlyPayment = paidOff / 3 // Assume 3 months of data
			if (monthlyPayment > 0) {
				const monthsToPayoff = Math.ceil(currentDebt / monthlyPayment)
				if (monthsToPayoff <= 12) {
					payoffProjection = `${monthsToPayoff} month${monthsToPayoff === 1 ? '' : 's'}`
				} else {
					const yearsToPayoff = Math.round(monthsToPayoff / 12 * 10) / 10
					payoffProjection = `${yearsToPayoff} year${yearsToPayoff === 1 ? '' : 's'}`
				}
			}
		}
		
		return { percentage, status, payoffProjection }
	}
	
	function getProgressBarColor(type: string, status: string): string {
		if (type === 'savings') {
			switch (status) {
				case 'completed': return 'bg-green-600'
				case 'near-completion': return 'bg-green-500'
				case 'halfway': return 'bg-green-400'
				case 'quarter': return 'bg-yellow-400'
				case 'starting': return 'bg-yellow-300'
				default: return 'bg-gray-300'
			}
		} else if (type === 'debt') {
			switch (status) {
				case 'paid-off': return 'bg-green-600'
				case 'almost-done': return 'bg-green-500'
				case 'halfway-paid': return 'bg-blue-400'
				case 'making-progress': return 'bg-blue-300'
				case 'starting-payoff': return 'bg-red-300'
				default: return 'bg-red-400'
			}
		}
		return 'bg-gray-300'
	}
	
	function getProgressMessage(type: string, status: string, percentage: number): string {
		if (type === 'savings') {
			switch (status) {
				case 'completed': return '🎉 Goal achieved!'
				case 'near-completion': return '🚀 Almost there!'
				case 'halfway': return '💪 Halfway to your goal'
				case 'quarter': return '📈 Making good progress'
				case 'starting': return '🌱 Great start!'
				default: return 'Set a goal to track progress'
			}
		} else if (type === 'debt') {
			switch (status) {
				case 'paid-off': return '🎉 Debt paid off!'
				case 'almost-done': return '🏁 Almost debt-free!'
				case 'halfway-paid': return '💪 Halfway paid off'
				case 'making-progress': return '📉 Making progress'
				case 'starting-payoff': return '🎯 Starting payoff journey'
				default: return 'Track your debt payoff'
			}
		}
		return ''
	}

	// Check if user is new (no envelopes and no transactions)
	$: isNewUser = !loading && totalEnvelopes === 0 && recentTransactionsCount === 0
</script>

<ProtectedRoute>
	<AppLayout title="Dashboard - Alvu">
		<!-- Initial Loading Screen -->
		{#if initialLoad && loading}
			<PageLoading
				title="Loading Dashboard"
				subtitle="Fetching your financial data..."
				variant="spinner"
			/>
		{:else}
		<!-- Dashboard Container -->
		<div class="dashboard-container">
			<!-- Loading Progress Bar -->
			{#if loading && !initialLoad}
				<div class="fixed top-0 left-0 right-0 z-50">
					<div class="bg-blue-600 h-1 transition-all duration-300 ease-out" style="width: {loadingProgress}%"></div>
				</div>
				<div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<LoadingSpinner size="sm" color="primary" />
							<span class="text-sm font-medium text-blue-900">
								{loadingMessage || loadingSteps[currentLoadingStep] || 'Loading...'}
							</span>
						</div>
						<div class="text-sm text-blue-600">
							{loadingProgress}%
						</div>
					</div>
					<div class="mt-2 w-full bg-blue-200 rounded-full h-2">
						<div
							class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
							style="width: {loadingProgress}%"
						></div>
					</div>
				</div>
			{/if}

			<!-- Error State -->
			{#if hasError && !loading}
				<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div class="flex-1">
							<h3 class="text-sm font-medium text-red-800">
								{errorMessage || 'Something went wrong'}
							</h3>
							<p class="text-sm text-red-600 mt-1">
								Please try refreshing the page or contact support if the problem persists.
							</p>
						</div>
						<button
							on:click={refreshData}
							class="ml-4 inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
						>
							Try Again
						</button>
					</div>
				</div>
			{/if}

			<!-- Page Header Section -->
			<header class="dashboard-header mb-6 sm:mb-8">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div class="flex-1 min-w-0">
						<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Dashboard</h1>
						{#if $user}
							<p class="text-gray-600 mt-1 text-sm sm:text-base truncate">Welcome back, {$user.user_metadata?.first_name || $user.email}!</p>
						{/if}
					</div>
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
						<!-- Mobile-first responsive controls -->
						<div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
							<!-- Auto-refresh toggle -->
							<button
								on:click={toggleAutoRefresh}
								class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md {autoRefreshEnabled ? 'text-green-700 bg-green-50 border-green-300' : 'text-gray-700 bg-white'} hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
							>
								<svg class="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span class="hidden sm:inline">Auto-refresh {autoRefreshEnabled ? 'ON' : 'OFF'}</span>
								<span class="sm:hidden">Auto {autoRefreshEnabled ? 'ON' : 'OFF'}</span>
							</button>
							
							<!-- Manual refresh button -->
							<button
								on:click={refreshData}
								disabled={loading || loadingRefresh}
								class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
							>
								<svg class="w-4 h-4 mr-1 sm:mr-2 {(loading || loadingRefresh) ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								<span class="hidden sm:inline">{(loading || loadingRefresh) ? 'Refreshing...' : 'Refresh'}</span>
								<span class="sm:hidden">{(loading || loadingRefresh) ? '...' : 'Refresh'}</span>
							</button>
						</div>
						
						<!-- Status display - responsive -->
						<div class="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
							<div class="truncate">Last updated: {formatDate(lastUpdated)}</div>
							{#if autoRefreshEnabled && refreshCountdown > 0}
								<div class="text-xs text-green-600 truncate">
									<span class="hidden sm:inline">Next refresh: {formatCountdown(refreshCountdown)}</span>
									<span class="sm:hidden">{formatCountdown(refreshCountdown)}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</header>

			<!-- New User Empty State -->
			{#if isNewUser}
				<div class="new-user-onboarding">
					<!-- Welcome Hero Section -->
					<div class="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl shadow-lg mb-8">
						<div class="p-8 text-center">
							<div class="mx-auto w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
								<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<h2 class="text-3xl font-bold text-blue-900 mb-4">Welcome to Alvu!</h2>
							<p class="text-lg text-blue-700 mb-6 max-w-2xl mx-auto">
								Your personal budget management app. Let's get you started with envelope budgeting to take control of your finances.
							</p>
							<div class="bg-white rounded-lg p-6 max-w-md mx-auto shadow-sm">
								<h3 class="text-lg font-semibold text-gray-900 mb-2">Ready to begin?</h3>
								<p class="text-sm text-gray-600 mb-4">Follow these simple steps to set up your budget</p>
								<div class="flex justify-center space-x-3">
									<a
										href="/envelopes"
										class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
									>
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
										</svg>
										Create First Envelope
									</a>
									<a
										href="/income"
										class="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors duration-200"
									>
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
										</svg>
										Set Up Income
									</a>
								</div>
							</div>
						</div>
					</div>

					<!-- Getting Started Steps -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
						<!-- Step-by-step Guide -->
						<div class="bg-white rounded-lg shadow-lg">
							<div class="p-6 border-b border-gray-200">
								<h3 class="text-xl font-semibold text-gray-900">Getting Started Guide</h3>
								<p class="text-sm text-gray-600 mt-1">Follow these steps to set up your budget</p>
							</div>
							<div class="p-6">
								<div class="space-y-6">
									<div class="flex items-start">
										<div class="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4">
											<span class="text-sm font-bold text-white">1</span>
										</div>
										<div class="flex-1">
											<h4 class="text-lg font-medium text-gray-900 mb-2">Create Budget Envelopes</h4>
											<p class="text-sm text-gray-600 mb-3">
												Set up categories for your spending like groceries, rent, entertainment, and savings goals.
											</p>
											<a
												href="/envelopes"
												class="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
											>
												Create envelopes →
											</a>
										</div>
									</div>
									
									<div class="flex items-start">
										<div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4">
											<span class="text-sm font-bold text-white">2</span>
										</div>
										<div class="flex-1">
											<h4 class="text-lg font-medium text-gray-900 mb-2">Add Income Sources</h4>
											<p class="text-sm text-gray-600 mb-3">
												Set up your salary, freelance work, or other regular income sources.
											</p>
											<a
												href="/income"
												class="inline-flex items-center text-sm text-green-600 hover:text-green-500 font-medium"
											>
												Add income sources →
											</a>
										</div>
									</div>
									
									<div class="flex items-start">
										<div class="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-4">
											<span class="text-sm font-bold text-white">3</span>
										</div>
										<div class="flex-1">
											<h4 class="text-lg font-medium text-gray-900 mb-2">Record Your First Income</h4>
											<p class="text-sm text-gray-600 mb-3">
												Add money to your budget and allocate it to your envelopes.
											</p>
											<button
												on:click={handleAddIncome}
												class="inline-flex items-center text-sm text-purple-600 hover:text-purple-500 font-medium"
											>
												Add income →
											</button>
										</div>
									</div>
									
									<div class="flex items-start">
										<div class="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-4">
											<span class="text-sm font-bold text-white">4</span>
										</div>
										<div class="flex-1">
											<h4 class="text-lg font-medium text-gray-900 mb-2">Start Tracking Expenses</h4>
											<p class="text-sm text-gray-600 mb-3">
												Record your spending and watch your envelope balances update in real-time.
											</p>
											<button
												on:click={handleAddExpense}
												class="inline-flex items-center text-sm text-orange-600 hover:text-orange-500 font-medium"
											>
												Track expenses →
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- What is Envelope Budgeting -->
						<div class="bg-white rounded-lg shadow-lg">
							<div class="p-6 border-b border-gray-200">
								<h3 class="text-xl font-semibold text-gray-900">What is Envelope Budgeting?</h3>
								<p class="text-sm text-gray-600 mt-1">Learn about this powerful budgeting method</p>
							</div>
							<div class="p-6">
								<div class="space-y-4">
									<div class="flex items-start">
										<div class="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
											<svg class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
											</svg>
										</div>
										<div>
											<h4 class="font-medium text-gray-900">Allocate Every Dollar</h4>
											<p class="text-sm text-gray-600">Give every dollar a purpose by assigning it to specific spending categories.</p>
										</div>
									</div>
									
									<div class="flex items-start">
										<div class="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
											<svg class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
											</svg>
										</div>
										<div>
											<h4 class="font-medium text-gray-900">Prevent Overspending</h4>
											<p class="text-sm text-gray-600">Know exactly how much you can spend in each category without going over budget.</p>
										</div>
									</div>
									
									<div class="flex items-start">
										<div class="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
											<svg class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
											</svg>
										</div>
										<div>
											<h4 class="font-medium text-gray-900">Build Savings</h4>
											<p class="text-sm text-gray-600">Create dedicated envelopes for emergency funds and savings goals.</p>
										</div>
									</div>
									
									<div class="flex items-start">
										<div class="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
											<svg class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
											</svg>
										</div>
										<div>
											<h4 class="font-medium text-gray-900">Track Progress</h4>
											<p class="text-sm text-gray-600">See your financial progress in real-time with visual indicators and reports.</p>
										</div>
									</div>
								</div>
								
								<div class="mt-6 p-4 bg-blue-50 rounded-lg">
									<h5 class="font-medium text-blue-900 mb-2">💡 Pro Tip</h5>
									<p class="text-sm text-blue-700">
										Start with just a few basic envelopes like "Groceries," "Gas," and "Entertainment."
										You can always add more categories as you get comfortable with the system.
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Quick Start Actions -->
					<div class="bg-gray-50 rounded-lg p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">Quick Start Actions</h3>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<a
								href="/envelopes"
								class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group"
							>
								<div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 transition-colors">
									<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
									</svg>
								</div>
								<h4 class="font-medium text-gray-900 group-hover:text-blue-600">Create Envelopes</h4>
								<p class="text-sm text-gray-600 mt-1">Set up your spending categories</p>
							</a>
							
							<a
								href="/income"
								class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group"
							>
								<div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition-colors">
									<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
									</svg>
								</div>
								<h4 class="font-medium text-gray-900 group-hover:text-green-600">Add Income</h4>
								<p class="text-sm text-gray-600 mt-1">Set up your income sources</p>
							</a>
							
							<a
								href="/categories"
								class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group"
							>
								<div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-600 transition-colors">
									<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
									</svg>
								</div>
								<h4 class="font-medium text-gray-900 group-hover:text-purple-600">Manage Categories</h4>
								<p class="text-sm text-gray-600 mt-1">Organize your envelopes</p>
							</a>
						</div>
					</div>
				</div>
			{:else}
				<!-- Main Dashboard Grid -->
				<div class="dashboard-grid space-y-8">
				<!-- Prominent Available Funds Display -->
				<section class="available-funds-hero">
					<div class="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-lg {autoRefreshEnabled ? 'ring-2 ring-green-300 ring-opacity-50' : ''}">
						<div class="p-8">
							<div class="text-center">
								<div class="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
									<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
									</svg>
								</div>
								<h2 class="text-lg font-medium text-green-900 mb-2">Available to Allocate</h2>
								<div class="text-4xl md:text-5xl font-bold text-green-700 mb-2">
									{#if loading || loadingFunds}
										<div class="flex items-center justify-center space-x-2">
											<LoadingSpinner size="lg" color="primary" />
											<div class="animate-pulse bg-green-200 h-12 w-48 rounded"></div>
										</div>
									{:else}
										{formatCurrency(availableFunds)}
									{/if}
								</div>
								<p class="text-green-600 text-sm">
									{#if availableFunds > 0}
										Ready to be allocated to your envelopes
									{:else}
										Add income to start budgeting
									{/if}
								</p>
								{#if availableFunds > 0}
									<div class="mt-4">
										<button
											on:click={handleAllocate}
											class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
										>
											<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
											</svg>
											Allocate Funds
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</section>

				<!-- Progress Goals Summary Section -->
				{#if envelopes.some(env => (env.type === 'savings' && env.target_amount && env.target_amount > 0) || (env.type === 'debt' && env.target_amount && env.target_amount < 0))}
					<section class="progress-goals-summary">
						<div class="mb-6">
							<h2 class="text-xl font-semibold text-gray-900">Goals & Progress</h2>
							<p class="text-sm text-gray-600">Track your savings goals and debt payoff progress</p>
						</div>
						
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<!-- Savings Goals -->
							{#if envelopes.filter(env => env.type === 'savings' && env.target_amount && env.target_amount > 0).length > 0}
								{@const savingsEnvelopes = envelopes.filter(env => env.type === 'savings' && env.target_amount && env.target_amount > 0)}
								<div class="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
									<div class="flex items-center mb-4">
										<div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
											<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
											</svg>
										</div>
										<div>
											<h3 class="text-lg font-semibold text-green-900">Savings Goals</h3>
											<p class="text-sm text-green-700">{savingsEnvelopes.length} active goal{savingsEnvelopes.length === 1 ? '' : 's'}</p>
										</div>
									</div>
									
									<div class="space-y-4">
										{#each savingsEnvelopes.slice(0, 3) as envelope}
											{@const progress = calculateSavingsProgress(envelope)}
											<div class="bg-white rounded-lg p-4 shadow-sm">
												<div class="flex items-center justify-between mb-2">
													<h4 class="font-medium text-gray-900 truncate">{envelope.name}</h4>
													<span class="text-sm font-semibold text-green-600">
														{Math.round(progress.percentage)}%
													</span>
												</div>
												
												<div class="mb-2">
													<div class="flex justify-between text-sm text-gray-600 mb-1">
														<span>{formatCurrency(envelope.balance)}</span>
														<span>{formatCurrency(envelope.target_amount || 0)}</span>
													</div>
													<div class="w-full bg-gray-200 rounded-full h-2">
														<div
															class="{getProgressBarColor('savings', progress.status)} h-2 rounded-full transition-all duration-500"
															style="width: {progress.percentage}%"
														></div>
													</div>
												</div>
												
												<div class="flex items-center justify-between text-xs">
													<span class="text-gray-600">
														{getProgressMessage('savings', progress.status, progress.percentage)}
													</span>
													{#if progress.timeToGoal}
														<span class="text-green-600 font-medium">
															{progress.timeToGoal} remaining
														</span>
													{/if}
												</div>
											</div>
										{/each}
										
										{#if savingsEnvelopes.length > 3}
											<div class="text-center">
												<a href="/envelopes" class="text-sm text-green-600 hover:text-green-500 font-medium">
													View all {savingsEnvelopes.length} savings goals →
												</a>
											</div>
										{/if}
									</div>
								</div>
							{/if}
							
							<!-- Debt Payoff -->
							{#if envelopes.filter(env => env.type === 'debt' && env.target_amount && env.target_amount < 0).length > 0}
								{@const debtEnvelopes = envelopes.filter(env => env.type === 'debt' && env.target_amount && env.target_amount < 0)}
								<div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
									<div class="flex items-center mb-4">
										<div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
											<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
											</svg>
										</div>
										<div>
											<h3 class="text-lg font-semibold text-blue-900">Debt Payoff</h3>
											<p class="text-sm text-blue-700">{debtEnvelopes.length} debt{debtEnvelopes.length === 1 ? '' : 's'} to pay off</p>
										</div>
									</div>
									
									<div class="space-y-4">
										{#each debtEnvelopes.slice(0, 3) as envelope}
											{@const progress = calculateDebtProgress(envelope)}
											<div class="bg-white rounded-lg p-4 shadow-sm">
												<div class="flex items-center justify-between mb-2">
													<h4 class="font-medium text-gray-900 truncate">{envelope.name}</h4>
													<span class="text-sm font-semibold text-blue-600">
														{Math.round(progress.percentage)}% paid
													</span>
												</div>
												
												<div class="mb-2">
													<div class="flex justify-between text-sm text-gray-600 mb-1">
														<span>Remaining: {formatCurrency(Math.abs(envelope.balance))}</span>
														<span>Total: {formatCurrency(Math.abs(envelope.target_amount || 0))}</span>
													</div>
													<div class="w-full bg-gray-200 rounded-full h-2">
														<div
															class="{getProgressBarColor('debt', progress.status)} h-2 rounded-full transition-all duration-500"
															style="width: {progress.percentage}%"
														></div>
													</div>
												</div>
												
												<div class="flex items-center justify-between text-xs">
													<span class="text-gray-600">
														{getProgressMessage('debt', progress.status, progress.percentage)}
													</span>
													{#if progress.payoffProjection}
														<span class="text-blue-600 font-medium">
															{progress.payoffProjection} to payoff
														</span>
													{/if}
												</div>
											</div>
										{/each}
										
										{#if debtEnvelopes.length > 3}
											<div class="text-center">
												<a href="/envelopes" class="text-sm text-blue-600 hover:text-blue-500 font-medium">
													View all {debtEnvelopes.length} debts →
												</a>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</section>
				{/if}

				<!-- Financial Overview Section -->
				<section class="financial-overview">
					<div class="mb-6">
						<h2 class="text-xl font-semibold text-gray-900">Financial Overview</h2>
						<p class="text-sm text-gray-600">Your current financial snapshot</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

						<!-- Total Envelopes Card -->
						<div class="bg-white overflow-hidden shadow rounded-lg">
							<div class="p-6">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
											<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
											</svg>
										</div>
									</div>
									<div class="ml-5 w-0 flex-1">
										<dl>
											<dt class="text-sm font-medium text-gray-500 truncate">Total Envelopes</dt>
											<dd class="text-2xl font-bold text-gray-900">
												{#if loading}
													<div class="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
												{:else}
													{totalEnvelopes}
												{/if}
											</dd>
											<dd class="text-sm text-gray-600 mt-1">
												{totalEnvelopes === 1 ? 'envelope' : 'envelopes'} created
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>

						<!-- Recent Transactions Card -->
						<div class="bg-white overflow-hidden shadow rounded-lg">
							<div class="p-6">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
											<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
											</svg>
										</div>
									</div>
									<div class="ml-5 w-0 flex-1">
										<dl>
											<dt class="text-sm font-medium text-gray-500 truncate">Recent Transactions</dt>
											<dd class="text-2xl font-bold text-gray-900">
												{#if loading}
													<div class="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
												{:else}
													{recentTransactionsCount}
												{/if}
											</dd>
											<dd class="text-sm text-gray-600 mt-1">
												in the last 5 transactions
											</dd>
										</dl>
									</div>
								</div>
						</div>
					</div>
				</section>

				<!-- Recent Transactions Preview Section -->
				<section class="recent-transactions-preview">
					<div class="mb-6">
						<div class="flex items-center justify-between">
							<div>
								<h2 class="text-xl font-semibold text-gray-900">Recent Transactions</h2>
								<p class="text-sm text-gray-600">Your latest financial activity</p>
							</div>
							<a href="/transactions" class="text-sm text-blue-600 hover:text-blue-500 font-medium">
								View all →
							</a>
						</div>
					</div>
					
					{#if loading || loadingTransactions}
						<div class="bg-white rounded-lg shadow overflow-hidden">
							{#if loadingTransactions}
								<div class="p-4 bg-blue-50 border-b border-blue-200">
									<div class="flex items-center justify-center space-x-2">
										<LoadingSpinner size="sm" color="primary" />
										<span class="text-sm text-blue-700">Loading recent transactions...</span>
									</div>
								</div>
							{/if}
							<div class="divide-y divide-gray-200">
								{#each Array(3) as _}
									<div class="p-4 animate-pulse">
										<div class="flex items-center justify-between">
											<div class="flex items-center space-x-3">
												<div class="w-10 h-10 bg-gray-200 rounded-full"></div>
												<div class="space-y-2">
													<div class="h-4 bg-gray-200 rounded w-32"></div>
													<div class="h-3 bg-gray-200 rounded w-20"></div>
												</div>
											</div>
											<div class="text-right space-y-2">
												<div class="h-4 bg-gray-200 rounded w-16"></div>
												<div class="h-3 bg-gray-200 rounded w-12"></div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else if recentTransactions.length > 0}
						<div class="bg-white rounded-lg shadow overflow-hidden">
							<div class="divide-y divide-gray-200">
								{#each recentTransactions as transaction}
									<div class="p-4 hover:bg-gray-50 transition-colors duration-150">
										<div class="flex items-center justify-between">
											<div class="flex items-center space-x-3">
												<div class="w-10 h-10 rounded-full flex items-center justify-center {
													transaction.type === 'income' ? 'bg-green-100 text-green-600' :
													transaction.type === 'expense' ? 'bg-red-100 text-red-600' :
													transaction.type === 'transfer' ? 'bg-blue-100 text-blue-600' :
													'bg-purple-100 text-purple-600'
												}">
													{#if transaction.type === 'income'}
														<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
														</svg>
													{:else if transaction.type === 'expense'}
														<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
														</svg>
													{:else if transaction.type === 'transfer'}
														<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
														</svg>
													{:else}
														<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
														</svg>
													{/if}
												</div>
												<div>
													<p class="text-sm font-medium text-gray-900">{transaction.description}</p>
													<div class="flex items-center space-x-2 text-xs text-gray-500">
														<span class="capitalize">{transaction.type}</span>
														{#if transaction.payee}
															<span>•</span>
															<span>{transaction.payee}</span>
														{/if}
														<span>•</span>
														<span>{new Date(transaction.date).toLocaleDateString()}</span>
													</div>
												</div>
											</div>
											<div class="text-right">
												<div class="text-sm font-semibold {
													transaction.type === 'income' ? 'text-green-600' :
													transaction.type === 'expense' ? 'text-red-600' :
													'text-gray-900'
												}">
													{transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
												</div>
												<div class="text-xs text-gray-500">
													{new Date(transaction.created_at).toLocaleTimeString('en-US', {
														hour: '2-digit',
														minute: '2-digit'
													})}
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
							
							<!-- Summary footer -->
							<div class="bg-gray-50 px-4 py-3 border-t border-gray-200">
								<div class="flex items-center justify-between text-sm">
									<span class="text-gray-600">
										Showing {recentTransactions.length} of your most recent transactions
									</span>
									<a href="/transactions" class="text-blue-600 hover:text-blue-500 font-medium">
										View transaction history →
									</a>
								</div>
							</div>
						</div>
					{:else}
						<div class="bg-white rounded-lg shadow p-8 text-center">
							<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
							<h3 class="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
							<p class="text-gray-500 mb-4">Start by adding your first income or expense transaction</p>
							<div class="flex justify-center space-x-3">
								<button
									on:click={handleAddIncome}
									class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
								>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Add Income
								</button>
								<button
									on:click={handleAddExpense}
									class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
								>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
									</svg>
									Add Expense
								</button>
							</div>
						</div>
					{/if}
				</section>

				<!-- Envelope Overview Section -->
				<section class="envelope-overview">
					<div class="mb-6">
						<div class="flex items-center justify-between">
							<div>
								<h2 class="text-xl font-semibold text-gray-900">Envelope Overview</h2>
								<p class="text-sm text-gray-600">Your budget envelopes and current balances</p>
							</div>
							<a href="/envelopes" class="text-sm text-blue-600 hover:text-blue-500 font-medium">
								Manage envelopes →
							</a>
						</div>
					</div>
					
					{#if loading || loadingEnvelopes}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each Array(3) as _}
								<div class="bg-white rounded-lg shadow p-4">
									<div class="flex items-center justify-between mb-3">
										<div class="flex items-center space-x-2">
											<LoadingSpinner size="sm" color="secondary" />
											<div class="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
										</div>
										<div class="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
									</div>
									<div class="h-6 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
									<div class="h-2 bg-gray-200 rounded w-full animate-pulse"></div>
									{#if loadingEnvelopes}
										<div class="text-xs text-gray-500 mt-2 flex items-center">
											<LoadingSpinner size="sm" color="gray" />
											<span class="ml-1">Loading envelope data...</span>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else if envelopes.length > 0}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each envelopes as envelope}
								<div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-4">
									<div class="flex items-center justify-between mb-3">
										<h3 class="font-medium text-gray-900 truncate">{envelope.name}</h3>
										<span class="text-xs px-2 py-1 rounded-full {
											envelope.type === 'regular' ? 'bg-blue-100 text-blue-800' :
											envelope.type === 'savings' ? 'bg-green-100 text-green-800' :
											'bg-red-100 text-red-800'
										}">
											{envelope.type}
										</span>
									</div>
									
									<div class="mb-3">
										<div class="text-lg font-semibold {
											envelope.balance >= 0 ? 'text-gray-900' : 'text-red-600'
										}">
											{formatCurrency(envelope.balance)}
										</div>
										{#if envelope.type === 'savings' && envelope.target_amount}
											<div class="text-xs text-gray-500 mt-1">
												Goal: {formatCurrency(envelope.target_amount)}
											</div>
										{:else if envelope.type === 'debt' && envelope.target_amount}
											<div class="text-xs text-gray-500 mt-1">
												Total debt: {formatCurrency(Math.abs(envelope.target_amount))}
											</div>
										{/if}
									</div>
									
									<!-- Enhanced Progress Indicators for savings/debt envelopes -->
									{#if envelope.type === 'savings' && envelope.target_amount && envelope.target_amount > 0}
										{@const progress = calculateSavingsProgress(envelope)}
										<div class="mt-3 space-y-2">
											<!-- Progress Bar -->
											<div class="relative">
												<div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
													<div
														class="{getProgressBarColor('savings', progress.status)} h-3 rounded-full transition-all duration-500 ease-out relative"
														style="width: {progress.percentage}%"
													>
														<!-- Animated shine effect for completed goals -->
														{#if progress.status === 'completed'}
															<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
														{/if}
													</div>
												</div>
												<!-- Progress percentage overlay -->
												<div class="absolute inset-0 flex items-center justify-center">
													<span class="text-xs font-medium text-gray-700">
														{Math.round(progress.percentage)}%
													</span>
												</div>
											</div>
											
											<!-- Progress Status Message -->
											<div class="flex items-center justify-between text-xs">
												<span class="text-gray-600 font-medium">
													{getProgressMessage('savings', progress.status, progress.percentage)}
												</span>
												{#if progress.timeToGoal}
													<span class="text-green-600 font-medium">
														~{progress.timeToGoal} to goal
													</span>
												{/if}
											</div>
											
											<!-- Milestone indicators -->
											{#if progress.percentage > 0 && progress.percentage < 100}
												<div class="flex justify-between text-xs text-gray-400 mt-1">
													<span class="{progress.percentage >= 25 ? 'text-green-600 font-medium' : ''}">25%</span>
													<span class="{progress.percentage >= 50 ? 'text-green-600 font-medium' : ''}">50%</span>
													<span class="{progress.percentage >= 75 ? 'text-green-600 font-medium' : ''}">75%</span>
													<span class="{progress.percentage >= 100 ? 'text-green-600 font-medium' : ''}">Goal</span>
												</div>
											{/if}
										</div>
									{:else if envelope.type === 'debt' && envelope.target_amount && envelope.target_amount < 0}
										{@const progress = calculateDebtProgress(envelope)}
										<div class="mt-3 space-y-2">
											<!-- Progress Bar -->
											<div class="relative">
												<div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
													<div
														class="{getProgressBarColor('debt', progress.status)} h-3 rounded-full transition-all duration-500 ease-out relative"
														style="width: {progress.percentage}%"
													>
														<!-- Animated shine effect for paid off debt -->
														{#if progress.status === 'paid-off'}
															<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
														{/if}
													</div>
												</div>
												<!-- Progress percentage overlay -->
												<div class="absolute inset-0 flex items-center justify-center">
													<span class="text-xs font-medium text-gray-700">
														{Math.round(progress.percentage)}%
													</span>
												</div>
											</div>
											
											<!-- Progress Status Message -->
											<div class="flex items-center justify-between text-xs">
												<span class="text-gray-600 font-medium">
													{getProgressMessage('debt', progress.status, progress.percentage)}
												</span>
												{#if progress.payoffProjection}
													<span class="text-blue-600 font-medium">
														~{progress.payoffProjection} to payoff
													</span>
												{/if}
											</div>
											
											<!-- Debt reduction milestones -->
											{#if progress.percentage > 0 && progress.percentage < 100}
												<div class="flex justify-between text-xs text-gray-400 mt-1">
													<span class="{progress.percentage >= 25 ? 'text-blue-600 font-medium' : ''}">25%</span>
													<span class="{progress.percentage >= 50 ? 'text-blue-600 font-medium' : ''}">50%</span>
													<span class="{progress.percentage >= 75 ? 'text-blue-600 font-medium' : ''}">75%</span>
													<span class="{progress.percentage >= 100 ? 'text-green-600 font-medium' : ''}">Paid Off</span>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
						
						<!-- Summary row -->
						<div class="mt-6 bg-gray-50 rounded-lg p-4">
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
								<div>
									<div class="text-sm text-gray-500">Total Balance</div>
									<div class="text-lg font-semibold text-gray-900">
										{formatCurrency(envelopes.reduce((sum, env) => sum + env.balance, 0))}
									</div>
								</div>
								<div>
									<div class="text-sm text-gray-500">Savings Goals</div>
									<div class="text-lg font-semibold text-green-600">
										{formatCurrency(envelopes.filter(env => env.type === 'savings').reduce((sum, env) => sum + env.balance, 0))}
									</div>
								</div>
								<div>
									<div class="text-sm text-gray-500">Debt Balance</div>
									<div class="text-lg font-semibold text-red-600">
										{formatCurrency(envelopes.filter(env => env.type === 'debt').reduce((sum, env) => sum + env.balance, 0))}
									</div>
								</div>
							</div>
						</div>
					{:else}
						<div class="bg-white rounded-lg shadow p-8 text-center">
							<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
							</svg>
							<h3 class="text-lg font-medium text-gray-900 mb-2">No envelopes yet</h3>
							<p class="text-gray-500 mb-4">Create your first budget envelope to start organizing your money</p>
							<a
								href="/envelopes"
								class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
							>
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
								Create Envelope
							</a>
						</div>
					{/if}
				</section>

				<!-- Quick Actions Section -->
				<section class="quick-actions">
					<div class="mb-6">
						<h2 class="text-xl font-semibold text-gray-900">Quick Actions</h2>
						<p class="text-sm text-gray-600">Manage your budget with these common actions</p>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<button
							on:click={handleAddIncome}
							class="action-button bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group hover:scale-105"
						>
							<div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition-colors">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
							</div>
							<span class="text-sm font-medium text-gray-900 group-hover:text-green-600">Add Income</span>
						</button>

						<button
							on:click={handleAddExpense}
							class="action-button bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group hover:scale-105"
						>
							<div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-red-600 transition-colors">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
								</svg>
							</div>
							<span class="text-sm font-medium text-gray-900 group-hover:text-red-600">Add Expense</span>
						</button>

						<button
							on:click={handleTransfer}
							class="action-button bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group hover:scale-105"
						>
							<div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 transition-colors">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
								</svg>
							</div>
							<span class="text-sm font-medium text-gray-900 group-hover:text-blue-600">Transfer</span>
						</button>

						<button
							on:click={handleAllocate}
							class="action-button bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group hover:scale-105"
						>
							<div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-600 transition-colors">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
								</svg>
							</div>
							<span class="text-sm font-medium text-gray-900 group-hover:text-purple-600">Allocate</span>
						</button>
					</div>
				</section>

				<!-- Two Column Layout for Additional Content -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<!-- Recent Activity Section -->
					<section class="recent-activity">
						<div class="bg-white rounded-lg shadow">
							<div class="px-6 py-4 border-b border-gray-200">
								<h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
								<p class="text-sm text-gray-600">Your latest transactions and updates</p>
							</div>
							<div class="p-6">
								{#if loading}
									<div class="space-y-3">
										{#each Array(3) as _}
											<div class="animate-pulse flex items-center space-x-3">
												<div class="w-8 h-8 bg-gray-200 rounded-full"></div>
												<div class="flex-1 space-y-2">
													<div class="h-4 bg-gray-200 rounded w-3/4"></div>
													<div class="h-3 bg-gray-200 rounded w-1/2"></div>
												</div>
												<div class="h-4 bg-gray-200 rounded w-16"></div>
											</div>
										{/each}
									</div>
								{:else if recentTransactions.length > 0}
									<div class="space-y-3">
										{#each recentTransactions as transaction}
											<div class="flex items-center justify-between py-2">
												<div class="flex items-center space-x-3">
													<div class="w-8 h-8 rounded-full flex items-center justify-center {
														transaction.type === 'income' ? 'bg-green-100 text-green-600' :
														transaction.type === 'expense' ? 'bg-red-100 text-red-600' :
														transaction.type === 'transfer' ? 'bg-blue-100 text-blue-600' :
														'bg-purple-100 text-purple-600'
													}">
														{#if transaction.type === 'income'}
															<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
															</svg>
														{:else if transaction.type === 'expense'}
															<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
															</svg>
														{:else if transaction.type === 'transfer'}
															<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
															</svg>
														{:else}
															<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
															</svg>
														{/if}
													</div>
													<div>
														<p class="text-sm font-medium text-gray-900">{transaction.description}</p>
														<p class="text-xs text-gray-500 capitalize">{transaction.type}</p>
													</div>
												</div>
												<div class="text-sm font-medium {
													transaction.type === 'income' ? 'text-green-600' :
													transaction.type === 'expense' ? 'text-red-600' :
													'text-gray-900'
												}">
													{transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
												</div>
											</div>
										{/each}
									</div>
									<div class="mt-4 pt-4 border-t border-gray-200">
										<a href="/transactions" class="text-sm text-blue-600 hover:text-blue-500 font-medium">
											View all transactions →
										</a>
									</div>
								{:else}
									<div class="text-center py-8">
										<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
										</svg>
										<h4 class="mt-2 text-sm font-medium text-gray-900">No recent activity</h4>
										<p class="mt-1 text-sm text-gray-500">Get started by adding your first transaction</p>
									</div>
								{/if}
							</div>
						</div>
					</section>

					<!-- Getting Started Section -->
					<section class="getting-started">
						<div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
							<div class="p-6">
								<div class="flex items-center mb-4">
									<div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
										<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
										</svg>
									</div>
									<h3 class="text-lg font-medium text-blue-900">Getting Started</h3>
								</div>
								<p class="text-blue-700 mb-4">Welcome to Alvu! Here's how to get started with your budget:</p>
								<div class="space-y-3">
									<div class="flex items-start">
										<div class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
											<span class="text-xs font-medium text-white">1</span>
										</div>
										<div>
											<p class="text-sm font-medium text-blue-900">Set up your income sources</p>
											<p class="text-xs text-blue-600">Add your salary, freelance work, or other income</p>
										</div>
									</div>
									<div class="flex items-start">
										<div class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
											<span class="text-xs font-medium text-white">2</span>
										</div>
										<div>
											<p class="text-sm font-medium text-blue-900">Create budget envelopes</p>
											<p class="text-xs text-blue-600">Organize your spending into categories</p>
										</div>
									</div>
									<div class="flex items-start">
										<div class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
											<span class="text-xs font-medium text-white">3</span>
										</div>
										<div>
											<p class="text-sm font-medium text-blue-900">Add your first income</p>
											<p class="text-xs text-blue-600">Record money coming into your budget</p>
										</div>
									</div>
									<div class="flex items-start">
										<div class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
											<span class="text-xs font-medium text-white">4</span>
										</div>
										<div>
											<p class="text-sm font-medium text-blue-900">Allocate funds to envelopes</p>
											<p class="text-xs text-blue-600">Distribute your income across your budget</p>
										</div>
									</div>
									<div class="flex items-start">
										<div class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
											<span class="text-xs font-medium text-white">5</span>
										</div>
										<div>
											<p class="text-sm font-medium text-blue-900">Start tracking expenses</p>
											<p class="text-xs text-blue-600">Record your spending and stay on budget</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
			{/if}
		</div>
		{/if}
		
		<!-- Transaction Modal -->
		{#if showTransactionModal}
			<Modal
				bind:open={showTransactionModal}
				size="xl"
				variant="default"
				title="Add Transaction"
				showCloseButton={true}
				closeOnBackdrop={false}
				closeOnEscape={true}
				on:close={handleTransactionCancel}
			>
				<AddTransactionForm
					preselectedType={preselectedTransactionType}
					on:success={handleTransactionSuccess}
					on:cancel={handleTransactionCancel}
				/>
			</Modal>
		{/if}
	</AppLayout>
</ProtectedRoute>