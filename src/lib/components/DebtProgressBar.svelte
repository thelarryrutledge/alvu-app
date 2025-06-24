<script lang="ts">
	import type { Envelope, Transaction } from '$lib/types/database'
	import { calculateDebtProgress, formatCurrency, formatDuration, calculateDebtPayoffProjection } from '$lib/utils/debtCalculations'

	export let envelope: Envelope
	export let transactions: Transaction[] = []
	export let variant: 'default' | 'minimal' | 'detailed' = 'default'
	export let size: 'sm' | 'md' | 'lg' = 'md'
	export let showDetails: boolean = true

	$: debtProgress = calculateDebtProgress(envelope, transactions)
	$: payoffProjection = envelope.minimum_payment && envelope.apr 
		? calculateDebtPayoffProjection(debtProgress.currentBalance, envelope.apr, envelope.minimum_payment)
		: null

	// Calculate progress percentage (how much has been paid off)
	$: progressPercentage = debtProgress.progressPercentage
	$: remainingPercentage = 100 - progressPercentage

	// Size classes
	$: sizeClasses = {
		sm: 'h-2',
		md: 'h-3',
		lg: 'h-4'
	}

	// Color classes based on debt status
	$: getProgressColor = () => {
		if (progressPercentage >= 75) return 'bg-green-500'
		if (progressPercentage >= 50) return 'bg-yellow-500'
		if (progressPercentage >= 25) return 'bg-orange-500'
		return 'bg-red-500'
	}

	$: getBackgroundColor = () => {
		if (progressPercentage >= 75) return 'bg-green-200'
		if (progressPercentage >= 50) return 'bg-yellow-200'
		if (progressPercentage >= 25) return 'bg-orange-200'
		return 'bg-red-200'
	}
</script>

<div class="debt-progress-bar">
	{#if variant === 'minimal'}
		<!-- Minimal version - just the progress bar -->
		<div class="w-full {getBackgroundColor()} rounded-full {sizeClasses[size]}">
			<div
				class="{getProgressColor()} {sizeClasses[size]} rounded-full transition-all duration-300 ease-in-out"
				style="width: {progressPercentage}%"
			></div>
		</div>
	{:else if variant === 'detailed'}
		<!-- Detailed version with full information -->
		<div class="space-y-3">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h4 class="text-sm font-medium text-gray-900">Debt Payoff Progress</h4>
				<span class="text-sm font-semibold text-gray-700">{progressPercentage.toFixed(1)}% paid off</span>
			</div>

			<!-- Progress Bar -->
			<div class="w-full {getBackgroundColor()} rounded-full {sizeClasses[size]}">
				<div
					class="{getProgressColor()} {sizeClasses[size]} rounded-full transition-all duration-300 ease-in-out"
					style="width: {progressPercentage}%"
				></div>
			</div>

			<!-- Details Grid -->
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<p class="text-gray-600">Remaining Balance</p>
					<p class="font-semibold text-red-600">{formatCurrency(debtProgress.currentBalance)}</p>
				</div>
				<div>
					<p class="text-gray-600">Total Paid</p>
					<p class="font-semibold text-green-600">{formatCurrency(debtProgress.totalPaid)}</p>
				</div>
				{#if envelope.minimum_payment}
					<div>
						<p class="text-gray-600">Minimum Payment</p>
						<p class="font-semibold text-gray-900">{formatCurrency(envelope.minimum_payment)}</p>
					</div>
				{/if}
				{#if envelope.apr}
					<div>
						<p class="text-gray-600">APR</p>
						<p class="font-semibold text-gray-900">{envelope.apr}%</p>
					</div>
				{/if}
			</div>

			<!-- Payoff Projection -->
			{#if payoffProjection && payoffProjection.monthsToPayoff < Infinity}
				<div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
					<h5 class="text-sm font-medium text-blue-900 mb-2">Payoff Projection</h5>
					<div class="grid grid-cols-2 gap-3 text-sm">
						<div>
							<p class="text-blue-700">Time to Payoff</p>
							<p class="font-semibold text-blue-900">{formatDuration(payoffProjection.monthsToPayoff)}</p>
						</div>
						<div>
							<p class="text-blue-700">Total Interest</p>
							<p class="font-semibold text-blue-900">{formatCurrency(payoffProjection.totalInterestPaid)}</p>
						</div>
					</div>
				</div>
			{:else if payoffProjection && payoffProjection.monthsToPayoff === Infinity}
				<div class="bg-red-50 rounded-lg p-3 border border-red-200">
					<p class="text-sm text-red-700">
						⚠️ Current minimum payment doesn't cover interest. Consider increasing payment amount.
					</p>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Default version -->
		<div class="space-y-2">
			<!-- Progress Bar with Labels -->
			<div class="flex items-center justify-between text-sm">
				<span class="text-gray-600">Debt Progress</span>
				<span class="font-medium text-gray-900">{progressPercentage.toFixed(1)}% paid off</span>
			</div>
			
			<div class="w-full {getBackgroundColor()} rounded-full {sizeClasses[size]}">
				<div
					class="{getProgressColor()} {sizeClasses[size]} rounded-full transition-all duration-300 ease-in-out"
					style="width: {progressPercentage}%"
				></div>
			</div>

			{#if showDetails}
				<div class="flex items-center justify-between text-xs text-gray-600">
					<span>Remaining: {formatCurrency(debtProgress.currentBalance)}</span>
					<span>Paid: {formatCurrency(debtProgress.totalPaid)}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.debt-progress-bar {
		/* Custom styles if needed */
	}
</style>