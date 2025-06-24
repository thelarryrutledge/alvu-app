// Advanced Goal Projection Calculations
// Comprehensive forecasting and scenario analysis for savings goals

import type { Transaction } from '$lib/types/database'

export interface ProjectionScenario {
	conservative: ScenarioData
	realistic: ScenarioData
	optimistic: ScenarioData
}

export interface ScenarioData {
	monthlyContribution: number
	dailyContribution: number
	weeklyContribution: number
	yearlyContribution: number
	projectedCompletionDate: Date
	confidence: number
	shortfall?: number
	surplus?: number
}

export interface HistoricalAnalysis {
	averageMonthlyContribution: number
	highestMonthlyContribution: number
	lowestMonthlyContribution: number
	consistencyScore: number
	trendDirection: 'increasing' | 'decreasing' | 'stable'
	seasonalPatterns: MonthlyPattern[]
	totalContributions: number
	monthsWithData: number
}

export interface MonthlyPattern {
	month: number
	averageContribution: number
	transactionCount: number
}

export interface AdvancedGoalProjection {
	scenarios: ProjectionScenario
	historicalAnalysis: HistoricalAnalysis
	recommendations: string[]
	riskFactors: string[]
	confidenceFactors: string[]
}

/**
 * Calculate advanced goal projections with multiple scenarios
 */
export function calculateAdvancedGoalProjections(
	currentAmount: number,
	targetAmount: number,
	targetDate?: string | Date,
	historicalTransactions: Transaction[] = [],
	goalStartDate?: string | Date
): AdvancedGoalProjection {
	// Analyze historical data
	const historicalAnalysis = analyzeHistoricalContributions(
		historicalTransactions,
		goalStartDate
	)
	
	// Calculate different scenarios
	const scenarios = calculateProjectionScenarios(
		currentAmount,
		targetAmount,
		targetDate,
		historicalAnalysis
	)
	
	// Generate recommendations
	const recommendations = generateRecommendations(
		currentAmount,
		targetAmount,
		targetDate,
		historicalAnalysis,
		scenarios
	)
	
	// Identify risk factors
	const riskFactors = identifyRiskFactors(
		historicalAnalysis,
		scenarios,
		targetDate
	)
	
	// Identify confidence factors
	const confidenceFactors = identifyConfidenceFactors(
		historicalAnalysis,
		scenarios
	)
	
	return {
		scenarios,
		historicalAnalysis,
		recommendations,
		riskFactors,
		confidenceFactors
	}
}

/**
 * Analyze historical contribution patterns
 */
function analyzeHistoricalContributions(
	transactions: Transaction[],
	goalStartDate?: string | Date
): HistoricalAnalysis {
	// Filter transactions that contribute to the goal (positive amounts)
	const contributionTransactions = transactions.filter(t => 
		(t.type === 'income' || t.type === 'allocation' || t.type === 'transfer') && 
		t.amount > 0
	)
	
	if (contributionTransactions.length === 0) {
		return {
			averageMonthlyContribution: 0,
			highestMonthlyContribution: 0,
			lowestMonthlyContribution: 0,
			consistencyScore: 0,
			trendDirection: 'stable',
			seasonalPatterns: [],
			totalContributions: 0,
			monthsWithData: 0
		}
	}
	
	// Group transactions by month
	const monthlyContributions = new Map<string, number>()
	const monthlyTransactionCounts = new Map<string, number>()
	
	contributionTransactions.forEach(transaction => {
		const date = new Date(transaction.date)
		const monthKey = `${date.getFullYear()}-${date.getMonth()}`
		
		monthlyContributions.set(
			monthKey, 
			(monthlyContributions.get(monthKey) || 0) + transaction.amount
		)
		monthlyTransactionCounts.set(
			monthKey,
			(monthlyTransactionCounts.get(monthKey) || 0) + 1
		)
	})
	
	const monthlyAmounts = Array.from(monthlyContributions.values())
	const totalContributions = monthlyAmounts.reduce((sum, amount) => sum + amount, 0)
	const monthsWithData = monthlyAmounts.length
	
	// Calculate statistics
	const averageMonthlyContribution = monthsWithData > 0 ? totalContributions / monthsWithData : 0
	const highestMonthlyContribution = monthsWithData > 0 ? Math.max(...monthlyAmounts) : 0
	const lowestMonthlyContribution = monthsWithData > 0 ? Math.min(...monthlyAmounts) : 0
	
	// Calculate consistency score (lower variance = higher consistency)
	const variance = monthsWithData > 1 ? 
		monthlyAmounts.reduce((sum, amount) => sum + Math.pow(amount - averageMonthlyContribution, 2), 0) / monthsWithData : 0
	const standardDeviation = Math.sqrt(variance)
	const coefficientOfVariation = averageMonthlyContribution > 0 ? standardDeviation / averageMonthlyContribution : 1
	const consistencyScore = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100))
	
	// Determine trend direction
	let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable'
	if (monthsWithData >= 3) {
		const firstHalf = monthlyAmounts.slice(0, Math.floor(monthsWithData / 2))
		const secondHalf = monthlyAmounts.slice(Math.ceil(monthsWithData / 2))
		const firstHalfAvg = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length
		const secondHalfAvg = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length
		
		const changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
		if (changePercentage > 10) {
			trendDirection = 'increasing'
		} else if (changePercentage < -10) {
			trendDirection = 'decreasing'
		}
	}
	
	// Calculate seasonal patterns
	const seasonalPatterns: MonthlyPattern[] = []
	for (let month = 0; month < 12; month++) {
		const monthData = Array.from(monthlyContributions.entries())
			.filter(([key]) => {
				const [, monthStr] = key.split('-')
				return parseInt(monthStr) === month
			})
		
		if (monthData.length > 0) {
			const monthTotal = monthData.reduce((sum, [, amount]) => sum + amount, 0)
			const monthAverage = monthTotal / monthData.length
			const transactionCount = monthData.reduce((sum, [key]) => 
				sum + (monthlyTransactionCounts.get(key) || 0), 0
			)
			
			seasonalPatterns.push({
				month,
				averageContribution: monthAverage,
				transactionCount
			})
		}
	}
	
	return {
		averageMonthlyContribution,
		highestMonthlyContribution,
		lowestMonthlyContribution,
		consistencyScore,
		trendDirection,
		seasonalPatterns,
		totalContributions,
		monthsWithData
	}
}

