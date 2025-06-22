<script lang="ts">
	import { onMount } from 'svelte'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import PageLoading from '$lib/components/PageLoading.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import AddEnvelopeForm from '$lib/components/AddEnvelopeForm.svelte'
	import EditEnvelopeForm from '$lib/components/EditEnvelopeForm.svelte'
	import DeleteEnvelopeModal from '$lib/components/DeleteEnvelopeModal.svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import type { Envelope, Category } from '$lib/types/database'
	
	// State
	let loading = true
	let initialLoad = true
	let envelopes: Envelope[] = []
	let categories: Category[] = []
	let lastUpdated = new Date()
	let hasError = false
	let errorMessage = ''
	let showAddModal = false
	let showEditModal = false
	let editingEnvelope: Envelope | null = null
	let showDeleteModal = false
	let deletingEnvelope: Envelope | null = null
	
	// Filtering and search state
	let searchQuery = ''
	let typeFilter: 'all' | 'regular' | 'savings' | 'debt' = 'all'
	let categoryFilter = 'all'
	let sortBy: 'name' | 'balance' | 'created' | 'category' = 'category'
	let sortOrder: 'asc' | 'desc' = 'asc'
	
	// Load envelopes and categories data
	async function loadEnvelopesData() {
		if (!$user) return
		
		loading = true
		hasError = false
		
		try {
			// Load envelopes with category information
			const { data: envelopesData, error: envelopesError } = await supabase
				.from('envelopes')
				.select(`
					*,
					categories (
						id,
						name,
						color,
						is_default
					)
				`)
				.eq('user_id', $user.id)
				.order('created_at', { ascending: false })
			
			if (envelopesError) {
				console.error('Error fetching envelopes:', envelopesError)
				hasError = true
				errorMessage = 'Failed to load envelopes'
				toastHelpers.error('Failed to load envelopes. Please try again.')
				return
			}
			
			// Load categories for filtering
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
			
			envelopes = envelopesData || []
			categories = categoriesData || []
			lastUpdated = new Date()
		} catch (error) {
			console.error('Error loading envelopes:', error)
			hasError = true
			errorMessage = 'Failed to load envelopes data'
			toastHelpers.error('Failed to load envelopes data. Please try again.')
		} finally {
			loading = false
			initialLoad = false
		}
	}
	
	// Refresh data
	async function refreshData() {
		await loadEnvelopesData()
		toastHelpers.success('Envelopes refreshed successfully')
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
	
	// Filter and search functions
	function filterEnvelopes(envs: Envelope[]): Envelope[] {
		let filtered = envs
		
		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim()
			filtered = filtered.filter(envelope =>
				envelope.name.toLowerCase().includes(query)
			)
		}
		
		// Apply type filter
		if (typeFilter !== 'all') {
			filtered = filtered.filter(envelope => envelope.type === typeFilter)
		}
		
		// Apply category filter
		if (categoryFilter !== 'all') {
			filtered = filtered.filter(envelope => envelope.category_id === categoryFilter)
		}
		
		// Apply sorting
		filtered.sort((a, b) => {
			let comparison = 0
			
			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name)
					break
				case 'balance':
					comparison = a.balance - b.balance
					break
				case 'created':
					comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					break
				case 'category':
					// Get category names for comparison
					const aCategoryName = categories.find(c => c.id === a.category_id)?.name || ''
					const bCategoryName = categories.find(c => c.id === b.category_id)?.name || ''
					comparison = aCategoryName.localeCompare(bCategoryName)
					// Secondary sort by name within same category
					if (comparison === 0) {
						comparison = a.name.localeCompare(b.name)
					}
					break
			}
			
			return sortOrder === 'asc' ? comparison : -comparison
		})
		
		return filtered
	}
	
	// Group envelopes by category
	function groupEnvelopesByCategory(envs: Envelope[]) {
		const grouped = new Map<string, { category: Category; envelopes: Envelope[] }>()
		
		envs.forEach(envelope => {
			const category = categories.find(c => c.id === envelope.category_id)
			if (category) {
				if (!grouped.has(category.id)) {
					grouped.set(category.id, { category, envelopes: [] })
				}
				grouped.get(category.id)!.envelopes.push(envelope)
			}
		})
		
		// Convert to array and sort by category sort_order
		return Array.from(grouped.values()).sort((a, b) => a.category.sort_order - b.category.sort_order)
	}
	
	// Clear all filters
	function clearFilters() {
		searchQuery = ''
		typeFilter = 'all'
		categoryFilter = 'all'
		sortBy = 'category'
		sortOrder = 'asc'
	}
	
	// Get filter summary text
	function getFilterSummary(filtered: Envelope[]): string {
		const total = envelopes.length
		const showing = filtered.length
		
		if (total === showing) {
			return `Showing all ${total} envelope${total === 1 ? '' : 's'}`
		} else {
			return `Showing ${showing} of ${total} envelope${total === 1 ? '' : 's'}`
		}
	}
	
	// Calculate progress percentage for savings envelopes
	function calculateSavingsProgress(envelope: Envelope): number {
		if (envelope.type !== 'savings' || !envelope.target_amount || envelope.target_amount === 0) {
			return 0
		}
		return Math.min(100, (envelope.balance / envelope.target_amount) * 100)
	}
	
	// Calculate debt progress (how much has been paid off)
	function calculateDebtProgress(envelope: Envelope): number {
		if (envelope.type !== 'debt') return 0
		// For debt, we'll assume the original balance was stored somewhere
		// For now, we'll show a placeholder calculation
		// This would need to be enhanced with actual debt tracking
		return 0
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
	
	// Handlers for add envelope modal
	function handleAddEnvelope() {
		showAddModal = true
	}
	
	function handleAddSuccess(event: CustomEvent<{ id: string; name: string }>) {
		showAddModal = false
		// Refresh the envelopes list
		loadEnvelopesData()
	}
	
	function handleAddCancel() {
		showAddModal = false
	}
	
	// Handlers for edit envelope modal
	function handleEditEnvelope(envelope: Envelope) {
		editingEnvelope = envelope
		showEditModal = true
	}
	
	function handleEditSuccess(event: CustomEvent<{ id: string; name: string }>) {
		showEditModal = false
		editingEnvelope = null
		// Refresh the envelopes list
		loadEnvelopesData()
	}
	
	function handleEditCancel() {
		showEditModal = false
		editingEnvelope = null
	}
	
	// Handlers for delete envelope modal
	function handleDeleteEnvelope(envelope: Envelope) {
		deletingEnvelope = envelope
		showDeleteModal = true
	}
	
	function handleDeleteSuccess(event: CustomEvent<{ id: string; name: string }>) {
		showDeleteModal = false
		deletingEnvelope = null
		// Refresh the envelopes list
		loadEnvelopesData()
	}
	
	function handleDeleteCancel() {
		showDeleteModal = false
		deletingEnvelope = null
	}
	
	// Load data on mount and when user changes
	onMount(() => {
		if ($user) {
			loadEnvelopesData()
		}
	})
	
	// Reactive loading when user becomes available
	$: if ($user && initialLoad) {
		loadEnvelopesData()
	}
	
	// Reactive values
	$: isNewUser = !loading && envelopes.length === 0
	$: filteredEnvelopes = filterEnvelopes(envelopes)
	$: groupedEnvelopes = groupEnvelopesByCategory(filteredEnvelopes)
	$: hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'category' || sortOrder !== 'asc'
	
	// Calculate summary statistics
	$: totalBalance = envelopes.reduce((sum, env) => sum + (env.balance || 0), 0)
	$: regularBalance = envelopes.filter(e => e.type === 'regular').reduce((sum, env) => sum + (env.balance || 0), 0)
	$: savingsBalance = envelopes.filter(e => e.type === 'savings').reduce((sum, env) => sum + (env.balance || 0), 0)
	$: debtBalance = Math.abs(envelopes.filter(e => e.type === 'debt').reduce((sum, env) => sum + (env.balance || 0), 0))
</script>

<ProtectedRoute>
	<AppLayout title="Envelopes - Alvu">
		{#if initialLoad && loading}
			<PageLoading
				title="Loading Envelopes"
				subtitle="Fetching your envelope data..."
				variant="spinner"
			/>
		{:else}
		<div class="envelopes-container">
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
						<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Envelopes</h1>
						<p class="text-gray-600 mt-1 text-sm sm:text-base truncate">Manage your budget envelopes and track your progress</p>
					</div>
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
						<button
							on:click={handleAddEnvelope}
							class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Envelope
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
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No envelopes yet</h3>
					<p class="mt-1 text-sm text-gray-500">Get started by creating your first envelope to organize your budget.</p>
					<div class="mt-6">
						<button
							on:click={handleAddEnvelope}
							class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Create Your First Envelope
						</button>
					</div>
				</div>
			{:else}
				<!-- Main Content -->
				<div class="space-y-8">
					<!-- Summary Cards -->
					<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<!-- Total Balance -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
										<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Total Envelopes</p>
									<p class="text-2xl font-semibold text-gray-900">{envelopes.length}</p>
								</div>
							</div>
						</div>

						<!-- Regular Envelopes Balance -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
										<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Regular Balance</p>
									<p class="text-2xl font-semibold text-gray-900">{formatCurrency(regularBalance)}</p>
								</div>
							</div>
						</div>

						<!-- Savings Balance -->
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
									<p class="text-sm font-medium text-gray-600">Savings Balance</p>
									<p class="text-2xl font-semibold text-green-600">{formatCurrency(savingsBalance)}</p>
								</div>
							</div>
						</div>

						<!-- Debt Balance -->
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
									<p class="text-sm font-medium text-gray-600">Total Debt</p>
									<p class="text-2xl font-semibold text-red-600">{formatCurrency(debtBalance)}</p>
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
									<label for="search" class="sr-only">Search envelopes</label>
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
											placeholder="Search envelopes by name..."
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
										on:click={() => typeFilter = typeFilter === 'regular' ? 'all' : 'regular'}
										class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {typeFilter === 'regular' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}"
									>
										Regular
									</button>
									<button
										on:click={() => typeFilter = typeFilter === 'savings' ? 'all' : 'savings'}
										class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {typeFilter === 'savings' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}"
									>
										Savings
									</button>
									<button
										on:click={() => typeFilter = typeFilter === 'debt' ? 'all' : 'debt'}
										class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {typeFilter === 'debt' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}"
									>
										Debt
									</button>
								</div>
							</div>
							
							<!-- Advanced Filters -->
							<div class="flex flex-col sm:flex-row gap-4">
								<!-- Category Filter -->
								<div class="flex-1">
									<label for="category-filter" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
									<select
										id="category-filter"
										bind:value={categoryFilter}
										class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									>
										<option value="all">All Categories</option>
										{#each categories as category}
											<option value={category.id}>{category.name}</option>
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
										<option value="category">Category</option>
										<option value="name">Name</option>
										<option value="balance">Balance</option>
										<option value="created">Date Created</option>
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
										<option value="asc">Ascending</option>
										<option value="desc">Descending</option>
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
								<span>{getFilterSummary(filteredEnvelopes)}</span>
								{#if hasActiveFilters}
									<span class="text-blue-600 font-medium">Filters applied</span>
								{/if}
							</div>
						</div>
					</section>

					<!-- Envelopes List -->
					<section>
						<div class="mb-6">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div>
									<h2 class="text-xl font-semibold text-gray-900">Your Envelopes</h2>
									<p class="text-sm text-gray-600">Organized by category</p>
								</div>
								<div class="flex flex-col sm:flex-row gap-2">
									<button
										on:click={handleAddEnvelope}
										class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
									>
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
										</svg>
										<span class="hidden sm:inline">Add Envelope</span>
										<span class="sm:hidden">Add</span>
									</button>
								</div>
							</div>
						</div>
						
						{#if filteredEnvelopes.length === 0}
							<div class="text-center py-12 bg-white rounded-lg border border-gray-200">
								{#if hasActiveFilters}
									<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
									<h3 class="mt-2 text-sm font-medium text-gray-900">No envelopes match your filters</h3>
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
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
									</svg>
									<h3 class="mt-2 text-sm font-medium text-gray-900">No envelopes yet</h3>
									<p class="mt-1 text-sm text-gray-500">Get started by creating your first envelope to organize your budget.</p>
									<div class="mt-6">
										<button
											class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
										>
											<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
											</svg>
											Create Your First Envelope
										</button>
									</div>
								{/if}
							</div>
						{:else}
							<!-- Category Groups -->
							<div class="space-y-8">
								{#each groupedEnvelopes as group}
									<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
										<!-- Category Header -->
										<div class="px-6 py-4 border-b border-gray-200" style="background-color: {group.category.color}10;">
											<div class="flex items-center justify-between">
												<div class="flex items-center">
													<div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style="background-color: {group.category.color}20;">
														<div class="w-4 h-4 rounded-full" style="background-color: {group.category.color};"></div>
													</div>
													<div>
														<h3 class="text-lg font-semibold text-gray-900">{group.category.name}</h3>
														<p class="text-sm text-gray-600">{group.envelopes.length} envelope{group.envelopes.length === 1 ? '' : 's'}</p>
													</div>
												</div>
												<div class="text-right">
													<p class="text-lg font-semibold text-gray-900">
														{formatCurrency(group.envelopes.reduce((sum, env) => sum + env.balance, 0))}
													</p>
													<p class="text-sm text-gray-600">Total Balance</p>
												</div>
											</div>
										</div>

										<!-- Envelopes in Category -->
										<div class="divide-y divide-gray-200">
											{#each group.envelopes as envelope}
												<div class="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
													<div class="flex items-center justify-between">
														<div class="flex-1 min-w-0">
															<div class="flex items-center">
																<div class="flex-shrink-0">
																	<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getEnvelopeTypeBadge(envelope.type)}">
																		{envelope.type}
																	</span>
																</div>
																<div class="ml-4 flex-1 min-w-0">
																	<h4 class="text-sm font-medium text-gray-900 truncate">{envelope.name}</h4>
																	<div class="flex items-center mt-1 text-sm text-gray-500">
																		<span>Balance: {formatCurrency(envelope.balance)}</span>
																		{#if envelope.type === 'savings' && envelope.target_amount}
																			<span class="mx-2">•</span>
																			<span>Goal: {formatCurrency(envelope.target_amount)}</span>
																		{/if}
																		{#if envelope.type === 'debt' && envelope.apr}
																			<span class="mx-2">•</span>
																			<span>APR: {envelope.apr}%</span>
																		{/if}
																	</div>
																</div>
															</div>
														</div>
														
														<div class="flex items-center space-x-4">
															<!-- Progress Bar for Savings -->
															{#if envelope.type === 'savings' && envelope.target_amount}
																<div class="flex items-center space-x-2">
																	<div class="w-24 bg-gray-200 rounded-full h-2">
																		<div
																			class="bg-green-600 h-2 rounded-full transition-all duration-300"
																			style="width: {calculateSavingsProgress(envelope)}%"
																		></div>
																	</div>
																	<span class="text-xs text-gray-600 w-10 text-right">
																		{Math.round(calculateSavingsProgress(envelope))}%
																	</span>
																</div>
															{/if}
															
															<!-- Actions -->
															<div class="flex items-center space-x-2">
																<button
																	on:click={() => handleEditEnvelope(envelope)}
																	class="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
																	title="Edit envelope"
																>
																	<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
																	</svg>
																</button>
																<button
																	on:click={() => handleDeleteEnvelope(envelope)}
																	class="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
																	title="Delete envelope"
																>
																	<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
																	</svg>
																</button>
															</div>
														</div>
													</div>
													
													<!-- Target Date for Savings -->
													{#if envelope.type === 'savings' && envelope.target_date}
														<div class="mt-2 text-xs text-gray-500">
															Target Date: {new Date(envelope.target_date).toLocaleDateString()}
														</div>
													{/if}
													
													<!-- Minimum Payment for Debt -->
													{#if envelope.type === 'debt' && envelope.minimum_payment}
														<div class="mt-2 text-xs text-gray-500">
															Minimum Payment: {formatCurrency(envelope.minimum_payment)}
														</div>
													{/if}
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
		
		<!-- Add Envelope Modal -->
		<Modal
			bind:open={showAddModal}
			size="xl"
			variant="default"
			title="Add Envelope"
			showCloseButton={true}
			closeOnBackdrop={false}
			closeOnEscape={true}
			on:close={handleAddCancel}
		>
			<AddEnvelopeForm
				on:success={handleAddSuccess}
				on:cancel={handleAddCancel}
			/>
		</Modal>
		
		<!-- Edit Envelope Modal -->
		{#if editingEnvelope}
			<Modal
				bind:open={showEditModal}
				size="xl"
				variant="default"
				title="Edit Envelope"
				showCloseButton={true}
				closeOnBackdrop={false}
				closeOnEscape={true}
				on:close={handleEditCancel}
			>
				<EditEnvelopeForm
					envelope={editingEnvelope}
					on:success={handleEditSuccess}
					on:cancel={handleEditCancel}
				/>
			</Modal>
		{/if}
		
		<!-- Delete Envelope Modal -->
		{#if deletingEnvelope}
			<Modal
				bind:open={showDeleteModal}
				size="lg"
				variant="default"
				title="Delete Envelope"
				showCloseButton={true}
				closeOnBackdrop={false}
				closeOnEscape={true}
				on:close={handleDeleteCancel}
			>
				<DeleteEnvelopeModal
					envelope={deletingEnvelope}
					on:success={handleDeleteSuccess}
					on:cancel={handleDeleteCancel}
				/>
			</Modal>
		{/if}
	</AppLayout>
</ProtectedRoute>