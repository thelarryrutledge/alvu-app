<script lang="ts">
	import type { Envelope, Transaction } from '$lib/types/database'
	import { 
		calculateDebtProgress, 
		calculateDebtPayoffProjection,
		generateDebtPaymentSchedule,
		compareDebtStrategies,
		calculateNextPaymentDate,
		isPaymentOverdue,
		formatCurrency,
		formatDuration
	} from '$lib/utils/debtCalculations'
	import DebtProgressBar from './DebtProgressBar.svelte'

	export let envelope: Envelope
	export let transactions: Transaction[] = []
	export let showTitle: boolean = true
	export let variant: 'summary' | 'detailed' = 'detailed'

	let activeTab: 'overview' | 'schedule' | 'strategies' | 'history' = 'overview'

	$: debtProgress = calculateDebtProgress(envelope, transactions)
	$: payoffProjection = envelope.minimum_payment && envelope.apr 
		? calculateDebtPayoffProjection(debtProgress.currentBalance, envelope.apr, envelope.minimum_payment)
		: null
	$: paymentSchedule = envelope.minimum_payment && envelope.apr
		? generateDebtPaymentSchedule(debtProgress.currentBalance, envelope.apr, envelope.minimum_payment, 12)
		: []
	$: debtStrategies = envelope.minimum_payment && envelope.apr
		? compareDebtStrategies(debtProgress.currentBalance, envelope.apr, envelope.minimum_payment)
		: []
	$: nextPaymentDate = calculateNextPaymentDate(
		transactions.filter(t => t.envelope_id === envelope.id && t.amount > 0)[0]?.date
	)
	$: isOverdue = isPaymentOverdue(envelope, transactions)
	$: recentPayments = transactions
		.filter(t => t.envelope_id === envelope.id && t.amount > 0)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 10)

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	}

	function getStatusColor(isOverdue: boolean): string {
		return isOverdue ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'
	}
</script>

