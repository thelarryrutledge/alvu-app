// Savings Goal Progress Calculation Utilities
// Comprehensive calculations for savings goal tracking and progress analysis

export interface SavingsGoalProgress {
	// Basic progress metrics
	currentAmount: number
	targetAmount: number
	progressPercentage: number
	remainingAmount: number
	
	// Time-based metrics
	targetDate?: Date
	daysRemaining?: number
	daysTotal?: number
	timeProgressPercentage?: number
	
	// Goal status
	isCompleted: boolean
	isOnTrack?: boolean
	
	// Projection metrics
	dailyTargetAmount?: number
	weeklyTargetAmount?: number
	monthlyTargetAmount?: number
	projectedCompletionDate?: Date
}

export interface SavingsGoalProjection {
	projectedAmount: number
	projectedDate: Date
	shortfall?: number
	surplus?: number
	recommendedDailyAmount?: number
	recommendedWeeklyAmount?: number
	recommendedMonthlyAmount?: number
}

/**
 * Calculate comprehensive savings goal progress
 */
export function calculateSavingsGoalProgress(
	currentAmount: number,
	targetAmount: number,
	targetDate?: string | Date,
	startDate?: string | Date
): SavingsGoalProgress {
	// Basic validation
	if (targetAmount <= 0) {
		throw new Error('Target amount must be greater than 0')
	}
	
	// Ensure current amount is not negative
	const safeCurrentAmount = Math.max(0, currentAmount)
	
	// Calculate basic progress metrics
	const progressPercentage = Math.min(100, (safeCurrentAmount / targetAmount) * 100)
	const remainingAmount = Math.max(0, targetAmount - safeCurrentAmount)
	const isCompleted = safeCurrentAmount >= targetAmount
	
	const progress: SavingsGoalProgress = {
		currentAmount: safeCurrentAmount,
		targetAmount,
		progressPercentage,
		remainingAmount,
		isCompleted
	}
	
	// Add time-based calculations if target date is provided
	if (targetDate) {
		const target = new Date(targetDate)
		const now = new Date()
		const start = startDate ? new Date(startDate) : now
		
		// Calculate time metrics
		const daysRemaining = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
		const daysTotal = Math.max(1, Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
		const daysPassed = daysTotal - daysRemaining
		const timeProgressPercentage = Math.min(100, (daysPassed / daysTotal) * 100)
		
		progress.targetDate = target
		progress.daysRemaining = daysRemaining
		progress.daysTotal = daysTotal
		progress.timeProgressPercentage = timeProgressPercentage
		
		// Determine if goal is on track
		if (!isCompleted && daysRemaining > 0) {
			progress.isOnTrack = progressPercentage >= timeProgressPercentage
		}
		
		// Calculate target amounts needed
		if (daysRemaining > 0 && remainingAmount > 0) {
			progress.dailyTargetAmount = remainingAmount / daysRemaining
			progress.weeklyTargetAmount = (remainingAmount / daysRemaining) * 7
			progress.monthlyTargetAmount = (remainingAmount / daysRemaining) * 30
		}
		
		// Calculate projected completion date based on current progress
		if (!isCompleted && daysPassed > 0 && safeCurrentAmount > 0) {
			const dailyRate = safeCurrentAmount / daysPassed
			if (dailyRate > 0) {
				const daysToComplete = remainingAmount / dailyRate
				progress.projectedCompletionDate = new Date(now.getTime() + (daysToComplete * 24 * 60 * 60 * 1000))
			}
		}
	}
	
	return progress
}

/**
 * Calculate savings goal projections based on different contribution scenarios
 */
export function calculateSavingsGoalProjections(
	currentAmount: number,
	targetAmount: number,
	targetDate: string | Date,
	monthlyContribution: number = 0
): SavingsGoalProjection {
	const target = new Date(targetDate)
	const now = new Date()
	const monthsRemaining = Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()))
	
	if (monthsRemaining <= 0) {
		return {
			projectedAmount: currentAmount,
			projectedDate: now,
			shortfall: Math.max(0, targetAmount - currentAmount)
		}
	}
	
	// Calculate projected amount with current contribution rate
	const projectedAmount = currentAmount + (monthlyContribution * monthsRemaining)
	
	// Calculate what's needed to reach the goal
	const remainingAmount = Math.max(0, targetAmount - currentAmount)
	const recommendedMonthlyAmount = remainingAmount / monthsRemaining
	const recommendedWeeklyAmount = recommendedMonthlyAmount / 4.33 // Average weeks per month
	const recommendedDailyAmount = recommendedMonthlyAmount / 30 // Average days per month
	
	const projection: SavingsGoalProjection = {
		projectedAmount,
		projectedDate: target,
		recommendedDailyAmount,
		recommendedWeeklyAmount,
		recommendedMonthlyAmount
	}
	
	// Determine shortfall or surplus
	if (projectedAmount < targetAmount) {
		projection.shortfall = targetAmount - projectedAmount
	} else if (projectedAmount > targetAmount) {
		projection.surplus = projectedAmount - targetAmount
	}
	
	return projection
}