/**
 * Calculate projection scenarios based on historical analysis
 */
function calculateProjectionScenarios(
	currentAmount: number,
	targetAmount: number,
	targetDate?: string | Date,
	historicalAnalysis?: HistoricalAnalysis
): ProjectionScenario {
	const remainingAmount = Math.max(0, targetAmount - currentAmount)
	const now = new Date()
	const target = targetDate ? new Date(targetDate) : new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)) // Default to 1 year
	const monthsRemaining = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()))
	
	// Base monthly contribution needed
	const baseMonthlyNeeded = remainingAmount / monthsRemaining
	
	// Calculate scenario multipliers based on historical data
	let conservativeMultiplier = 0.7
	let realisticMultiplier = 1.0
	let optimisticMultiplier = 1.3
	
	if (historicalAnalysis && historicalAnalysis.monthsWithData > 0) {
		// Use historical data to inform scenarios
		const avgMonthly = historicalAnalysis.averageMonthlyContribution
		const highestMonthly = historicalAnalysis.highestMonthlyContribution
		const lowestMonthly = historicalAnalysis.lowestMonthlyContribution
		
		if (avgMonthly > 0) {
			conservativeMultiplier = Math.max(0.5, lowestMonthly / avgMonthly)
			realisticMultiplier = 1.0
			optimisticMultiplier = Math.min(2.0, highestMonthly / avgMonthly)
		}
	}
	
	// Calculate scenarios
	const conservative = calculateScenario(
		currentAmount,
		targetAmount,
		target,
		baseMonthlyNeeded * conservativeMultiplier,
		historicalAnalysis,
		'conservative'
	)
	
	const realistic = calculateScenario(
		currentAmount,
		targetAmount,
		target,
		historicalAnalysis?.averageMonthlyContribution || baseMonthlyNeeded,
		historicalAnalysis,
		'realistic'
	)
	
	const optimistic = calculateScenario(
		currentAmount,
		targetAmount,
		target,
		baseMonthlyNeeded * optimisticMultiplier,
		historicalAnalysis,
		'optimistic'
	)
	
	return {
		conservative,
		realistic,
		optimistic
	}
}

/**
 * Calculate individual scenario data
 */