<div class="debt-management-viewer">
	{#if showTitle}
		<div class="mb-6">
			<h3 class="text-lg font-semibold text-gray-900">Debt Management - {envelope.name}</h3>
			<p class="text-sm text-gray-600 mt-1">Track your debt payoff progress and explore payment strategies</p>
		</div>
	{/if}

	{#if variant === 'summary'}
		<!-- Summary View -->
		<div class="space-y-4">
			<DebtProgressBar {envelope} {transactions} variant="default" size="md" />
			
			{#if envelope.minimum_payment && isOverdue}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span class="text-sm font-medium text-red-800">Payment Overdue</span>
					</div>
					<p class="text-sm text-red-700 mt-1">
						Minimum payment of {formatCurrency(envelope.minimum_payment)} was due on {formatDate(nextPaymentDate)}
					</p>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Detailed View -->
		<div class="space-y-6">
			<!-- Status Alert -->
			{#if envelope.minimum_payment}
				<div class="border rounded-lg p-4 {getStatusColor(isOverdue)}">
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if isOverdue}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								{:else}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								{/if}
							</svg>
							<span class="font-medium">
								{isOverdue ? 'Payment Overdue' : 'Payment Status: Current'}
							</span>
						</div>
						<span class="text-sm">
							Next payment: {formatDate(nextPaymentDate)}
						</span>
					</div>
					{#if isOverdue}
						<p class="text-sm mt-2">
							Minimum payment of {formatCurrency(envelope.minimum_payment)} was due. Consider making a payment to avoid additional fees.
						</p>
					{/if}
				</div>
			{/if}

			<!-- Tab Navigation -->
			<div class="border-b border-gray-200">
				<nav class="-mb-px flex space-x-8">
					<button
						on:click={() => activeTab = 'overview'}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Overview
					</button>
					<button
						on:click={() => activeTab = 'schedule'}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'schedule' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Payment Schedule
					</button>
					<button
						on:click={() => activeTab = 'strategies'}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'strategies' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Payoff Strategies
					</button>
					<button
						on:click={() => activeTab = 'history'}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Payment History
					</button>
				</nav>
			</div>

			<!-- Tab Content -->
			<div class="tab-content">
				{#if activeTab === 'overview'}
					<!-- Overview Tab -->
					<div class="space-y-6">
						<DebtProgressBar {envelope} {transactions} variant="detailed" size="lg" />
						
						{#if payoffProjection && payoffProjection.monthsToPayoff < Infinity}
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
									<h4 class="text-sm font-medium text-blue-900 mb-2">Payoff Timeline</h4>
									<p class="text-lg font-semibold text-blue-900">{formatDuration(payoffProjection.monthsToPayoff)}</p>
									<p class="text-xs text-blue-700">At current minimum payment</p>
								</div>
								<div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
									<h4 class="text-sm font-medium text-orange-900 mb-2">Total Interest</h4>
									<p class="text-lg font-semibold text-orange-900">{formatCurrency(payoffProjection.totalInterestPaid)}</p>
									<p class="text-xs text-orange-700">Over life of debt</p>
								</div>
								<div class="bg-green-50 rounded-lg p-4 border border-green-200">
									<h4 class="text-sm font-medium text-green-900 mb-2">Total Amount</h4>
									<p class="text-lg font-semibold text-green-900">{formatCurrency(payoffProjection.totalAmountPaid)}</p>
									<p class="text-xs text-green-700">Principal + Interest</p>
								</div>
							</div>
						{/if}
					</div>

				{:else if activeTab === 'schedule'}
					<!-- Payment Schedule Tab -->
					<div class="space-y-4">
						<h4 class="text-lg font-medium text-gray-900">Next 12 Payments</h4>
						{#if paymentSchedule.length > 0}
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment #</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each paymentSchedule as payment}
											<tr>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.paymentNumber}</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.date)}</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(payment.payment)}</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(payment.principal)}</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(payment.interest)}</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payment.remainingBalance)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="text-gray-500 text-center py-8">No payment schedule available. Please set minimum payment and APR.</p>
						{/if}
					</div>

				{:else if activeTab === 'strategies'}
					<!-- Payoff Strategies Tab -->
					<div class="space-y-4">
						<h4 class="text-lg font-medium text-gray-900">Payoff Strategy Comparison</h4>
						{#if debtStrategies.length > 0}
							<div class="grid gap-4">
								{#each debtStrategies as strategy}
									<div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
										<div class="flex items-center justify-between mb-2">
											<h5 class="font-medium text-gray-900">{strategy.name}</h5>
											{#if strategy.monthlySavings}
												<span class="text-sm text-green-600 font-medium">
													Save {formatCurrency(strategy.monthlySavings)}
												</span>
											{/if}
										</div>
										<p class="text-sm text-gray-600 mb-3">{strategy.description}</p>
										<div class="grid grid-cols-2 gap-4 text-sm">
											<div>
												<span class="text-gray-500">Time to payoff:</span>
												<span class="font-medium ml-2">{formatDuration(strategy.monthsToPayoff)}</span>
											</div>
											<div>
												<span class="text-gray-500">Total interest:</span>
												<span class="font-medium ml-2">{formatCurrency(strategy.totalInterestPaid)}</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-gray-500 text-center py-8">No strategies available. Please set minimum payment and APR.</p>
						{/if}
					</div>

				{:else if activeTab === 'history'}
					<!-- Payment History Tab -->
					<div class="space-y-4">
						<h4 class="text-lg font-medium text-gray-900">Recent Payments</h4>
						{#if recentPayments.length > 0}
							<div class="space-y-3">
								{#each recentPayments as payment}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div class="flex items-center">
											<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
												<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
												</svg>
											</div>
											<div>
												<p class="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
												<p class="text-sm text-gray-500">{payment.description || 'Debt payment'}</p>
											</div>
										</div>
										<div class="text-right">
											<p class="text-sm text-gray-900">{new Date(payment.date).toLocaleDateString()}</p>
											{#if payment.payee}
												<p class="text-xs text-gray-500">{payment.payee}</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center py-8">
								<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
								<h3 class="mt-2 text-sm font-medium text-gray-900">No payment history</h3>
								<p class="mt-1 text-sm text-gray-500">Start making payments to see your payment history here.</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.debt-management-viewer {
		/* Custom styles if needed */
	}
</style>