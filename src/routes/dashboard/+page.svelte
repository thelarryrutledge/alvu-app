<script lang="ts">
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import { user, authStore } from '$lib/stores/auth'

	// Handle logout
	async function handleLogout() {
		await authStore.signOut()
	}
</script>

<svelte:head>
	<title>Dashboard - Alvu</title>
	<meta name="description" content="Your Alvu budget dashboard" />
</svelte:head>

<ProtectedRoute>
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<header class="bg-white shadow">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center py-6">
					<div>
						<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
						{#if $user}
							<p class="text-gray-600">Welcome back, {$user.user_metadata?.first_name || $user.email}!</p>
						{/if}
					</div>
					<button
						on:click={handleLogout}
						class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						Sign Out
					</button>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

			<!-- Quick Actions -->
			<div class="mt-8">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<button class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
						<div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center mx-auto mb-2">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
						</div>
						<span class="text-sm font-medium text-gray-900">Add Income</span>
					</button>

					<button class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
						<div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center mx-auto mb-2">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
							</svg>
						</div>
						<span class="text-sm font-medium text-gray-900">Add Expense</span>
					</button>

					<button class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
						<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mx-auto mb-2">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
							</svg>
						</div>
						<span class="text-sm font-medium text-gray-900">Transfer</span>
					</button>

					<button class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
						<div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center mx-auto mb-2">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
							</svg>
						</div>
						<span class="text-sm font-medium text-gray-900">Allocate</span>
					</button>
				</div>
			</div>

			<!-- Getting Started -->
			<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
				<h3 class="text-lg font-medium text-blue-900 mb-2">Getting Started</h3>
				<p class="text-blue-700 mb-4">Welcome to Alvu! Here's how to get started with your budget:</p>
				<ol class="list-decimal list-inside text-blue-700 space-y-1">
					<li>Set up your income sources</li>
					<li>Create budget envelopes for your expenses</li>
					<li>Add your first income transaction</li>
					<li>Allocate funds to your envelopes</li>
					<li>Start tracking your expenses</li>
				</ol>
			</div>
		</main>
	</div>
</ProtectedRoute>