<script lang="ts">
	import { goto } from '$app/navigation'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import AddTransactionForm from '$lib/components/AddTransactionForm.svelte'
	
	// Handle successful transaction creation
	function handleTransactionSuccess(event: CustomEvent<{ id: string; type: string; amount: number }>) {
		const { id, amount } = event.detail
		// Navigate to dashboard with a query parameter to potentially show allocation prompt
		goto(`/dashboard?income_added=${id}&amount=${amount}`)
	}
	
	// Handle form cancellation
	function handleTransactionCancel() {
		goto('/dashboard')
	}
</script>

<ProtectedRoute>
	<AppLayout title="Add Income - Alvu">
		<div class="add-income-container max-w-4xl mx-auto">
			<!-- Page Header -->
			<header class="mb-8">
				<div class="flex items-center space-x-4 mb-4">
					<button
						on:click={handleTransactionCancel}
						class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
						title="Go back to dashboard"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<div>
						<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Add Income</h1>
						<p class="text-gray-600 mt-1">Record money coming into your budget</p>
					</div>
				</div>
				
				<!-- Info Banner -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div class="flex items-start">
						<svg class="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div class="text-sm text-blue-700">
							<p class="font-medium mb-1">How income works in Alvu:</p>
							<ul class="space-y-1 text-blue-600">
								<li>• Income is added to your "Available Funds" bucket</li>
								<li>• After recording income, you can allocate it to your envelopes</li>
								<li>• You can skip allocation and do it later from the dashboard</li>
							</ul>
						</div>
					</div>
				</div>
			</header>

			<!-- Unified Transaction Form -->
			<div class="bg-white rounded-lg shadow-lg p-6">
				<AddTransactionForm
					preselectedType="income"
					on:success={handleTransactionSuccess}
					on:cancel={handleTransactionCancel}
				/>
			</div>

			<!-- Next Steps Info -->
			<div class="mt-8 bg-gray-50 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">What happens next?</h3>
				<div class="space-y-3 text-sm text-gray-600">
					<div class="flex items-start">
						<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">1</span>
						</div>
						<p>Your income will be added to your "Available Funds" on the dashboard</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">2</span>
						</div>
						<p>You'll be prompted to allocate the funds to your envelopes (optional)</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">3</span>
						</div>
						<p>You can allocate funds later using the "Allocate" button on the dashboard</p>
					</div>
				</div>
			</div>
		</div>
	</AppLayout>
</ProtectedRoute>