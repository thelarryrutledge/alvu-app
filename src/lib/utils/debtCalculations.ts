import type { Envelope, Transaction } from '$lib/types/database'

export interface DebtProgress {
	currentBalance: number
	originalBalance: number
	totalPaid: number
	progressPercentage: number
	remainingBalance: number
}

export interface DebtPayoffProjection {
	monthsToPayoff: number
	totalInterestPaid: number
	totalAmountPaid: number
	payoffDate: Date
	monthlyPayment: number
}

export interface DebtPaymentSchedule {
	paymentNumber: number
	date: Date
	payment: number
	principal: number
	interest: number
	remainingBalance: number
}

export interface DebtStrategy {
	name: string
	description: string
	monthsToPayoff: number
	totalInterestPaid: number
	monthlySavings?: number
}

/**
 * Calculate debt progress based on current balance and payment history
 */
export function calculateDebtProgress(
	envelope: Envelope,
	transactions: Transaction[] = []
): DebtProgress {
	if (envelope.type !== 'debt') {
		throw new Error('Envelope must be of type "debt"')
	}

	const currentBalance = Math.abs(envelope.balance)
	
	// Calculate total payments made (positive transactions to debt envelope)
	const totalPaid = transactions
		.filter(t => t.envelope_id === envelope.id && t.amount > 0)
		.reduce((sum, t) => sum + t.amount, 0)
	
	// Estimate original balance (current + payments made)
	// This is an approximation since we don't store original debt amount
	const originalBalance = currentBalance + totalPaid
	
	const progressPercentage = originalBalance > 0 ? (totalPaid / originalBalance) * 100 : 0
	
	return {
		currentBalance,
		originalBalance,
		totalPaid,
		progressPercentage: Math.min(progressPercentage, 100),
		remainingBalance: currentBalance
	}
}

/**
 * Calculate debt payoff projection based on payment amount
 */
export function calculateDebtPayoffProjection(
	currentBalance: number,
	apr: number,
	monthlyPayment: number
): DebtPayoffProjection {
	if (currentBalance <= 0 || monthlyPayment <= 0) {
		return {
			monthsToPayoff: 0,
			totalInterestPaid: 0,
			totalAmountPaid: currentBalance,
			payoffDate: new Date(),
			monthlyPayment
		}
	}

	const monthlyRate = apr / 100 / 12
	let balance = currentBalance
	let totalInterestPaid = 0
	let months = 0
	const maxMonths = 600 // 50 years maximum to prevent infinite loops

	// Check if payment covers interest
	const monthlyInterest = balance * monthlyRate
	if (monthlyPayment <= monthlyInterest) {
		// Payment doesn't cover interest - debt will never be paid off
		return {
			monthsToPayoff: Infinity,
			totalInterestPaid: Infinity,
			totalAmountPaid: Infinity,
			payoffDate: new Date(Date.now() + 50 * 365 * 24 * 60 * 60 * 1000), // 50 years from now
			monthlyPayment
		}
	}

	while (balance > 0.01 && months < maxMonths) {
		const interestPayment = balance * monthlyRate
		const principalPayment = Math.min(monthlyPayment - interestPayment, balance)
		
		totalInterestPaid += interestPayment
		balance -= principalPayment
		months++
	}

	const payoffDate = new Date()
	payoffDate.setMonth(payoffDate.getMonth() + months)

	return {
		monthsToPayoff: months,
		totalInterestPaid,
		totalAmountPaid: currentBalance + totalInterestPaid,
		payoffDate,
		monthlyPayment
	}
}

/**
 * Generate debt payment schedule
 */
export function generateDebtPaymentSchedule(
	currentBalance: number,
	apr: number,
	monthlyPayment: number,
	maxPayments: number = 60
): DebtPaymentSchedule[] {
	const schedule: DebtPaymentSchedule[] = []
	const monthlyRate = apr / 100 / 12
	let balance = currentBalance
	let paymentNumber = 1
	const currentDate = new Date()

	while (balance > 0.01 && paymentNumber <= maxPayments) {
		const paymentDate = new Date(currentDate)
		paymentDate.setMonth(paymentDate.getMonth() + paymentNumber - 1)

		const interestPayment = balance * monthlyRate
		const principalPayment = Math.min(monthlyPayment - interestPayment, balance)
		const actualPayment = interestPayment + principalPayment

		balance -= principalPayment

		schedule.push({
			paymentNumber,
			date: paymentDate,
			payment: actualPayment,
			principal: principalPayment,
			interest: interestPayment,
			remainingBalance: Math.max(balance, 0)
		})

		paymentNumber++
	}

	return schedule
}