/**
 * Calculate what-if scenarios for different contribution amounts
 */
export function calculateWhatIfScenarios(
	currentAmount: number,
	targetAmount: number,
	targetDate: string | Date,
	contributionOptions: number[]
): Array<{
	monthlyContribution: number
	projectedCompletionDate: Date
	monthsToComplete: number
	willMeetTarget: boolean
	surplus?: number
	shortfall?: number
}> {
	const target = new Date(targetDate)
	const now = new Date()
	const remainingAmount = Math.max(0, targetAmount - currentAmount)
	
	return contributionOptions.map(monthlyContribution => {
		if (monthlyContribution <= 0) {
			return {
				monthlyContribution,
				projectedCompletionDate: new Date(2099, 11, 31), // Far future date
				monthsToComplete: Infinity,
				willMeetTarget: false,
				shortfall: remainingAmount
			}
		}
		
		const monthsToComplete = remainingAmount / monthlyContribution
		const projectedCompletionDate = new Date(now.getTime() + (monthsToComplete * 30 * 24 * 60 * 60 * 1000))
		
		const monthsToTarget = Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()))
		const projectedAmountByTarget = currentAmount + (monthlyContribution * monthsToTarget)
		
		const willMeetTarget = projectedCompletionDate <= target
		
		let surplus: number | undefined
		let shortfall: number | undefined
		
		if (projectedAmountByTarget >= targetAmount) {
			surplus = projectedAmountByTarget - targetAmount
		} else {
			shortfall = targetAmount - projectedAmountByTarget
		}
		
		return {
			monthlyContribution,
			projectedCompletionDate,
			monthsToComplete: Math.ceil(monthsToComplete),
			willMeetTarget,
			surplus,
			shortfall
		}
	})
}

/**
 * Calculate optimal contribution amount to meet target date
 */
export function calculateOptimalContribution(
	currentAmount: number,
	targetAmount: number,
	targetDate: string | Date
): {
	monthlyAmount: number
	weeklyAmount: number
	dailyAmount: number
	totalRequired: number
	monthsAvailable: number
} {
	const target = new Date(targetDate)
	const now = new Date()
	const remainingAmount = Math.max(0, targetAmount - currentAmount)
	const monthsAvailable = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()))
	
	const monthlyAmount = remainingAmount / monthsAvailable
	const weeklyAmount = monthlyAmount / 4.33
	const dailyAmount = monthlyAmount / 30
	
	return {
		monthlyAmount,
		weeklyAmount,
		dailyAmount,
		totalRequired: remainingAmount,
		monthsAvailable
	}
}

/**
 * Calculate goal velocity (rate of progress)
 */
