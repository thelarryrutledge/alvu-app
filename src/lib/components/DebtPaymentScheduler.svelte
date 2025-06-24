<script lang="ts">
	import type { Envelope } from '$lib/types/database'
	import { 
		calculateRequiredPayment,
		calculateDebtPayoffProjection,
		formatCurrency,
		formatDuration
	} from '$lib/utils/debtCalculations'
	import { createEventDispatcher } from 'svelte'

	export let envelope: Envelope
	export let showTitle: boolean = true

	const dispatch = createEventDispatcher<{
		schedule: { envelope: Envelope; paymentAmount: number; frequency: string }
		close: void
	}>()

	let paymentAmount = envelope.minimum_payment || 0
	let paymentFrequency: 'monthly' | 'bi-weekly' | 'weekly' = 'monthly'
	let targetMonths = 36
	let useTargetDate = false

	$: currentBalance = Math.abs(envelope.balance)
	$: monthlyPayment = paymentFrequency === 'monthly' ? paymentAmount :
		paymentFrequency === 'bi-weekly' ? paymentAmount * 2 :
		paymentAmount * 4.33 // weekly to monthly approximation

	$: projection = envelope.apr && monthlyPayment > 0
		? calculateDebtPayoffProjection(currentBalance, envelope.apr, monthlyPayment)
		: null

	$: requiredPayment = envelope.apr && targetMonths > 0
		? calculateRequiredPayment(currentBalance, envelope.apr, targetMonths)
		: 0

	function handleSchedulePayment() {
		dispatch('schedule', {
			envelope,
			paymentAmount: monthlyPayment,
			frequency: paymentFrequency
		})
	}

	function handleClose() {
		dispatch('close')
	}

	function setRequiredPayment() {
		if (requiredPayment > 0) {
			paymentAmount = requiredPayment
			useTargetDate = true
		}
	}
</script>

<div class="debt-payment-scheduler">
	{#if showTitle}
		<div class="mb-6">
			<h3 class="text-lg font-semibold text-gray-900">Payment Scheduler - {envelope.name}</h3>
			<p class="text-sm text-gray-600 mt-1">Set up automatic payment scheduling for your debt</p>
		</div>
	{/if}

	<div class="space-y-6">
		<!-- Current Debt Info -->
		<div class="bg-gray-50 rounded-lg p-4">
			<h4 class="font-medium text-gray-900 mb-3">Current Debt Information</h4>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
				<div>
					<p class="text-gray-600">Current Balance</p>
					<p class="font-semibold text-red-600">{formatCurrency(currentBalance)}</p>
				</div>
				{#if envelope.apr}
					<div>
						<p class="text-gray-600">APR</p>
						<p class="font-semibold text-gray-900">{envelope.apr}%</p>
					</div>
				{/if}
				{#if envelope.minimum_payment}
					<div>
						<p class="text-gray-600">Minimum Payment</p>
						<p class="font-semibold text-gray-900">{formatCurrency(envelope.minimum_payment)}</p>
					</div>
				{/if}
				<div>
					<p class="text-gray-600">Debt Type</p>
					<p class="font-semibold text-gray-900 capitalize">{envelope.name}</p>
				</div>
			</div>
		</div>

		<!-- Payment Configuration -->
		<div class="space-y-4">
			<h4 class="font-medium text-gray-900">Payment Configuration</h4>
			
			<!-- Payment Amount -->
			<div>
				<label for="payment-amount" class="block text-sm font-medium text-gray-700 mb-1">
					Payment Amount
				</label>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<span class="text-gray-500 sm:text-sm">$</span>
					</div>
					<input
						id="payment-amount"
						type="number"
						step="0.01"
						min="0"
						bind:value={paymentAmount}
						class="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
						placeholder="0.00"
					/>
				</div>
				{#if envelope.minimum_payment && paymentAmount < envelope.minimum_payment}
					<p class="text-sm text-red-600 mt-1">
						Payment is below minimum required amount of {formatCurrency(envelope.minimum_payment)}
					</p>
				{/if}
			</div>

			<!-- Payment Frequency -->
			<div>
				<label for="payment-frequency" class="block text-sm font-medium text-gray-700 mb-1">
					Payment Frequency
				</label>
				<select
					id="payment-frequency"
					bind:value={paymentFrequency}
					class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				>
					<option value="monthly">Monthly</option>
					<option value="bi-weekly">Bi-weekly (every 2 weeks)</option>
					<option value="weekly">Weekly</option>
				</select>
			</div>

			<!-- Target Payoff Option -->
			<div class="border border-gray-200 rounded-lg p-4">
				<div class="flex items-center justify-between mb-3">
					<h5 class="font-medium text-gray-900">Target Payoff Date</h5>
					<button
						type="button"
						on:click={() => useTargetDate = !useTargetDate}
						class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {useTargetDate ? 'bg-blue-600' : 'bg-gray-200'}"
					>
						<span class="sr-only">Use target payoff date</span>
						<span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {useTargetDate ? 'translate-x-5' : 'translate-x-0'}"></span>
					</button>
				</div>
				
				{#if useTargetDate}
					<div class="space-y-3">
						<div>
							<label for="target-months" class="block text-sm font-medium text-gray-700 mb-1">
								Target Months to Payoff
							</label>
							<input
								id="target-months"
								type="number"
								min="1"
								max="600"
								bind:value={targetMonths}
								class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							/>
						</div>
						
						{#if requiredPayment > 0}
							<div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
								<p class="text-sm text-blue-700 mb-2">
									To pay off in {targetMonths} months, you need to pay:
								</p>
								<div class="flex items-center justify-between">
									<span class="font-semibold text-blue-900">{formatCurrency(requiredPayment)}/month</span>
									<button
										type="button"
										on:click={setRequiredPayment}
										class="text-sm text-blue-600 hover:text-blue-800 font-medium"
									>
										Use this amount
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Payment Projection -->
		{#if projection && projection.monthsToPayoff < Infinity}
			<div class="bg-green-50 rounded-lg p-4 border border-green-200">
				<h4 class="font-medium text-green-900 mb-3">Payment Projection</h4>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
					<div>
						<p class="text-green-700">Time to Payoff</p>
						<p class="font-semibold text-green-900">{formatDuration(projection.monthsToPayoff)}</p>
					</div>
					<div>
						<p class="text-green-700">Total Interest</p>
						<p class="font-semibold text-green-900">{formatCurrency(projection.totalInterestPaid)}</p>
					</div>
					<div>
						<p class="text-green-700">Total Amount</p>
						<p class="font-semibold text-green-900">{formatCurrency(projection.totalAmountPaid)}</p>
					</div>
				</div>
				<div class="mt-3 text-sm text-green-700">
					<p>Monthly equivalent payment: {formatCurrency(monthlyPayment)}</p>
					<p>Payoff date: {projection.payoffDate.toLocaleDateString()}</p>
				</div>
			</div>
		{:else if projection && projection.monthsToPayoff === Infinity}
			<div class="bg-red-50 rounded-lg p-4 border border-red-200">
				<p class="text-sm text-red-700">
					⚠️ Current payment amount doesn't cover the interest. Please increase the payment amount.
				</p>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
			<button
				type="button"
				on:click={handleClose}
				class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				Cancel
			</button>
			<button
				type="button"
				on:click={handleSchedulePayment}
				disabled={paymentAmount <= 0 || Boolean(envelope.minimum_payment && paymentAmount < envelope.minimum_payment)}
				class="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Schedule Payments
			</button>
		</div>
	</div>
</div>

<style>
	.debt-payment-scheduler {
		/* Custom styles if needed */
	}
</style>