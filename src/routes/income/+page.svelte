<script lang="ts">
	import { onMount } from 'svelte'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import PageLoading from '$lib/components/PageLoading.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import AddIncomeSourceForm from '$lib/components/AddIncomeSourceForm.svelte'
	import EditIncomeSourceForm from '$lib/components/EditIncomeSourceForm.svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import type { IncomeSource, IncomeFrequency } from '$lib/types/database'
	
	// State
	let loading = true
	let initialLoad = true
	let incomeSources: IncomeSource[] = []
	let lastUpdated = new Date()
	let hasError = false
	let errorMessage = ''
	let showAddModal = false
	let showEditModal = false
	let editingIncomeSource: IncomeSource | null = null
	
	// Load income sources
	async function loadIncomeSourcesData() {
		if (!$user) return
		
		loading = true
		hasError = false
		
		try {
			const { data, error } = await supabase
				.from('income_sources')
				.select('*')
				.eq('user_id', $user.id)
				.order('created_at', { ascending: false })
			
			if (error) {
				console.error('Error fetching income sources:', error)
				hasError = true
				errorMessage = 'Failed to load income sources'
				toastHelpers.error('Failed to load income sources. Please try again.')
			} else {
				incomeSources = data || []
			}
			
			lastUpdated = new Date()
		} catch (error) {
			console.error('Error loading income sources:', error)
			hasError = true
			errorMessage = 'Failed to load income sources data'
			toastHelpers.error('Failed to load income sources data. Please try again.')
		} finally {
			loading = false
			initialLoad = false
		}
	}
	
	// Refresh data
	async function refreshData() {
		await loadIncomeSourcesData()
		toastHelpers.success('Income sources refreshed successfully')
	}
	
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
	
	// Format frequency
	function formatFrequency(frequency: IncomeFrequency, customDays?: number): string {
		switch (frequency) {
			case 'weekly': return 'Weekly'
			case 'bi-weekly': return 'Bi-weekly'
			case 'semi-monthly': return 'Semi-monthly'
			case 'monthly': return 'Monthly'
			case 'custom': return customDays ? `Every ${customDays} day${customDays === 1 ? '' : 's'}` : 'Custom'
			default: return frequency
		}
	}
	
	// Get frequency color
	function getFrequencyColor(frequency: IncomeFrequency): string {
		switch (frequency) {
			case 'weekly': return 'bg-green-100 text-green-800'
			case 'bi-weekly': return 'bg-blue-100 text-blue-800'
			case 'semi-monthly': return 'bg-purple-100 text-purple-800'
			case 'monthly': return 'bg-orange-100 text-orange-800'
			case 'custom': return 'bg-gray-100 text-gray-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}
	
	// Calculate monthly estimate
	function calculateMonthlyEstimate(): number {
		return incomeSources
			.filter(source => source.is_active)
			.reduce((total, source) => {
				let monthlyAmount = 0
				switch (source.frequency) {
					case 'weekly': monthlyAmount = source.amount * 4.33; break
					case 'bi-weekly': monthlyAmount = source.amount * 2.17; break
					case 'semi-monthly': monthlyAmount = source.amount * 2; break
					case 'monthly': monthlyAmount = source.amount; break
					case 'custom':
						if (source.custom_frequency_days) {
							monthlyAmount = source.amount * (30 / source.custom_frequency_days)
						}
						break
				}
				return total + monthlyAmount
			}, 0)
	}
	
	// Handlers
	function handleAddIncomeSource() {
		showAddModal = true
	}
	
	function handleEditIncomeSource(incomeSource: IncomeSource) {
		editingIncomeSource = incomeSource
		showEditModal = true
	}
	
	function handleDeleteIncomeSource(incomeSource: IncomeSource) {
		toastHelpers.info(`Delete "${incomeSource.name}" feature coming soon!`)
	}
	
	// Modal handlers
	function handleAddSuccess(event: CustomEvent<{ id: string; name: string }>) {
		showAddModal = false
		// Refresh the income sources list
		loadIncomeSourcesData()
	}
	
	function handleAddCancel() {
		showAddModal = false
	}
	
	// Edit modal handlers
	function handleEditSuccess(event: CustomEvent<{ id: string; name: string }>) {
		showEditModal = false
		editingIncomeSource = null
		// Refresh the income sources list
		loadIncomeSourcesData()
	}
	
	function handleEditCancel() {
		showEditModal = false
		editingIncomeSource = null
	}
	
	// Load data on mount
	onMount(() => {
		loadIncomeSourcesData()
	})
	
	// Reactive values
	$: isNewUser = !loading && incomeSources.length === 0
	$: activeIncomeSources = incomeSources.filter(source => source.is_active)
	$: monthlyEstimate = calculateMonthlyEstimate()
</script>

<ProtectedRoute>
	<AppLayout title="Income Sources - Alvu">
		{#if initialLoad && loading}
			<PageLoading
				title="Loading Income Sources"
				subtitle="Fetching your income data..."
				variant="spinner"
			/>
		{:else}
		<div class="income-sources-container">
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
						<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Income Sources</h1>
						<p class="text-gray-600 mt-1 text-sm sm:text-base truncate">Manage your income streams and payment schedules</p>
					</div>
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
						<button
							on:click={handleAddIncomeSource}
							class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Income Source
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
				<div class="new-user-onboarding">
					<div class="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl shadow-lg mb-8">
						<div class="p-8 text-center">
							<div class="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
								<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
								</svg>
							</div>
							<h2 class="text-3xl font-bold text-green-900 mb-4">Set Up Your Income Sources</h2>
							<p class="text-lg text-green-700 mb-6 max-w-2xl mx-auto">
								Start by adding your income sources like salary, freelance work, or other regular payments. This helps you track when money is coming in and plan your budget accordingly.
							</p>
							<button
								on:click={handleAddIncomeSource}
								class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-lg font-medium rounded-lg shadow-sm transition-colors duration-200"
							>
								<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
								Add Your First Income Source
							</button>
						</div>
					</div>

					<!-- Examples -->
					<div class="bg-white rounded-lg shadow-lg">
						<div class="p-6 border-b border-gray-200">
							<h3 class="text-xl font-semibold text-gray-900">Income Source Examples</h3>
							<p class="text-sm text-gray-600 mt-1">Common types of income sources you might want to add</p>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div class="text-center">
									<div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
										<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
									</div>
									<h4 class="font-medium text-gray-900 mb-2">Salary</h4>
									<p class="text-sm text-gray-600">Regular monthly or bi-weekly paychecks from your employer</p>
								</div>
								<div class="text-center">
									<div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
										<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
										</svg>
									</div>
									<h4 class="font-medium text-gray-900 mb-2">Freelance Work</h4>
									<p class="text-sm text-gray-600">Project-based income from clients or contract work</p>
								</div>
								<div class="text-center">
									<div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
										<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
										</svg>
									</div>
									<h4 class="font-medium text-gray-900 mb-2">Side Income</h4>
									<p class="text-sm text-gray-600">Part-time jobs, gig work, or passive income streams</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- Main Content -->
				<div class="space-y-8">
					<!-- Summary Cards -->
					<section class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div class="bg-white overflow-hidden shadow rounded-lg">
							<div class="p-6">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
											<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
											</svg>
										</div>
									</div>
									<div class="ml-5 w-0 flex-1">
										<dl>
											<dt class="text-sm font-medium text-gray-500 truncate">Total Sources</dt>
											<dd class="text-2xl font-bold text-gray-900">{incomeSources.length}</dd>
											<dd class="text-sm text-gray-600 mt-1">{activeIncomeSources.length} active</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>

						<div class="bg-white overflow-hidden shadow rounded-lg">
							<div class="p-6">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
											<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
											</svg>
										</div>
									</div>
									<div class="ml-5 w-0 flex-1">
										<dl>
											<dt class="text-sm font-medium text-gray-500 truncate">Monthly Estimate</dt>
											<dd class="text-2xl font-bold text-gray-900">{formatCurrency(monthlyEstimate)}</dd>
											<dd class="text-sm text-gray-600 mt-1">Based on active sources</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>

						<div class="bg-white overflow-hidden shadow rounded-lg">
							<div class="p-6">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
											<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
									</div>
									<div class="ml-5 w-0 flex-1">
										<dl>
											<dt class="text-sm font-medium text-gray-500 truncate">Active Sources</dt>
											<dd class="text-2xl font-bold text-gray-900">{activeIncomeSources.length}</dd>
											<dd class="text-sm text-gray-600 mt-1">Currently enabled</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					</section>

					<!-- Income Sources List -->
					<section>
						<div class="mb-6">
							<div class="flex items-center justify-between">
								<div>
									<h2 class="text-xl font-semibold text-gray-900">Your Income Sources</h2>
									<p class="text-sm text-gray-600">Manage your income streams and payment schedules</p>
								</div>
								<button
									on:click={handleAddIncomeSource}
									class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
								>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Add Source
								</button>
							</div>
						</div>
						
						{#if loading}
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{#each Array(4) as _}
									<div class="bg-white rounded-lg shadow p-6">
										<div class="animate-pulse">
											<div class="flex items-center justify-between mb-4">
												<div class="h-5 bg-gray-200 rounded w-32"></div>
												<div class="h-4 bg-gray-200 rounded w-16"></div>
											</div>
											<div class="space-y-3">
												<div class="h-6 bg-gray-200 rounded w-24"></div>
												<div class="h-4 bg-gray-200 rounded w-40"></div>
												<div class="h-4 bg-gray-200 rounded w-28"></div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else if incomeSources.length > 0}
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{#each incomeSources as incomeSource}
									<div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6 {!incomeSource.is_active ? 'opacity-75' : ''}">
										<div class="flex items-center justify-between mb-4">
											<div class="flex items-center space-x-3">
												<div class="w-10 h-10 rounded-lg flex items-center justify-center {incomeSource.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}">
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
													</svg>
												</div>
												<div>
													<h3 class="font-medium text-gray-900">{incomeSource.name}</h3>
													<span class="text-xs px-2 py-1 rounded-full {getFrequencyColor(incomeSource.frequency)}">
														{formatFrequency(incomeSource.frequency, incomeSource.custom_frequency_days)}
													</span>
												</div>
											</div>
											<div class="flex items-center space-x-2">
												<button
													on:click={() => handleEditIncomeSource(incomeSource)}
													class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
													title="Edit income source"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
													</svg>
												</button>
												<button
													on:click={() => handleDeleteIncomeSource(incomeSource)}
													class="p-1 text-gray-400 hover:text-red-600 transition-colors"
													title="Delete income source"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</div>
										</div>
										
										<div class="space-y-3">
											<div class="text-2xl font-bold text-gray-900">
												{formatCurrency(incomeSource.amount)}
											</div>
											
											{#if incomeSource.description}
												<p class="text-sm text-gray-600">{incomeSource.description}</p>
											{/if}
											
											<div class="flex items-center justify-between text-sm">
												<span class="text-gray-500">
													Status: <span class="{incomeSource.is_active ? 'text-green-600' : 'text-gray-600'}">{incomeSource.is_active ? 'Active' : 'Inactive'}</span>
												</span>
												{#if incomeSource.next_expected_date}
													<span class="text-gray-500">
														Next: {new Date(incomeSource.next_expected_date).toLocaleDateString()}
													</span>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="bg-white rounded-lg shadow p-8 text-center">
								<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
								</svg>
								<h3 class="text-lg font-medium text-gray-900 mb-2">No income sources yet</h3>
								<p class="text-gray-500 mb-4">Add your first income source to start tracking your earnings</p>
								<button
									on:click={handleAddIncomeSource}
									class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
								>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Add Income Source
								</button>
							</div>
						{/if}
					</section>
				</div>
			{/if}
		</div>
		{/if}
		
		<!-- Add Income Source Modal -->
		<Modal
			bind:open={showAddModal}
			size="xl"
			variant="default"
			title="Add Income Source"
			showCloseButton={true}
			closeOnBackdrop={false}
			closeOnEscape={true}
		>
			<AddIncomeSourceForm
				on:success={handleAddSuccess}
				on:cancel={handleAddCancel}
			/>
		</Modal>
		
		<!-- Edit Income Source Modal -->
		{#if editingIncomeSource}
			<Modal
				bind:open={showEditModal}
				size="xl"
				variant="default"
				title="Edit Income Source"
				showCloseButton={true}
				closeOnBackdrop={false}
				closeOnEscape={true}
			>
				<EditIncomeSourceForm
					incomeSource={editingIncomeSource}
					on:success={handleEditSuccess}
					on:cancel={handleEditCancel}
				/>
			</Modal>
		{/if}
	</AppLayout>
</ProtectedRoute>