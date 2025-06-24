<script lang="ts">
	import { calculateWhatIfScenarios, calculateOptimalContribution, formatCurrency, formatDate } from '$lib/utils/savingsGoalCalculations'
	import type { Envelope } from '$lib/types/database'
	
	// Props
	export let envelope: Envelope
	export let showTitle: boolean = true
	
	// State
	let customContribution = 0
	let whatIfResults: ReturnType<typeof calculateWhatIfScenarios> = []
	let optimalContribution: ReturnType<typeof calculateOptimalContribution> | null = null
	
	// Predefined contribution amounts to test
	const predefinedAmounts = [50, 100, 200, 300, 500, 1000]
	
	// Calculate scenarios when envelope changes
	$: if (envelope && envelope.target_amount && envelope.target_date) {
		calculateScenarios()
	}
	
	function calculateScenarios() {
		if (!envelope.target_amount || !envelope.target_date) return
		
		// Calculate what-if scenarios for predefined amounts
		const contributionOptions = [...predefinedAmounts]
		if (customContribution > 0 && !contributionOptions.includes(customContribution)) {
			contributionOptions.push(customContribution)
			contributionOptions.sort((a, b) => a - b)
		}
		
		whatIfResults = calculateWhatIfScenarios(
			envelope.balance,
			envelope.target_amount,
			envelope.target_date,
			contributionOptions
		)
		
		// Calculate optimal contribution
		optimalContribution = calculateOptimalContribution(
			envelope.balance,
			envelope.target_amount,
			envelope.target_date
		)
	}
	
	function addCustomContribution() {
		if (customContribution > 0) {
			calculateScenarios()
		}
	}
	
	function formatMonthsToComplete(months: number): string {
		if (months === Infinity) return 'Never'
		if (months <= 12) return `${months} month${months === 1 ? '' : 's'}`
		
		const years = Math.floor(months / 12)
		const remainingMonths = months % 12
		return `${years} year${years === 1 ? '' : 's'}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}` : ''}`
	}
	
	function getResultColor(result: typeof whatIfResults[0]): string {
		if (result.willMeetTarget) return 'text-green-600'
		if (result.shortfall && result.shortfall < (envelope.target_amount || 0) * 0.1) return 'text-yellow-600'
		return 'text-red-600'
	}
	
	function getResultBgColor(result: typeof whatIfResults[0]): string {
		if (result.willMeetTarget) return 'bg-green-50 border-green-200'
		if (result.shortfall && result.shortfall < (envelope.target_amount || 0) * 0.1) return 'bg-yellow-50 border-yellow-200'
		return 'bg-red-50 border-red-200'
	}
</script>

<div class="what-if-calculator">
	{#if showTitle}
		<div class="mb-4">
			<h3 class="text-lg font-semibold text-gray-900">What-If Calculator</h3>
			<p class="text-sm text-gray-600">See how different contribution amounts affect your timeline</p>
		</div>
	{/if}
	
	{#if !envelope.target_amount || !envelope.target_date}
		<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
			<svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
			<p class="text-sm text-gray-600">Set a savings goal and target date to use the calculator</p>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- Optimal Contribution Display -->
			{#if optimalContribution}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h4 class="text-sm font-medium text-blue-900 mb-2">💡 To Meet Your Target Date</h4>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
						<div>
							<div class="text-blue-700 font-medium">{formatCurrency(optimalContribution.dailyAmount)}</div>
							<div class="text-blue-600">per day</div>
						</div>
						<div>
							<div class="text-blue-700 font-medium">{formatCurrency(optimalContribution.weeklyAmount)}</div>
							<div class="text-blue-600">per week</div>
						</div>
						<div>
							<div class="text-blue-700 font-medium">{formatCurrency(optimalContribution.monthlyAmount)}</div>
							<div class="text-blue-600">per month</div>
						</div>
						<div>
							<div class="text-blue-700 font-medium">{optimalContribution.monthsAvailable}</div>
							<div class="text-blue-600">months left</div>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Custom Contribution Input -->
			<div class="bg-white border border-gray-200 rounded-lg p-4">
				<h4 class="text-sm font-medium text-gray-900 mb-3">Test Custom Amount</h4>
				<div class="flex items-center space-x-3">
					<div class="flex-1">
						<label for="custom-contribution" class="sr-only">Custom monthly contribution</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<span class="text-gray-500 sm:text-sm">$</span>
							</div>
							<input
								id="custom-contribution"
								type="number"
								min="0"
								step="10"
								bind:value={customContribution}
								placeholder="0"
								class="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							/>
						</div>
					</div>
					<button
						on:click={addCustomContribution}
						disabled={customContribution <= 0}
						class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Calculate
					</button>
				</div>
			</div>
			
			<!-- What-If Results -->
			{#if whatIfResults.length > 0}
				<div class="bg-white border border-gray-200 rounded-lg p-4">
					<h4 class="text-sm font-medium text-gray-900 mb-4">Contribution Scenarios</h4>
					<div class="space-y-3">
						{#each whatIfResults as result}
							<div class="border rounded-lg p-3 {getResultBgColor(result)}">
								<div class="flex items-center justify-between">
									<div>
										<div class="font-medium {getResultColor(result)}">
											{formatCurrency(result.monthlyContribution)}/month
										</div>
										<div class="text-xs text-gray-600">
											{formatMonthsToComplete(result.monthsToComplete)} to complete
										</div>
									</div>
									<div class="text-right">
										<div class="text-sm font-medium {getResultColor(result)}">
											{formatDate(result.projectedCompletionDate)}
										</div>
										<div class="text-xs {getResultColor(result)}">
											{#if result.willMeetTarget}
												✓ Meets target
											{:else if result.shortfall}
												${Math.round(result.shortfall)} short
											{:else}
												Won't meet target
											{/if}
										</div>
									</div>
								</div>
								
								{#if result.surplus && result.surplus > 0}
									<div class="mt-2 text-xs text-green-600">
										💰 {formatCurrency(result.surplus)} surplus by target date
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- Quick Tips -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
				<h4 class="text-sm font-medium text-gray-900 mb-2">💡 Quick Tips</h4>
				<ul class="text-sm text-gray-600 space-y-1">
					<li>• Higher contributions = faster goal achievement</li>
					<li>• Consider your budget when choosing a contribution amount</li>
					<li>• Consistency is more important than large amounts</li>
					<li>• Review and adjust your contributions regularly</li>
				</ul>
			</div>
		</div>
	{/if}
</div>

<style>
	.what-if-calculator {
		/* Custom styles for what-if calculator */
	}
</style>