export function calculateGoalVelocity(
	progressHistory: Array<{ date: Date; amount: number }>
): {
	dailyVelocity: number
	weeklyVelocity: number
	monthlyVelocity: number
	trend: 'accelerating' | 'decelerating' | 'steady'
	confidence: number
} {
	if (progressHistory.length < 2) {
		return {
			dailyVelocity: 0,
			weeklyVelocity: 0,
			monthlyVelocity: 0,
			trend: 'steady',
			confidence: 0
		}
	}
	
	// Sort by date
	const sortedHistory = [...progressHistory].sort((a, b) => a.date.getTime() - b.date.getTime())
	
	// Calculate daily velocity
	const firstEntry = sortedHistory[0]
	const lastEntry = sortedHistory[sortedHistory.length - 1]
	const daysDiff = Math.max(1, (lastEntry.date.getTime() - firstEntry.date.getTime()) / (24 * 60 * 60 * 1000))
	const amountDiff = lastEntry.amount - firstEntry.amount
	
	const dailyVelocity = amountDiff / daysDiff
	const weeklyVelocity = dailyVelocity * 7
	const monthlyVelocity = dailyVelocity * 30
	
	// Calculate trend
	let trend: 'accelerating' | 'decelerating' | 'steady' = 'steady'
	if (sortedHistory.length >= 4) {
		const midPoint = Math.floor(sortedHistory.length / 2)
		const firstHalf = sortedHistory.slice(0, midPoint)
		const secondHalf = sortedHistory.slice(midPoint)
		
		const firstHalfVelocity = (firstHalf[firstHalf.length - 1].amount - firstHalf[0].amount) /
			Math.max(1, (firstHalf[firstHalf.length - 1].date.getTime() - firstHalf[0].date.getTime()) / (24 * 60 * 60 * 1000))
		
		const secondHalfVelocity = (secondHalf[secondHalf.length - 1].amount - secondHalf[0].amount) /
			Math.max(1, (secondHalf[secondHalf.length - 1].date.getTime() - secondHalf[0].date.getTime()) / (24 * 60 * 60 * 1000))
		
		if (secondHalfVelocity > firstHalfVelocity * 1.1) {
			trend = 'accelerating'
		} else if (secondHalfVelocity < firstHalfVelocity * 0.9) {
			trend = 'decelerating'
		}
	}
	
	// Calculate confidence based on data points and consistency
	const confidence = Math.min(100, (sortedHistory.length / 12) * 100) // More data points = higher confidence
	
	return {
		dailyVelocity,
		weeklyVelocity,
		monthlyVelocity,
		trend,
		confidence
	}
}

/**
 * Format progress percentage for display
 */
export function formatProgressPercentage(percentage: number): string {
	return `${Math.round(percentage)}%`
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency
	}).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	})
}

/**
 * Format relative time (e.g., "in 30 days", "30 days ago")
 */
export function formatRelativeTime(date: Date): string {
	const now = new Date()
	const diffTime = date.getTime() - now.getTime()
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
	
	if (diffDays === 0) {
		return 'Today'
	} else if (diffDays === 1) {
		return 'Tomorrow'
	} else if (diffDays === -1) {
		return 'Yesterday'
	} else if (diffDays > 0) {
		return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`
	} else {
		return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`
	}
}

/**
 * Get progress status color for UI
 */
export function getProgressStatusColor(progress: SavingsGoalProgress): string {
	if (progress.isCompleted) {
		return 'green'
	}
	
	if (progress.isOnTrack === undefined) {
		// No target date, just show progress based on percentage
		if (progress.progressPercentage >= 75) return 'green'
		if (progress.progressPercentage >= 50) return 'yellow'
		return 'red'
	}
	
	// Has target date, compare progress vs time
	if (progress.isOnTrack) {
		return 'green'
	} else {
		// Behind schedule
		if (progress.progressPercentage >= 50) return 'yellow'
		return 'red'
	}
}

/**
 * Get progress status text for UI
 */
export function getProgressStatusText(progress: SavingsGoalProgress): string {
	if (progress.isCompleted) {
		return 'Goal Completed! 🎉'
	}
	
	if (progress.isOnTrack === undefined) {
		// No target date
		if (progress.progressPercentage >= 75) return 'Great progress!'
		if (progress.progressPercentage >= 50) return 'Making progress'
		if (progress.progressPercentage >= 25) return 'Getting started'
		return 'Just beginning'
	}
	
	// Has target date
	if (progress.isOnTrack) {
		return 'On track'
	} else {
		return 'Behind schedule'
	}
}

/**
 * Calculate milestone achievements
 */
export function calculateMilestones(progress: SavingsGoalProgress): Array<{
	percentage: number
	amount: number
	achieved: boolean
	label: string
}> {
	const milestones = [
		{ percentage: 25, label: 'Quarter way there!' },
		{ percentage: 50, label: 'Halfway point!' },
		{ percentage: 75, label: 'Three quarters done!' },
		{ percentage: 100, label: 'Goal achieved!' }
	]
	
	return milestones.map(milestone => ({
		...milestone,
		amount: (progress.targetAmount * milestone.percentage) / 100,
		achieved: progress.progressPercentage >= milestone.percentage
	}))
}