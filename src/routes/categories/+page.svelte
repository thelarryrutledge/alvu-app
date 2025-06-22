<script lang="ts">
	import { onMount } from 'svelte'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import PageLoading from '$lib/components/PageLoading.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import AddCategoryForm from '$lib/components/AddCategoryForm.svelte'
	import EditCategoryForm from '$lib/components/EditCategoryForm.svelte'
	import DeleteCategoryModal from '$lib/components/DeleteCategoryModal.svelte'
	import CategorySummaryCards from '$lib/components/CategorySummaryCards.svelte'
	import CategoryList from '$lib/components/CategoryList.svelte'
	import CategoryEmptyState from '$lib/components/CategoryEmptyState.svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import { toastHelpers } from '$lib/stores/toast'
	import type { Category } from '$lib/types/database'
	
	// State
	let loading = true
	let initialLoad = true
	let categories: Category[] = []
	let lastUpdated = new Date()
	let hasError = false
	let errorMessage = ''
	let showAddModal = false
	let showEditModal = false
	let editingCategory: Category | null = null
	let showDeleteModal = false
	let deletingCategory: Category | null = null
	
	// Filtering and search state
	let searchQuery = ''
	let typeFilter: 'all' | 'default' | 'custom' = 'all'
	let sortBy: 'name' | 'sort_order' | 'created' = 'sort_order'
	let sortOrder: 'asc' | 'desc' = 'asc'
	
	// Load categories
	async function loadCategoriesData() {
		if (!$user) return
		
		loading = true
		hasError = false
		
		try {
			const { data, error } = await supabase
				.from('categories')
				.select('*')
				.eq('user_id', $user.id)
				.order('sort_order', { ascending: true })
			
			if (error) {
				console.error('Error fetching categories:', error)
				hasError = true
				errorMessage = 'Failed to load categories'
				toastHelpers.error('Failed to load categories. Please try again.')
			} else {
				categories = data || []
			}
			
			lastUpdated = new Date()
		} catch (error) {
			console.error('Error loading categories:', error)
			hasError = true
			errorMessage = 'Failed to load categories data'
			toastHelpers.error('Failed to load categories data. Please try again.')
		} finally {
			loading = false
			initialLoad = false
		}
	}
	
	// Refresh data
	async function refreshData() {
		await loadCategoriesData()
		toastHelpers.success('Categories refreshed successfully')
	}
	
	// Format date
	function formatDate(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		})
	}
	
	// Filter and search functions
	function filterCategories(cats: Category[]): Category[] {
		let filtered = cats
		
		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim()
			filtered = filtered.filter(category =>
				category.name.toLowerCase().includes(query) ||
				(category.description && category.description.toLowerCase().includes(query))
			)
		}
		
		// Apply type filter
		if (typeFilter !== 'all') {
			filtered = filtered.filter(category =>
				typeFilter === 'default' ? category.is_default : !category.is_default
			)
		}
		
		// Apply sorting
		filtered.sort((a, b) => {
			let comparison = 0
			
			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name)
					break
				case 'sort_order':
					comparison = a.sort_order - b.sort_order
					break
				case 'created':
					comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					break
			}
			
			return sortOrder === 'asc' ? comparison : -comparison
		})
		
		return filtered
	}
	
	// Clear all filters
	function clearFilters() {
		searchQuery = ''
		typeFilter = 'all'
		sortBy = 'sort_order'
		sortOrder = 'asc'
	}
	
	// Get filter summary text
	function getFilterSummary(filtered: Category[]): string {
		const total = categories.length
		const showing = filtered.length
		
		if (total === showing) {
			return `Showing all ${total} categor${total === 1 ? 'y' : 'ies'}`
		} else {
			return `Showing ${showing} of ${total} categor${total === 1 ? 'y' : 'ies'}`
		}
	}
	
	// Handlers
	function handleAddCategory() {
		showAddModal = true
	}
	
	function handleEditCategory(event: CustomEvent<{ category: Category }>) {
		const category = event.detail.category
		editingCategory = category
		showEditModal = true
	}
	
	function handleDeleteCategory(event: CustomEvent<{ category: Category }>) {
		const category = event.detail.category
		if (category.is_default) {
			toastHelpers.warning('Default categories cannot be deleted')
			return
		}
		deletingCategory = category
		showDeleteModal = true
	}
	
	// Modal handlers
	function handleAddSuccess(event: CustomEvent<{ id: string; name: string }>) {
		showAddModal = false
		// Refresh the categories list
		loadCategoriesData()
	}
	
	function handleAddCancel() {
		showAddModal = false
	}
	
	// Edit modal handlers
	function handleEditSuccess(event: CustomEvent<{ id: string; name: string }>) {
		showEditModal = false
		editingCategory = null
		// Refresh the categories list
		loadCategoriesData()
	}
	
	function handleEditCancel() {
		showEditModal = false
		editingCategory = null
	}
	
	// Delete modal handlers
	function handleDeleteSuccess(event: CustomEvent<{ id: string; name: string }>) {
		showDeleteModal = false
		deletingCategory = null
		// Refresh the categories list
		loadCategoriesData()
	}
	
	function handleDeleteCancel() {
		showDeleteModal = false
		deletingCategory = null
	}
	
	// Load data on mount and when user changes
	onMount(() => {
		if ($user) {
			loadCategoriesData()
		}
	})
	
	// Reactive loading when user becomes available
	$: if ($user && initialLoad) {
		loadCategoriesData()
	}
	
	// Reactive values
	$: isNewUser = !loading && categories.length === 0
	$: filteredCategories = filterCategories(categories)
	$: hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || sortBy !== 'sort_order' || sortOrder !== 'asc'
	
	// Debug reactive filtering
	$: {
		console.log('Filter state changed:', {
			searchQuery,
			typeFilter,
			sortBy,
			sortOrder,
			totalCategories: categories.length,
			filteredCount: filteredCategories.length
		})
	}
