<script lang="ts">
	import { onMount } from 'svelte'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import PageLoading from '$lib/components/PageLoading.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import AddTransactionForm from '$lib/components/AddTransactionForm.svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import type { Transaction, Envelope, Category } from '$lib/types/database'
	
	// State
	let loading = true
	let initialLoad = true
	let transactions: Transaction[] = []
	let envelopes: Envelope[] = []
	let categories: Category[] = []
	let lastUpdated = new Date()
	let hasError = false
	let errorMessage = ''
	let showAddModal = false
	
	// Filtering and search state
	let searchQuery = ''
	let typeFilter: 'all' | 'income' | 'expense' | 'transfer' | 'allocation' = 'all'
	let envelopeFilter = 'all'
	let dateFilter: 'all' | 'today' | 'week' | 'month' | 'year' = 'all'
	let sortBy: 'date' | 'amount' | 'type' | 'payee' = 'date'
	let sortOrder: 'asc' | 'desc' = 'desc'
	
	// Load transactions and related data
	async function loadTransactionsData() {
		if (!$user) return
		
		loading = true
		hasError = false
		
		try {
			// Load transactions with envelope information
			const { data: transactionsData, error: transactionsError } = await supabase
				.from('transactions')
				.select(`
					*,
					envelopes:envelope_id (
						id,
						name,
						type,
						categories (
							id,
							name,
							color
						)
					)
				`)
				.eq('user_id', $user.id)
				.order('date', { ascending: false })
				.order('created_at', { ascending: false })
			
			if (transactionsError) {
				console.error('Error fetching transactions:', transactionsError)
				hasError = true
				errorMessage = 'Failed to load transactions'
				toastHelpers.error('Failed to load transactions. Please try again.')
				return
			}
			
			// Load envelopes for filtering
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
				hasError = true
				errorMessage = 'Failed to load envelopes'
				toastHelpers.error('Failed to load envelopes. Please try again.')
				return
			}
			
			// Load categories for reference
			const { data: categoriesData, error: categoriesError } = await supabase
				.from('categories')
				.select('*')
				.eq('user_id', $user.id)
				.order('sort_order', { ascending: true })
			
			if (categoriesError) {
				console.error('Error fetching categories:', categoriesError)
				hasError = true
				errorMessage = 'Failed to load categories'
				toastHelpers.error('Failed to load categories. Please try again.')
				return
			}
			
			transactions = transactionsData || []
			envelopes = envelopesData || []
			categories = categoriesData || []
			lastUpdated = new Date()
		} catch (error) {
			console.error('Error loading transactions:', error)
			hasError = true
			errorMessage = 'Failed to load transactions data'
			toastHelpers.error('Failed to load transactions data. Please try again.')
		} finally {
			loading = false
			initialLoad = false
		}
	}
	
	// Refresh data
	async function refreshData() {
		await loadTransactionsData()
		toastHelpers.success('Transactions refreshed successfully')
	}
	
	// Format date
	function formatDate(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		})
	}
	
	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}
	
	// Format transaction date
	function formatTransactionDate(dateString: string): string {
		const date = new Date(dateString)
		const today = new Date()
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)
		
		if (date.toDateString() === today.toDateString()) {
			return 'Today'
		} else if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday'
		} else {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
			})
		}
	}
	
	// Get date range for filtering
	function getDateRange(filter: string): { start: Date | null; end: Date | null } {
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		
		switch (filter) {
			case 'today':
				return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
			case 'week':
				const weekStart = new Date(today)
				weekStart.setDate(today.getDate() - today.getDay())
				return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) }
			case 'month':
				const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
				const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
				return { start: monthStart, end: monthEnd }
			case 'year':
				const yearStart = new Date(today.getFullYear(), 0, 1)
				const yearEnd = new Date(today.getFullYear() + 1, 0, 1)
				return { start: yearStart, end: yearEnd }
			default:
				return { start: null, end: null }
		}
	}
	
	// Filter and search functions
	function filterTransactions(txns: Transaction[]): Transaction[] {
		let filtered = txns
		
		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim()
			filtered = filtered.filter(transaction =>
				transaction.description.toLowerCase().includes(query) ||
				(transaction.payee && transaction.payee.toLowerCase().includes(query))
			)
		}
		
		// Apply type filter
		if (typeFilter !== 'all') {
			filtered = filtered.filter(transaction => transaction.type === typeFilter)
		}
		
		// Apply envelope filter
		if (envelopeFilter !== 'all') {
			filtered = filtered.filter(transaction => transaction.envelope_id === envelopeFilter)
		}
		
		// Apply date filter
		if (dateFilter !== 'all') {
			const { start, end } = getDateRange(dateFilter)
			if (start && end) {
				filtered = filtered.filter(transaction => {
					const transactionDate = new Date(transaction.date)
					return transactionDate >= start && transactionDate < end
				})
			}
		}
		
		// Apply sorting
		filtered.sort((a, b) => {
			let comparison = 0
			
			switch (sortBy) {
				case 'date':
					comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
					// Secondary sort by created_at for same-day transactions
					if (comparison === 0) {
						comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					}
					break
				case 'amount':
					comparison = a.amount - b.amount
					break
				case 'type':
					comparison = a.type.localeCompare(b.type)
					// Secondary sort by date
					if (comparison === 0) {
						comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
					}
					break
				case 'payee':
					const aPayee = a.payee || ''
					const bPayee = b.payee || ''
					comparison = aPayee.localeCompare(bPayee)
					// Secondary sort by date
					if (comparison === 0) {
						comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
					}
					break
			}
			
			return sortOrder === 'asc' ? comparison : -comparison
		})
		
		return filtered
	}
	
	// Group transactions by date
	function groupTransactionsByDate(txns: Transaction[]) {
		const grouped = new Map<string, Transaction[]>()
		
		txns.forEach(transaction => {
			const dateKey = new Date(transaction.date).toDateString()
			if (!grouped.has(dateKey)) {
				grouped.set(dateKey, [])
			}
			grouped.get(dateKey)!.push(transaction)
		})
		
		// Convert to array and sort by date (most recent first)
		return Array.from(grouped.entries())
			.map(([dateKey, transactions]) => ({
				date: new Date(dateKey),
				transactions: transactions.sort((a, b) => 
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				)
			}))
			.sort((a, b) => b.date.getTime() - a.date.getTime())
	}
	
	// Clear all filters
	function clearFilters() {
		searchQuery = ''
		typeFilter = 'all'
		envelopeFilter = 'all'
		dateFilter = 'all'
		sortBy = 'date'
		sortOrder = 'desc'
	}
	
	// Get filter summary text
	function getFilterSummary(filtered: Transaction[]): string {
		const total = transactions.length
		const showing = filtered.length
		
		if (total === showing) {
			return `Showing all ${total} transaction${total === 1 ? '' : 's'}`
		} else {
			return `Showing ${showing} of ${total} transaction${total === 1 ? '' : 's'}`
		}
	}
	
	// Get transaction type badge color
	function getTransactionTypeBadge(type: string) {
		switch (type) {
			case 'income':
				return 'bg-green-100 text-green-800'
			case 'expense':
				return 'bg-red-100 text-red-800'
			case 'transfer':
				return 'bg-blue-100 text-blue-800'
			case 'allocation':
				return 'bg-purple-100 text-purple-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}
	
	// Get transaction type icon
	function getTransactionTypeIcon(type: string) {
		switch (type) {
			case 'income':
				return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
			case 'expense':
				return 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
			case 'transfer':
				return 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
			case 'allocation':
				return 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
			default:
				return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
		}
	}
	
	// Get envelope name for transaction
	function getEnvelopeName(transaction: Transaction): string {
		if (!transaction.envelope_id) {
			return transaction.type === 'income' ? 'Available Funds' : 'N/A'
		}
		const envelope = envelopes.find(e => e.id === transaction.envelope_id)
		return envelope ? envelope.name : 'Unknown Envelope'
	}
	
	// Handlers
	function handleAddTransaction() {
		showAddModal = true
	}
	
	function handleAddCancel() {
		showAddModal = false
	}
	
	function handleAddSuccess(event: CustomEvent<{ id: string; type: string; amount: number }>) {
		showAddModal = false
		// Refresh the transactions list
		loadTransactionsData()
		// Show success message is handled by the form component
	}
	
	// Load data on mount and when user changes
	onMount(() => {
		if ($user) {
			loadTransactionsData()
		}
	})
	
	// Reactive loading when user becomes available
	$: if ($user && initialLoad) {
		loadTransactionsData()
	}
	
	// Reactive values
	$: isNewUser = !loading && transactions.length === 0
	$: filteredTransactions = filterTransactions(transactions)
	$: groupedTransactions = groupTransactionsByDate(filteredTransactions)
	$: hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || envelopeFilter !== 'all' || dateFilter !== 'all' || sortBy !== 'date' || sortOrder !== 'desc'
	
	// Calculate summary statistics
	$: totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
	$: totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
	$: totalTransfers = transactions.filter(t => t.type === 'transfer').reduce((sum, t) => sum + t.amount, 0)
	$: totalAllocations = transactions.filter(t => t.type === 'allocation').reduce((sum, t) => sum + t.amount, 0)
</script>

<ProtectedRoute>
	<AppLayout title="Transactions - Alvu">
		{#if initialLoad && loading}
			<PageLoading
				title="Loading Transactions"
				subtitle="Fetching your transaction history..."
				variant="spinner"
			/>
		{:else}
		<div class="transactions-container">
			<!-- Error State -->
			{#if hasError && !loading}
				<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div class="flex-1">
							<h3 class="text-sm font-medium text-red-800">{errorMessage || 'Something went wrong'}</h3>
							<p class="text-sm text-red-600 mt-1">Please try refreshing the page or contact support if the problem persists.</p>
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

			<!-- Page Header -->
			<header class="mb-6 sm:mb-8">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div class="flex-1 min-w-0">
						<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Transactions</h1>
						<p class="text-gray-600 mt-1 text-sm sm:text-base truncate">View and manage your transaction history</p>
					</div>
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
						<button
							on:click={handleAddTransaction}
							class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Transaction
						</button>
						<button
							on:click={refreshData}
							disabled={loading}
							class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							<svg class="w-4 h-4 mr-1 sm:mr-2 {loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							<span class="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
							<span class="sm:hidden">{loading ? '...' : 'Refresh'}</span>
						</button>
					</div>
				</div>
				<div class="mt-2 text-xs sm:text-sm text-gray-500">
					Last updated: {formatDate(lastUpdated)}
				</div>
			</header>

			<!-- New User Empty State -->
			{#if isNewUser}
				<div class="text-center py-12">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No transactions yet</h3>
					<p class="mt-1 text-sm text-gray-500">Get started by recording your first transaction.</p>
					<div class="mt-6">
						<button
							on:click={handleAddTransaction}
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Record Your First Transaction
						</button>
					</div>
				</div>
			{:else}
				<!-- Main Content -->
				<div class="space-y-8">
					<!-- Summary Cards -->
					<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<!-- Total Transactions -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
										<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Total Transactions</p>
									<p class="text-2xl font-semibold text-gray-900">{transactions.length}</p>
								</div>
							</div>
						</div>

						<!-- Total Income -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
										<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Total Income</p>
									<p class="text-2xl font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
								</div>
							</div>
						</div>

						<!-- Total Expenses -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
										<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Total Expenses</p>
									<p class="text-2xl font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
								</div>
							</div>
						</div>

						<!-- Net Flow -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
										<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Net Flow</p>
									<p class="text-2xl font-semibold {totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}">
										{formatCurrency(totalIncome - totalExpenses)}
									</p>
								</div>
							</div>
						</div>
					</section>

					<!-- Search and Filter Controls -->
					<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div class="space-y-4">
							<!-- Search Bar -->
							<div class="flex flex-col sm:flex-row gap-4">
								<div class="flex-1">
									<label for="search" class="sr-only">Search transactions</label>
									<div class="relative">
										<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
											</svg>
										</div>
										<input
											id="search"
											bind:value={searchQuery}
											type="text"
											placeholder="Search by description or payee..."
											class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
										/>
										{#if searchQuery}
											<button
												on:click={() => searchQuery = ''}
												class="absolute inset-y-0 right-0 pr-3 flex items-center"
											>
												<svg class="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										{/if}
									</div>
								</div>
								
								<!-- Quick Filter Buttons -->
								<div class="flex items-center space-x-2">
									<button
										on:click={() => typeFilter = typeFilter === 'income' ? 'all' : 'income'}
										class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {typeFilter === 'income' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}"
									>
										Income
									</button>
									<button
										on:click={() => typeFilter = typeFilter === 'expense' ? 'all' : 'expense'}
										class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {typeFilter === 'expense' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}"
									>
										Expenses
									</button>
									<button
										on:click={() => typeFilter = typeFilter === 'transfer' ? 'all' : 'transfer'}
										class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {typeFilter === 'transfer' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}"
									>
										Transfers
									</button>
									<button
										on:click={() => typeFilter = typeFilter === 'allocation' ? 'all' : 'allocation'}
										class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {typeFilter === 'allocation' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}"
									>
										Allocations
									</button>
								</div>
							</div>
							
							<!-- Advanced Filters -->
							<div class="flex flex-col sm:flex-row gap-4">
								<!-- Date Filter -->
								<div class="flex-1">
									<label for="date-filter" class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
									<select
										id="date-filter"
										bind:value={dateFilter}
										class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									>
										<option value="all">All Time</option>
										<option value="today">Today</option>
										<option value="week">This Week</option>
										<option value="month">This Month</option>
										<option value="year">This Year</option>
									</select>
								</div>
								
								<!-- Envelope Filter -->
								<div class="flex-1">
									<label for="envelope-filter" class="block text-sm font-medium text-gray-700 mb-1">Envelope</label>
									<select
										id="envelope-filter"
										bind:value={envelopeFilter}
										class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									>
										<option value="all">All Envelopes</option>
										<option value="">Available Funds</option>
										{#each envelopes as envelope}
											<option value={envelope.id}>{envelope.name}</option>
										{/each}
									</select>
								</div>
								
								<!-- Sort By -->
								<div class="flex-1">
									<label for="sort-by" class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
									<select
										id="sort-by"
										bind:value={sortBy}
										class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									>
										<option value="date">Date</option>
										<option value="amount">Amount</option>
										<option value="type">Type</option>
										<option value="payee">Payee</option>
									</select>
								</div>
								
								<!-- Sort Order -->
								<div class="flex-1">
									<label for="sort-order" class="block text-sm font-medium text-gray-700 mb-1">Order</label>
									<select
										id="sort-order"
										bind:value={sortOrder}
										class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									>
										<option value="desc">Newest First</option>
										<option value="asc">Oldest First</option>
									</select>
								</div>
								
								<!-- Clear Filters -->
								{#if hasActiveFilters}
									<div class="flex items-end">
										<button
											on:click={clearFilters}
											class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
										>
											<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
											Clear
										</button>
									</div>
								{/if}
							</div>
							
							<!-- Filter Summary -->
							<div class="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
								<span>{getFilterSummary(filteredTransactions)}</span>
								{#if hasActiveFilters}
									<span class="text-blue-600 font-medium">Filters applied</span>
								{/if}
							</div>
						</div>
					</section>

					<!-- Transactions List -->
					<section>
						<div class="mb-6">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div>
									<h2 class="text-xl font-semibold text-gray-900">Transaction History</h2>
									<p class="text-sm text-gray-600">Your recent financial activity</p>
								</div>
								<div class="flex flex-col sm:flex-row gap-2">
									<button
										on:click={handleAddTransaction}
										class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
									>
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
										</svg>
										<span class="hidden sm:inline">Add Transaction</span>
										<span class="sm:hidden">Add</span>
									</button>
								</div>
							</div>
						</div>
						
						{#if filteredTransactions.length === 0}
							<div class="text-center py-12 bg-white rounded-lg border border-gray-200">
								{#if hasActiveFilters}
									<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
									<h3 class="mt-2 text-sm font-medium text-gray-900">No transactions match your filters</h3>
									<p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
									<div class="mt-6">
										<button
											on:click={clearFilters}
											class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
										>
											Clear Filters
										</button>
									</div>
								{:else}
									<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
									</svg>
									<h3 class="mt-2 text-sm font-medium text-gray-900">No transactions yet</h3>
									<p class="mt-1 text-sm text-gray-500">Get started by recording your first transaction.</p>
									<div class="mt-6">
										<button
											on:click={handleAddTransaction}
											class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
										>
											<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
											</svg>
											Record Your First Transaction
										</button>
									</div>
								{/if}
							</div>
						{:else}
							<!-- Date Groups -->
							<div class="space-y-6">
								{#each groupedTransactions as group}
									<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
										<!-- Date Header -->
										<div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
											<h3 class="text-sm font-medium text-gray-900">
												{formatTransactionDate(group.date.toISOString())}
											</h3>
											<p class="text-xs text-gray-500 mt-1">
												{group.transactions.length} transaction{group.transactions.length === 1 ? '' : 's'}
											</p>
										</div>

										<!-- Transactions in Date Group -->
										<div class="divide-y divide-gray-200">
											{#each group.transactions as transaction}
												<div class="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
													<div class="flex items-center justify-between">
														<div class="flex items-center flex-1 min-w-0">
															<!-- Transaction Type Icon -->
															<div class="flex-shrink-0 mr-4">
																<div class="w-10 h-10 rounded-lg flex items-center justify-center {getTransactionTypeBadge(transaction.type)}">
																	<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{getTransactionTypeIcon(transaction.type)}" />
																	</svg>
																</div>
															</div>
															
															<!-- Transaction Details -->
															<div class="flex-1 min-w-0">
																<div class="flex items-center justify-between">
																	<div class="flex-1 min-w-0">
																		<h4 class="text-sm font-medium text-gray-900 truncate">
																			{transaction.description}
																		</h4>
																		<div class="flex items-center mt-1 text-sm text-gray-500 space-x-2">
																			<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getTransactionTypeBadge(transaction.type)}">
																				{transaction.type}
																			</span>
																			{#if transaction.payee}
																				<span>•</span>
																				<span class="truncate">{transaction.payee}</span>
																			{/if}
																			<span>•</span>
																			<span class="truncate">{getEnvelopeName(transaction)}</span>
																		</div>
																	</div>
																	
																	<!-- Amount -->
																	<div class="flex-shrink-0 ml-4 text-right">
																		<p class="text-sm font-semibold {transaction.type === 'income' ? 'text-green-600' : transaction.type === 'expense' ? 'text-red-600' : 'text-gray-900'}">
																			{transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
																		</p>
																		<p class="text-xs text-gray-500 mt-1">
																			{new Date(transaction.date).toLocaleDateString()}
																		</p>
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</section>
				</div>
			{/if}
		</div>
		{/if}
		
		<!-- Add Transaction Modal -->
		{#if showAddModal}
			<Modal
				bind:open={showAddModal}
				size="xl"
				variant="default"
				title="Add Transaction"
				showCloseButton={true}
				closeOnBackdrop={false}
				closeOnEscape={true}
				on:close={handleAddCancel}
			>
				<AddTransactionForm
					on:success={handleAddSuccess}
					on:cancel={handleAddCancel}
				/>
			</Modal>
		{/if}
	</AppLayout>
</ProtectedRoute>