<script lang="ts">
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import { user } from '$lib/stores/auth'
</script>

<ProtectedRoute>
	<AppLayout title="Dashboard - Alvu">
		<!-- Dashboard Container -->
		<div class="dashboard-container">
			<!-- Page Header Section -->
			<header class="dashboard-header mb-8">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
					<div class="mb-4 sm:mb-0">
						<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
						{#if $user}
							<p class="text-gray-600 mt-1">Welcome back, {$user.user_metadata?.first_name || $user.email}!</p>
						{/if}
					</div>
					<div class="flex items-center space-x-3">
						<button class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Refresh
						</button>
						<div class="text-sm text-gray-500">
							Last updated: {new Date().toLocaleTimeString()}
						</div>
					</div>
				</div>
			</header>

			<!-- Main Dashboard Grid -->
			<div class="dashboard-grid space-y-8">
				<!-- Financial Overview Section -->
				<section class="financial-overview">
					<div class="mb-6">
						<h2 class="text-xl font-semibold text-gray-900">Financial Overview</h2>
						<p class="text-sm text-gray-600">Your current financial snapshot</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Available Funds Card -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
									<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Available Funds</dt>
									<dd class="text-lg font-medium text-gray-900">$0.00</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<!-- Envelopes Card -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
									<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Total Envelopes</dt>
									<dd class="text-lg font-medium text-gray-900">0</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<!-- Recent Transactions Card -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
									<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Recent Transactions</dt>
									<dd class="text-lg font-medium text-gray-900">0</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>
					</div>
				</section>

				<!-- Quick Actions Section -->
				<section class="quick-actions">
					<div class="mb-6">
						<h2 class="text-xl font-semibold text-gray-900">Quick Actions</h2>
						<p class="text-sm text-gray-600">Manage your budget with these common actions</p>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<button class="action-button bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group hover:scale-105">
							<div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition-colors">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
							</div>
							<span class="text-sm font-medium text-gray-900 group-hover:text-green-600">Add Income</span>
						</button>

						<button class="action-button bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group hover:scale-105">
							<div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-red-600 transition-colors">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
								</svg>
							</div>
							<span class="text-sm font-medium text-gray-900 group-hover:text-red-600">Add Expense</span>
						</button>

						<button class="action-button bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group hover:scale-105">
							<div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 transition-colors">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
								</svg>
							</div>
							<span class="text-sm font-medium text-gray-900 group-hover:text-blue-600">Transfer</span>
						</button>

						<button class="action-button bg-white p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 text-center group hover:scale-105">
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
								<div class="text-center py-8">
									<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
									<h4 class="mt-2 text-sm font-medium text-gray-900">No recent activity</h4>
									<p class="mt-1 text-sm text-gray-500">Get started by adding your first transaction</p>
								</div>
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
		</div>
	</AppLayout>
</ProtectedRoute>