</script>

<ProtectedRoute>
	<AppLayout title="Categories - Alvu">
		{#if initialLoad && loading}
			<PageLoading
				title="Loading Categories"
				subtitle="Fetching your category data..."
				variant="spinner"
			/>
		{:else}
		<div class="categories-container">
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
						<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Categories</h1>
						<p class="text-gray-600 mt-1 text-sm sm:text-base truncate">Organize your envelopes into meaningful groups</p>
					</div>
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
						<button
							on:click={handleAddCategory}
							class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Category
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
				<CategoryEmptyState on:addCategory={handleAddCategory} />
			{:else}
				<!-- Main Content -->
				<div class="space-y-8">
					<!-- Summary Cards -->
					<CategorySummaryCards {categories} />

					<!-- Search and Filter Controls -->
					<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div class="space-y-4">
							<!-- Search Bar -->
							<div class="flex flex-col sm:flex-row gap-4">
								<div class="flex-1">
									<label for="search" class="sr-only">Search categories</label>
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
											placeholder="Search by name or description..."
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
										on:click={() => typeFilter = typeFilter === 'default' ? 'all' : 'default'}
										class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {typeFilter === 'default' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}"
									>
										<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Default Only
									</button>
									<button
										on:click={() => typeFilter = typeFilter === 'custom' ? 'all' : 'custom'}
										class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {typeFilter === 'custom' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}"
									>
										<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
										</svg>
										Custom Only
									</button>
								</div>
							</div>
							
							<!-- Advanced Filters -->
							<div class="flex flex-col sm:flex-row gap-4">
								<!-- Sort By -->
								<div class="flex-1">
									<label for="sort-by" class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
									<select
										id="sort-by"
										bind:value={sortBy}
										class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									>
										<option value="sort_order">Sort Order</option>
										<option value="name">Name</option>
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
								<span>{getFilterSummary(filteredCategories)}</span>
								{#if hasActiveFilters}
									<span class="text-blue-600 font-medium">Filters applied</span>
								{/if}
							</div>
						</div>
					</section>

					<!-- Categories List -->
					<section>
						<div class="mb-6">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div>
									<h2 class="text-xl font-semibold text-gray-900">Your Categories</h2>
									<p class="text-sm text-gray-600">Organize your envelopes into meaningful groups</p>
								</div>
								<div class="flex flex-col sm:flex-row gap-2">
									<button
										on:click={handleAddCategory}
										class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
									>
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
										</svg>
										<span class="hidden sm:inline">Add Category</span>
										<span class="sm:hidden">Add</span>
									</button>
								</div>
							</div>
						</div>
						
						<CategoryList
							categories={filteredCategories}
							{loading}
							{hasActiveFilters}
							on:edit={handleEditCategory}
							on:delete={handleDeleteCategory}
							on:addCategory={handleAddCategory}
							on:clearFilters={clearFilters}
						/>
					</section>
				</div>
			{/if}
		</div>
		{/if}
		
		<!-- Add Category Modal -->
		<Modal
			bind:open={showAddModal}
			size="xl"
			variant="default"
			title="Add Category"
			showCloseButton={true}
			closeOnBackdrop={false}
			closeOnEscape={true}
		>
			<AddCategoryForm
				on:success={handleAddSuccess}
				on:cancel={handleAddCancel}
			/>
		</Modal>
		
		<!-- Edit Category Modal -->
		{#if editingCategory}
			<Modal
				bind:open={showEditModal}
				size="xl"
				variant="default"
				title="Edit Category"
				showCloseButton={true}
				closeOnBackdrop={false}
				closeOnEscape={true}
			>
				<EditCategoryForm
					category={editingCategory}
					on:success={handleEditSuccess}
					on:cancel={handleEditCancel}
				/>
			</Modal>
		{/if}
		
		<!-- Delete Category Modal -->
		{#if deletingCategory}
			<Modal
				bind:open={showDeleteModal}
				size="lg"
				variant="danger"
				title="Delete Category"
				showCloseButton={true}
				closeOnBackdrop={false}
				closeOnEscape={true}
			>
				<DeleteCategoryModal
					category={deletingCategory}
					availableCategories={categories}
					on:success={handleDeleteSuccess}
					on:cancel={handleDeleteCancel}
				/>
			</Modal>
		{/if}
	</AppLayout>
</ProtectedRoute>