function calculateScenario(
	currentAmount: number,
	targetAmount: number,
	targetDate: Date,
	monthlyContribution: number,
	historicalAnalysis?: HistoricalAnalysis,
	scenarioType?: string
): ScenarioData {
	const remainingAmount = Math.max(0, targetAmount - currentAmount)
	const now = new Date()
	
	// Calculate completion date based on monthly contribution
	let projectedCompletionDate = targetDate
	if (monthlyContribution > 0 && remainingAmount > 0) {
		const monthsToComplete = remainingAmount / monthlyContribution
		projectedCompletionDate = new Date(now.getTime() + (monthsToComplete * 30 * 24 * 60 * 60 * 1000))
	}
	
	// Calculate confidence based on historical consistency and scenario type
	let confidence = 50 // Base confidence
	
	if (historicalAnalysis) {
		confidence = historicalAnalysis.consistencyScore
		
		// Adjust based on scenario type
		if (scenarioType === 'conservative') {
			confidence = Math.min(95, confidence + 20)
		} else if (scenarioType === 'optimistic') {
			confidence = Math.max(20, confidence - 20)
		}
		
		// Adjust based on trend
		if (historicalAnalysis.trendDirection === 'increasing') {
			confidence += 10
		} else if (historicalAnalysis.trendDirection === 'decreasing') {
			confidence -= 10
		}
	}
	
	confidence = Math.max(10, Math.min(95, confidence))
	
	// Calculate projected amount by target date
	const monthsToTarget = Math.max(0, (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()))
	const projectedAmountByTarget = currentAmount + (monthlyContribution * monthsToTarget)
	
	// Calculate shortfall or surplus
	let shortfall: number | undefined
	let surplus: number | undefined
	
	if (projectedAmountByTarget < targetAmount) {
		shortfall = targetAmount - projectedAmountByTarget
	} else if (projectedAmountByTarget > targetAmount) {
		surplus = projectedAmountByTarget - targetAmount
	}
	
	return {
		monthlyContribution,
		dailyContribution: monthlyContribution / 30,
		weeklyContribution: monthlyContribution / 4.33,
		yearlyContribution: monthlyContribution * 12,
		projectedCompletionDate,
		confidence,
		shortfall,
		surplus
	}
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(
	currentAmount: number,
	targetAmount: number,
	targetDate?: string | Date,
	historicalAnalysis?: HistoricalAnalysis,
	scenarios?: ProjectionScenario
): string[] {
	const recommendations: string[] = []
	const remainingAmount = targetAmount - currentAmount
	
	if (!historicalAnalysis || historicalAnalysis.monthsWithData === 0) {
		recommendations.push("Start tracking your contributions to get more accurate projections")
		recommendations.push("Set up automatic transfers to maintain consistent savings")
		return recommendations
	}
	
	// Consistency recommendations
	if (historicalAnalysis.consistencyScore < 60) {
		recommendations.push("Try to maintain more consistent monthly contributions for better results")
		recommendations.push("Consider setting up automatic transfers to improve consistency")
	}
	
	// Trend-based recommendations
	if (historicalAnalysis.trendDirection === 'decreasing') {
		recommendations.push("Your contribution trend is declining - consider reviewing your budget")
		recommendations.push("Look for areas to cut expenses and increase savings")
	} else if (historicalAnalysis.trendDirection === 'increasing') {
		recommendations.push("Great job! Your contributions are trending upward")
	}
	
	// Target date recommendations
	if (scenarios && targetDate) {
		const realisticScenario = scenarios.realistic
		if (realisticScenario.shortfall && realisticScenario.shortfall > 0) {
			const additionalMonthly = realisticScenario.shortfall / Math.max(1, (new Date(targetDate).getTime() - new Date().getTime()) / (30 * 24 * 60 * 60 * 1000))
			recommendations.push(`Increase monthly contributions by ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(additionalMonthly)} to meet your target date`)
		}
		
		if (realisticScenario.projectedCompletionDate > new Date(targetDate)) {
			recommendations.push("Consider extending your target date or increasing contributions")
		}
	}
	
	// Amount-based recommendations
	if (remainingAmount > 0) {
		const percentageComplete = (currentAmount / targetAmount) * 100
		if (percentageComplete < 25) {
			recommendations.push("You're just getting started - focus on building the habit of regular contributions")
		} else if (percentageComplete < 75) {
			recommendations.push("You're making good progress - stay consistent with your contributions")
		} else {
			recommendations.push("You're almost there! Keep up the momentum to reach your goal")
		}
	}
	
	return recommendations
}

/**
 * Identify potential risk factors
 */
function identifyRiskFactors(
	historicalAnalysis?: HistoricalAnalysis,
	scenarios?: ProjectionScenario,
	targetDate?: string | Date
): string[] {
	const riskFactors: string[] = []
	
	if (!historicalAnalysis) return riskFactors
	
	// Consistency risks
	if (historicalAnalysis.consistencyScore < 40) {
		riskFactors.push("High variability in contributions may impact goal achievement")
	}
	
	// Trend risks
	if (historicalAnalysis.trendDirection === 'decreasing') {
		riskFactors.push("Declining contribution trend poses risk to timeline")
	}
	
	// Data sufficiency risks
	if (historicalAnalysis.monthsWithData < 3) {
		riskFactors.push("Limited historical data reduces projection accuracy")
	}
	
	// Timeline risks
	if (scenarios && targetDate) {
		const target = new Date(targetDate)
		const now = new Date()
		const monthsRemaining = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
		
		if (monthsRemaining < 6) {
			riskFactors.push("Short timeline increases difficulty of goal achievement")
		}
		
		if (scenarios.realistic.shortfall && scenarios.realistic.shortfall > 0) {
			riskFactors.push("Current contribution rate insufficient for target date")
		}
	}
	
	return riskFactors
}

/**
 * Identify confidence factors
 */
function identifyConfidenceFactors(
	historicalAnalysis?: HistoricalAnalysis,
	scenarios?: ProjectionScenario
): string[] {
	const confidenceFactors: string[] = []
	
	if (!historicalAnalysis) return confidenceFactors
	
	// Positive factors
	if (historicalAnalysis.consistencyScore > 70) {
		confidenceFactors.push("Consistent contribution history increases confidence")
	}
	
	if (historicalAnalysis.trendDirection === 'increasing') {
		confidenceFactors.push("Improving contribution trend supports projections")
	}
	
	if (historicalAnalysis.monthsWithData >= 6) {
		confidenceFactors.push("Sufficient historical data improves accuracy")
	}
	
	if (scenarios && scenarios.realistic.surplus && scenarios.realistic.surplus > 0) {
		confidenceFactors.push("Current pace exceeds minimum requirements")
	}
	
	return confidenceFactors
}