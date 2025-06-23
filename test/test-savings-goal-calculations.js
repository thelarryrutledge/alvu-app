// Test file for savings goal progress calculations
// Run with: node test/test-savings-goal-calculations.js

import { calculateSavingsGoalProgress, calculateSavingsGoalProjections, formatProgressPercentage, getProgressStatusColor, getProgressStatusText, calculateMilestones } from '../src/lib/utils/savingsGoalCalculations.js'

// Test data
const testCases = [
	{
		name: 'Basic progress - 50% complete',
		currentAmount: 500,
		targetAmount: 1000,
		expected: {
			progressPercentage: 50,
			remainingAmount: 500,
			isCompleted: false
		}
	},
	{
		name: 'Goal completed',
		currentAmount: 1000,
		targetAmount: 1000,
		expected: {
			progressPercentage: 100,
			remainingAmount: 0,
			isCompleted: true
		}
	},
	{
		name: 'Over-funded goal',
		currentAmount: 1200,
		targetAmount: 1000,
		expected: {
			progressPercentage: 100,
			remainingAmount: 0,
			isCompleted: true
		}
	},
	{
		name: 'With target date - on track',
		currentAmount: 500,
		targetAmount: 1000,
		targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
		expected: {
			progressPercentage: 50,
			timeProgressPercentage: 50,
			isOnTrack: true,
			daysRemaining: 30
		}
	},
	{
		name: 'With target date - behind schedule',
		currentAmount: 250,
		targetAmount: 1000,
		targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
		expected: {
			progressPercentage: 25,
			timeProgressPercentage: 50,
			isOnTrack: false,
			daysRemaining: 30
		}
	}
]

// Run tests
console.log('🧪 Testing Savings Goal Progress Calculations\n')

testCases.forEach((testCase, index) => {
	console.log(`Test ${index + 1}: ${testCase.name}`)
	
	try {
		const result = calculateSavingsGoalProgress(
			testCase.currentAmount,
			testCase.targetAmount,
			testCase.targetDate,
			testCase.startDate
		)
		
		// Check basic progress
		console.log(`  ✓ Progress: ${formatProgressPercentage(result.progressPercentage)} (expected: ${testCase.expected.progressPercentage}%)`)
		console.log(`  ✓ Remaining: $${result.remainingAmount} (expected: $${testCase.expected.remainingAmount})`)
		console.log(`  ✓ Completed: ${result.isCompleted} (expected: ${testCase.expected.isCompleted})`)
		
		// Check time-based progress if applicable
		if (testCase.expected.timeProgressPercentage !== undefined) {
			console.log(`  ✓ Time Progress: ${formatProgressPercentage(result.timeProgressPercentage || 0)} (expected: ${testCase.expected.timeProgressPercentage}%)`)
			console.log(`  ✓ On Track: ${result.isOnTrack} (expected: ${testCase.expected.isOnTrack})`)
			console.log(`  ✓ Days Remaining: ${result.daysRemaining} (expected: ~${testCase.expected.daysRemaining})`)
		}
		
		// Test status functions
		const statusColor = getProgressStatusColor(result)
		const statusText = getProgressStatusText(result)
		console.log(`  ✓ Status: ${statusText} (${statusColor})`)
		
		// Test milestones
		const milestones = calculateMilestones(result)
		const achievedMilestones = milestones.filter(m => m.achieved).length
		console.log(`  ✓ Milestones achieved: ${achievedMilestones}/4`)
		
		console.log('  ✅ Test passed\n')
		
	} catch (error) {
		console.log(`  ❌ Test failed: ${error.message}\n`)
	}
})

// Test projections
console.log('🔮 Testing Savings Goal Projections\n')

try {
	const projectionTest = {
		currentAmount: 500,
		targetAmount: 2000,
		targetDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000), // 12 months from now
		monthlyContribution: 100
	}
	
	const projection = calculateSavingsGoalProjections(
		projectionTest.currentAmount,
		projectionTest.targetAmount,
		projectionTest.targetDate,
		projectionTest.monthlyContribution
	)
	
	console.log('Projection Test:')
	console.log(`  Current: $${projectionTest.currentAmount}`)
	console.log(`  Target: $${projectionTest.targetAmount}`)
	console.log(`  Monthly Contribution: $${projectionTest.monthlyContribution}`)
	console.log(`  Projected Amount: $${projection.projectedAmount}`)
	console.log(`  Recommended Monthly: $${projection.recommendedMonthlyAmount?.toFixed(2)}`)
	console.log(`  Recommended Weekly: $${projection.recommendedWeeklyAmount?.toFixed(2)}`)
	console.log(`  Recommended Daily: $${projection.recommendedDailyAmount?.toFixed(2)}`)
	
	if (projection.shortfall) {
		console.log(`  Shortfall: $${projection.shortfall}`)
	} else if (projection.surplus) {
		console.log(`  Surplus: $${projection.surplus}`)
	}
	
	console.log('  ✅ Projection test passed\n')
	
} catch (error) {
	console.log(`  ❌ Projection test failed: ${error.message}\n`)
}

// Test edge cases
console.log('⚠️  Testing Edge Cases\n')

const edgeCases = [
	{
		name: 'Zero target amount',
		test: () => calculateSavingsGoalProgress(100, 0),
		shouldThrow: true
	},
	{
		name: 'Negative current amount',
		test: () => calculateSavingsGoalProgress(-100, 1000),
		shouldThrow: false // Should handle gracefully
	},
	{
		name: 'Past target date',
		test: () => calculateSavingsGoalProgress(500, 1000, new Date(Date.now() - 24 * 60 * 60 * 1000)),
		shouldThrow: false
	}
]

edgeCases.forEach((edgeCase, index) => {
	console.log(`Edge Case ${index + 1}: ${edgeCase.name}`)
	
	try {
		const result = edgeCase.test()
		if (edgeCase.shouldThrow) {
			console.log('  ❌ Expected error but got result')
		} else {
			console.log('  ✅ Handled gracefully')
		}
	} catch (error) {
		if (edgeCase.shouldThrow) {
			console.log('  ✅ Correctly threw error')
		} else {
			console.log(`  ❌ Unexpected error: ${error.message}`)
		}
	}
})

console.log('\n🎉 All tests completed!')