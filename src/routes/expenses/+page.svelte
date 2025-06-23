<script lang="ts">
	import { goto } from '$app/navigation'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'
	import AddTransactionForm from '$lib/components/AddTransactionForm.svelte'
	
	// Handle successful transaction creation
	function handleTransactionSuccess(event: CustomEvent<{ id: string; type: string; amount: number }>) {
		// Navigate back to dashboard
		goto('/dashboard')
	}
	
	// Handle form cancellation
	function handleTransactionCancel() {
		goto('/dashboard')
	}
</script>

<ProtectedRoute>
	<AppLayout title="Add Expense - Alvu">
		<div class="add-expense-container max-w-4xl mx-auto">
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
						<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Add Expense</h1>
						<p class="text-gray-600 mt-1">Record money spent from your envelopes</p>
					</div>
				</div>
				
				<!-- Info Banner -->
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="flex items-start">
						<svg class="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div class="text-sm text-red-700">
							<p class="font-medium mb-1">How expenses work in Alvu:</p>
							<ul class="space-y-1 text-red-600">
								<li>• Expenses are deducted from the selected envelope</li>
								<li>• You can only spend what's available in the envelope</li>
								<li>• Payee information is saved for future use</li>
							</ul>
						</div>
					</div>
				</div>
			</header>

			<!-- Unified Transaction Form -->
			<div class="bg-white rounded-lg shadow-lg p-6">
				<AddTransactionForm
					preselectedType="expense"
					on:success={handleTransactionSuccess}
					on:cancel={handleTransactionCancel}
				/>
			</div>

			<!-- Next Steps Info -->
			<div class="mt-8 bg-gray-50 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">What happens next?</h3>
				<div class="space-y-3 text-sm text-gray-600">
					<div class="flex items-start">
						<div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">1</span>
						</div>
						<p>The expense amount will be deducted from the selected envelope</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">2</span>
						</div>
						<p>The payee information will be saved for future use</p>
					</div>
					<div class="flex items-start">
						<div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
							<span class="text-xs font-medium text-white">3</span>
						</div>
						<p>You can view the transaction in your transaction history</p>
					</div>
				</div>
			</div>
		</div>
	</AppLayout>
</ProtectedRoute>