/**
 * Calculate minimum payment required to pay off debt in specified months
 */
export function calculateRequiredPayment(
	currentBalance: number,
	apr: number,
	targetMonths: number
): number {
	if (currentBalance <= 0 || targetMonths <= 0) {
		return 0
	}

	const monthlyRate = apr / 100 / 12
	
	if (monthlyRate === 0) {
		// No interest - simple division
		return currentBalance / targetMonths
	}

	// Use loan payment formula: PMT = PV * (r * (1 + r)^n) / ((1 + r)^n - 1)
	const numerator = currentBalance * monthlyRate * Math.pow(1 + monthlyRate, targetMonths)
	const denominator = Math.pow(1 + monthlyRate, targetMonths) - 1
	
	return numerator / denominator
}

/**
 * Compare debt payoff strategies
 */
export function compareDebtStrategies(
	currentBalance: number,
	apr: number,
	minimumPayment: number
): DebtStrategy[] {
	const strategies: DebtStrategy[] = []

	// Minimum payment strategy
	const minProjection = calculateDebtPayoffProjection(currentBalance, apr, minimumPayment)
	strategies.push({
		name: 'Minimum Payment',
		description: 'Pay only the minimum required amount',
		monthsToPayoff: minProjection.monthsToPayoff,
		totalInterestPaid: minProjection.totalInterestPaid
	})

	// Double minimum payment strategy
	if (minimumPayment > 0) {
		const doubleProjection = calculateDebtPayoffProjection(currentBalance, apr, minimumPayment * 2)
		strategies.push({
			name: 'Double Minimum',
			description: 'Pay twice the minimum amount',
			monthsToPayoff: doubleProjection.monthsToPayoff,
			totalInterestPaid: doubleProjection.totalInterestPaid,
			monthlySavings: minProjection.totalInterestPaid - doubleProjection.totalInterestPaid
		})
	}

	// Aggressive payoff (3-5 years)
	const aggressiveMonths = Math.min(60, Math.max(36, minProjection.monthsToPayoff * 0.5))
	const aggressivePayment = calculateRequiredPayment(currentBalance, apr, aggressiveMonths)
	const aggressiveProjection = calculateDebtPayoffProjection(currentBalance, apr, aggressivePayment)
	
	strategies.push({
		name: 'Aggressive Payoff',
		description: `Pay off in ${Math.round(aggressiveMonths)} months`,
		monthsToPayoff: aggressiveProjection.monthsToPayoff,
		totalInterestPaid: aggressiveProjection.totalInterestPaid,
		monthlySavings: minProjection.totalInterestPaid - aggressiveProjection.totalInterestPaid
	})

	return strategies.filter(s => s.monthsToPayoff < Infinity)
}

/**
 * Calculate next payment due date based on minimum payment schedule
 */
export function calculateNextPaymentDate(lastPaymentDate?: string): Date {
	const today = new Date()
	const nextMonth = new Date(today)
	nextMonth.setMonth(nextMonth.getMonth() + 1)
	
	if (lastPaymentDate) {
		const lastPayment = new Date(lastPaymentDate)
		const nextPayment = new Date(lastPayment)
		nextPayment.setMonth(nextPayment.getMonth() + 1)
		
		// If next payment is in the future, use it; otherwise use next month
		return nextPayment > today ? nextPayment : nextMonth
	}
	
	return nextMonth
}

/**
 * Check if debt payment is overdue
 */
export function isPaymentOverdue(
	envelope: Envelope,
	transactions: Transaction[] = []
): boolean {
	if (envelope.type !== 'debt' || !envelope.minimum_payment) {
		return false
	}

	// Find last payment to this debt envelope
	const lastPayment = transactions
		.filter(t => t.envelope_id === envelope.id && t.amount > 0)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

	const nextDueDate = calculateNextPaymentDate(lastPayment?.date)
	return new Date() > nextDueDate
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(amount)
}

/**
 * Format months to years and months
 */
export function formatDuration(months: number): string {
	if (months === Infinity) {
		return 'Never (payment too low)'
	}
	
	if (months < 12) {
		return `${Math.round(months)} month${Math.round(months) === 1 ? '' : 's'}`
	}
	
	const years = Math.floor(months / 12)
	const remainingMonths = Math.round(months % 12)
	
	if (remainingMonths === 0) {
		return `${years} year${years === 1 ? '' : 's'}`
	}
	
	return `${years} year${years === 1 ? '' : 's'}, ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`
}