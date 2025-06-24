<script lang="ts">
	import { onMount } from 'svelte'
	import { calculateAdvancedGoalProjections, type AdvancedGoalProjection, type ProjectionScenario, type ScenarioData } from '$lib/utils/goalProjectionCalculations'
	import { formatCurrency, formatDate, formatRelativeTime } from '$lib/utils/savingsGoalCalculations'
	import type { Envelope, Transaction } from '$lib/types/database'
	import { supabase } from '$lib/utils/supabase'
	import { user } from '$lib/stores/auth'
	
	// Props
	export let envelope: Envelope
	export let showTitle: boolean = true
	export let variant: 'compact' | 'detailed' = 'detailed'
	
	// State
	let projections: AdvancedGoalProjection | null = null
	let loading = true
	let error: string | null = null
	let selectedScenario: keyof ProjectionScenario = 'realistic'
	let historicalTransactions: Transaction[] = []
	
	// Scenario configurations
	const scenarioConfigs = {
		conservative: {
			label: 'Conservative',
			description: 'Based on your lowest contribution months',
			color: 'text-red-600',
			bgColor: 'bg-red-50',
			borderColor: 'border-red-200'
		},
		realistic: {
			label: 'Realistic',
			description: 'Based on your average contribution pattern',
			color: 'text-blue-600',
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-200'
		},
		optimistic: {
			label: 'Optimistic',
			description: 'Based on your best contribution months',
			color: 'text-green-600',
			bgColor: 'bg-green-50',
			borderColor: 'border-green-200'
		}
	}
	
	// Load historical transaction data for the envelope
	async function loadHistoricalData() {
		if (!$user || !envelope.id) return
		
		try {
			// Get transactions for this envelope from the last 12 months
			const twelveMonthsAgo = new Date()
			twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
			
			const { data: transactions, error: transactionError } = await supabase
				.from('transactions')
				.select('*')
				.eq('user_id', $user.id)
				.or(`envelope_id.eq.${envelope.id},destination_envelope_id.eq.${envelope.id}`)
				.gte('date', twelveMonthsAgo.toISOString().split('T')[0])
				.order('date', { ascending: true })
			
			if (transactionError) throw transactionError
			
			historicalTransactions = transactions || []
			
		} catch (err) {
			console.error('Error loading historical data:', err)
			error = err instanceof Error ? err.message : 'Failed to load historical data'
		}
	}
	
	// Calculate projections
	async function calculateProjections() {
		if (!envelope.target_amount || envelope.target_amount <= 0) {
			error = 'No savings goal set for this envelope'
			loading = false
			return
		}
		
		try {
			loading = true
			error = null
			
			// Load historical data first
			await loadHistoricalData()
			
			// Calculate advanced projections
			projections = calculateAdvancedGoalProjections(
				envelope.balance,
				envelope.target_amount,
				envelope.target_date,
				historicalTransactions,
				envelope.created_at
			)
			
		} catch (err) {
			console.error('Error calculating projections:', err)
			error = err instanceof Error ? err.message : 'Failed to calculate projections'
		} finally {
			loading = false
		}
	}
	
	// Get current scenario data
	$: currentScenario = projections?.scenarios[selectedScenario as keyof ProjectionScenario]
	$: scenarioConfig = scenarioConfigs[selectedScenario as keyof typeof scenarioConfigs]
	
	// Format projection date
	function formatProjectionDate(date: Date): string {
		const now = new Date()
		const diffMonths = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth())
		
		if (diffMonths < 0) {
			return `${Math.abs(diffMonths)} month${Math.abs(diffMonths) === 1 ? '' : 's'} overdue`
		} else if (diffMonths === 0) {
			return 'This month'
		} else if (diffMonths === 1) {
			return 'Next month'
		} else if (diffMonths <= 12) {
			return `${diffMonths} month${diffMonths === 1 ? '' : 's'}`
		} else {
			const years = Math.floor(diffMonths / 12)
			const remainingMonths = diffMonths % 12
			return `${years} year${years === 1 ? '' : 's'}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}` : ''}`
		}
	}
	
	// Get confidence level color
	function getConfidenceColor(confidence: number): string {
		if (confidence >= 80) return 'text-green-600'
		if (confidence >= 60) return 'text-yellow-600'
		return 'text-red-600'
	}
	
	onMount(() => {
		calculateProjections()
	})
	
	// Recalculate when envelope changes
	$: if (envelope) {
		calculateProjections()
	}
</script>

<div class="goal-projection-viewer">
	{#if showTitle}
		<div class="mb-4">
			<h3 class="text-lg font-semibold text-gray-900">Goal Projections</h3>
			<p class="text-sm text-gray-600">Forecast when you'll reach your savings goal</p>
		</div>
	{/if}
	
	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-3 text-sm text-gray-600">Calculating projections...</span>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<h4 class="text-sm font-medium text-red-800">Unable to calculate projections</h4>
					<p class="text-sm text-red-600 mt-1">{error}</p>
				</div>
			</div>
		</div>
	{:else if projections}
		<div class="space-y-6">
			<!-- Scenario Selector -->
			<div class="flex flex-wrap gap-2">
				{#each Object.entries(scenarioConfigs) as [key, config]}
					<button
						on:click={() => selectedScenario = key as keyof ProjectionScenario}
						class="px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 {
							selectedScenario === key
								? `${config.color} ${config.bgColor} ${config.borderColor}`
								: 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'
						}"
					>
						{config.label}
					</button>
				{/each}
			</div>
			
			{#if currentScenario}
				<!-- Current Scenario Overview -->
				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h4 class="text-lg font-semibold {scenarioConfig.color}">
								{scenarioConfig.label} Projection
							</h4>
							<p class="text-sm text-gray-600">{scenarioConfig.description}</p>
						</div>
						<div class="text-right">
							<div class="text-sm text-gray-500">Confidence Level</div>
							<div class="text-lg font-semibold {getConfidenceColor(currentScenario.confidence)}">
								{Math.round(currentScenario.confidence)}%
							</div>
						</div>
					</div>
					
					<!-- Key Metrics -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div class="text-center p-4 {scenarioConfig.bgColor} rounded-lg">
							<div class="text-sm text-gray-600 mb-1">Projected Completion</div>
							<div class="text-lg font-semibold {scenarioConfig.color}">
								{formatDate(currentScenario.projectedCompletionDate)}
							</div>
							<div class="text-xs text-gray-500">
								{formatProjectionDate(currentScenario.projectedCompletionDate)}
							</div>
						</div>
						
						<div class="text-center p-4 bg-gray-50 rounded-lg">
							<div class="text-sm text-gray-600 mb-1">Monthly Contribution</div>
							<div class="text-lg font-semibold text-gray-900">
								{formatCurrency(currentScenario.monthlyContribution)}
							</div>
							<div class="text-xs text-gray-500">
								Based on historical pattern
							</div>
						</div>
						
						<div class="text-center p-4 bg-gray-50 rounded-lg">
							<div class="text-sm text-gray-600 mb-1">
								{currentScenario.shortfall ? 'Shortfall' : 'Surplus'}
							</div>
							<div class="text-lg font-semibold {currentScenario.shortfall ? 'text-red-600' : 'text-green-600'}">
								{formatCurrency(currentScenario.shortfall || currentScenario.surplus || 0)}
							</div>
							<div class="text-xs text-gray-500">
								By target date
							</div>
						</div>
					</div>
					
					<!-- Detailed Breakdown -->
					{#if variant === 'detailed'}
						<div class="border-t border-gray-200 pt-4">
							<h5 class="text-sm font-medium text-gray-900 mb-3">Contribution Breakdown</h5>
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
								<div>
									<div class="text-gray-600">Daily</div>
									<div class="font-medium">{formatCurrency(currentScenario.dailyContribution)}</div>
								</div>
								<div>
									<div class="text-gray-600">Weekly</div>
									<div class="font-medium">{formatCurrency(currentScenario.weeklyContribution)}</div>
								</div>
								<div>
									<div class="text-gray-600">Monthly</div>
									<div class="font-medium">{formatCurrency(currentScenario.monthlyContribution)}</div>
								</div>
								<div>
									<div class="text-gray-600">Yearly</div>
									<div class="font-medium">{formatCurrency(currentScenario.yearlyContribution)}</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
				
				<!-- Recommendations -->
				{#if projections.recommendations.length > 0}
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h5 class="text-sm font-medium text-blue-900 mb-2">💡 Recommendations</h5>
						<ul class="space-y-1">
							{#each projections.recommendations as recommendation}
								<li class="text-sm text-blue-800 flex items-start">
									<span class="mr-2">•</span>
									<span>{recommendation}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				<!-- Historical Analysis -->
				{#if variant === 'detailed' && projections.historicalAnalysis}
					<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<h5 class="text-sm font-medium text-gray-900 mb-3">📊 Historical Analysis</h5>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div>
								<div class="text-gray-600">Average Monthly</div>
								<div class="font-medium">{formatCurrency(projections.historicalAnalysis.averageMonthlyContribution)}</div>
							</div>
							<div>
								<div class="text-gray-600">Best Month</div>
								<div class="font-medium text-green-600">{formatCurrency(projections.historicalAnalysis.highestMonthlyContribution)}</div>
							</div>
							<div>
								<div class="text-gray-600">Lowest Month</div>
								<div class="font-medium text-red-600">{formatCurrency(projections.historicalAnalysis.lowestMonthlyContribution)}</div>
							</div>
							<div>
								<div class="text-gray-600">Consistency</div>
								<div class="font-medium {getConfidenceColor(projections.historicalAnalysis.consistencyScore)}">
									{Math.round(projections.historicalAnalysis.consistencyScore)}%
								</div>
							</div>
						</div>
					</div>
				{/if}
				
				<!-- Scenario Comparison -->
				{#if variant === 'detailed'}
					<div class="bg-white border border-gray-200 rounded-lg p-4">
						<h5 class="text-sm font-medium text-gray-900 mb-3">🔮 All Scenarios</h5>
						<div class="space-y-3">
							{#each Object.entries(projections.scenarios) as [key, scenario]}
								{@const config = scenarioConfigs[key as keyof typeof scenarioConfigs]}
								{@const typedScenario = scenario as ScenarioData}
								<div class="flex items-center justify-between p-3 rounded-lg {config.bgColor}">
									<div>
										<div class="font-medium {config.color}">{config.label}</div>
										<div class="text-xs text-gray-600">{formatCurrency(typedScenario.monthlyContribution)}/month</div>
									</div>
									<div class="text-right">
										<div class="text-sm font-medium {config.color}">
											{formatDate(typedScenario.projectedCompletionDate)}
										</div>
										<div class="text-xs text-gray-600">
											{Math.round(typedScenario.confidence)}% confidence
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	{:else}
		<div class="text-center py-8">
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
			<h4 class="mt-2 text-sm font-medium text-gray-900">No projection data</h4>
			<p class="mt-1 text-sm text-gray-500">Set a savings goal to see projections</p>
		</div>
	{/if}
</div>

<style>
	.goal-projection-viewer {
		/* Custom styles for projection viewer */
	}
</style>