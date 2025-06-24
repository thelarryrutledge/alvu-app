// Test file for goal modification functionality
// Tests goal modification logic, validation, and progress impact calculations

console.log('🧪 Testing Goal Modification Functionality\n')

// Mock envelope data for testing
const mockEnvelopes = [
	{
		id: 'envelope-1',
		name: 'Emergency Fund',
		type: 'savings',
		balance: 1000,
		target_amount: 2000,
		target_date: '2025-12-31'
	},
	{
		id: 'envelope-2',
		name: 'Vacation Fund',
		type: 'savings',
		balance: 500,
		target_amount: 3000,
		target_date: '2025-06-30'
	},
	{
		id: 'envelope-3',
		name: 'Car Fund',
		type: 'savings',
		balance: 2500,
		target_amount: 5000,
		target_date: null
	}
]

// Test cases for goal modification scenarios
const testCases = [
	{
		name: 'Increase target amount - progress decreases',
		envelope: mockEnvelopes[0],
		modifications: {
			target_amount: 3000, // Increased from 2000
			target_date: '2025-12-31'
		},
		expectedImpact: {
			progressChange: -16.67, // 50% to 33.33%
			direction: 'decrease'
		}
	},
	{
		name: 'Decrease target amount - progress increases',
		envelope: mockEnvelopes[0],
		modifications: {
			target_amount: 1500, // Decreased from 2000
			target_date: '2025-12-31'
		},
		expectedImpact: {
			progressChange: 16.67, // 50% to 66.67%
			direction: 'increase'
		}
	},
	{
		name: 'Change target date only - no progress change',
		envelope: mockEnvelopes[1],
		modifications: {
			target_amount: 3000, // Same as original
			target_date: '2025-08-31' // Changed from 2025-06-30
		},
		expectedImpact: {
			progressChange: 0, // 16.67% stays the same
			direction: 'none'
		}
	},
	{
		name: 'Add target date to envelope without one',
		envelope: mockEnvelopes[2],
		modifications: {
			target_amount: 5000, // Same as original
			target_date: '2025-12-31' // Added new date
		},
		expectedImpact: {
			progressChange: 0, // 50% stays the same
			direction: 'none'
		}
	},
	{
		name: 'Remove target date',
		envelope: mockEnvelopes[1],
		modifications: {
			target_amount: 3000, // Same as original
			target_date: null // Removed date
		},
		expectedImpact: {
			progressChange: 0, // 16.67% stays the same
			direction: 'none'
		}
	},
	{
		name: 'Goal completion scenario',
		envelope: mockEnvelopes[0],
		modifications: {
			target_amount: 1000, // Decreased to match current balance
			target_date: '2025-12-31'
		},
		expectedImpact: {
			progressChange: 50, // 50% to 100%
			direction: 'completion'
		}
	}
]

/**
 * Calculate progress percentage
 */
function calculateProgress(balance, targetAmount) {
	if (!targetAmount || targetAmount <= 0) return 0
	return Math.min(100, (balance / targetAmount) * 100)
}

/**
 * Calculate progress impact of modifications
 */
function calculateProgressImpact(envelope, modifications) {
	const currentProgress = calculateProgress(envelope.balance, envelope.target_amount)
	const newProgress = calculateProgress(envelope.balance, modifications.target_amount)
	const progressChange = newProgress - currentProgress
	
	return {
		oldProgress: currentProgress,
		newProgress: newProgress,
		progressChange: progressChange,
		targetAmountChanged: modifications.target_amount !== envelope.target_amount,
		targetDateChanged: modifications.target_date !== envelope.target_date
	}
}

/**
 * Validate goal modification inputs
 */
function validateGoalModification(modifications) {
	const errors = {}
	
	// Validate target amount
	if (!modifications.target_amount || modifications.target_amount <= 0) {
		errors.target_amount = 'Target amount must be greater than 0'
	} else if (modifications.target_amount > 10000000) {
		errors.target_amount = 'Target amount cannot exceed $10,000,000'
	}
	
	// Validate target date (if provided)
	if (modifications.target_date) {
		const date = new Date(modifications.target_date)
		const today = new Date()
		
		if (isNaN(date.getTime())) {
			errors.target_date = 'Invalid date format'
		} else if (date <= today) {
			errors.target_date = 'Target date must be in the future'
		}
	}
	
	return {
		isValid: Object.keys(errors).length === 0,
		errors
	}
}

// Run test cases
console.log('📊 Testing Goal Modification Scenarios\n')

testCases.forEach((testCase, index) => {
	console.log(`Test ${index + 1}: ${testCase.name}`)
	
	try {
		// Calculate progress impact
		const impact = calculateProgressImpact(testCase.envelope, testCase.modifications)
		
		// Validate modifications
		const validation = validateGoalModification(testCase.modifications)
		
		console.log(`  Original Progress: ${impact.oldProgress.toFixed(2)}%`)
		console.log(`  New Progress: ${impact.newProgress.toFixed(2)}%`)
		console.log(`  Progress Change: ${impact.progressChange > 0 ? '+' : ''}${impact.progressChange.toFixed(2)}%`)
		console.log(`  Target Amount Changed: ${impact.targetAmountChanged}`)
		console.log(`  Target Date Changed: ${impact.targetDateChanged}`)
		console.log(`  Validation: ${validation.isValid ? 'Valid' : 'Invalid'}`)
		
		if (!validation.isValid) {
			console.log(`  Validation Errors:`, validation.errors)
		}
		
		// Check if impact matches expectations
		const expectedChange = testCase.expectedImpact.progressChange
		const actualChange = impact.progressChange
		const tolerance = 0.1 // Allow small floating point differences
		
		if (Math.abs(actualChange - expectedChange) <= tolerance) {
			console.log('  ✅ Progress impact matches expectation')
		} else {
			console.log(`  ❌ Progress impact mismatch. Expected: ${expectedChange}%, Got: ${actualChange.toFixed(2)}%`)
		}
		
		// Check direction
		let actualDirection = 'none'
		if (impact.newProgress >= 100) {
			actualDirection = 'completion'
		} else if (actualChange > 0.1) {
			actualDirection = 'increase'
		} else if (actualChange < -0.1) {
			actualDirection = 'decrease'
		}
		
		if (actualDirection === testCase.expectedImpact.direction) {
			console.log('  ✅ Progress direction matches expectation')
		} else {
			console.log(`  ❌ Progress direction mismatch. Expected: ${testCase.expectedImpact.direction}, Got: ${actualDirection}`)
		}
		
		console.log('')
		
	} catch (error) {
		console.log(`  ❌ Test failed: ${error.message}\n`)
	}
})

// Test validation scenarios
console.log('🔍 Testing Validation Scenarios\n')

const validationTests = [
	{
		name: 'Valid modification',
		modifications: { target_amount: 5000, target_date: '2025-12-31' },
		shouldBeValid: true
	},
	{
		name: 'Zero target amount',
		modifications: { target_amount: 0, target_date: '2025-12-31' },
		shouldBeValid: false
	},
	{
		name: 'Negative target amount',
		modifications: { target_amount: -1000, target_date: '2025-12-31' },
		shouldBeValid: false
	},
	{
		name: 'Excessive target amount',
		modifications: { target_amount: 20000000, target_date: '2025-12-31' },
		shouldBeValid: false
	},
	{
		name: 'Past target date',
		modifications: { target_amount: 5000, target_date: '2020-01-01' },
		shouldBeValid: false
	},
	{
		name: 'Invalid date format',
		modifications: { target_amount: 5000, target_date: 'invalid-date' },
		shouldBeValid: false
	},
	{
		name: 'No target date (valid)',
		modifications: { target_amount: 5000, target_date: null },
		shouldBeValid: true
	}
]

validationTests.forEach((test, index) => {
	console.log(`Validation Test ${index + 1}: ${test.name}`)
	
	try {
		const validation = validateGoalModification(test.modifications)
		
		if (validation.isValid === test.shouldBeValid) {
			console.log('  ✅ Validation result matches expectation')
		} else {
			console.log(`  ❌ Validation mismatch. Expected: ${test.shouldBeValid ? 'Valid' : 'Invalid'}, Got: ${validation.isValid ? 'Valid' : 'Invalid'}`)
		}
		
		if (!validation.isValid) {
			console.log(`  Errors: ${Object.keys(validation.errors).join(', ')}`)
		}
		
	} catch (error) {
		console.log(`  ❌ Validation test failed: ${error.message}`)
	}
	
	console.log('')
})

// Test edge cases
console.log('⚠️  Testing Edge Cases\n')

const edgeCases = [
	{
		name: 'Envelope with zero balance',
		envelope: { balance: 0, target_amount: 1000 },
		modifications: { target_amount: 2000 },
		description: 'Should handle zero balance correctly'
	},
	{
		name: 'Envelope with balance exceeding target',
		envelope: { balance: 1500, target_amount: 1000 },
		modifications: { target_amount: 2000 },
		description: 'Should handle over-funded envelopes'
	},
	{
		name: 'Very small target amount',
		envelope: { balance: 0.50, target_amount: 1.00 },
		modifications: { target_amount: 0.75 },
		description: 'Should handle small decimal amounts'
	}
]

edgeCases.forEach((edgeCase, index) => {
	console.log(`Edge Case ${index + 1}: ${edgeCase.name}`)
	console.log(`  Description: ${edgeCase.description}`)
	
	try {
		const impact = calculateProgressImpact(edgeCase.envelope, edgeCase.modifications)
		console.log(`  Original Progress: ${impact.oldProgress.toFixed(2)}%`)
		console.log(`  New Progress: ${impact.newProgress.toFixed(2)}%`)
		console.log(`  Progress Change: ${impact.progressChange > 0 ? '+' : ''}${impact.progressChange.toFixed(2)}%`)
		console.log('  ✅ Edge case handled successfully')
		
	} catch (error) {
		console.log(`  ❌ Edge case failed: ${error.message}`)
	}
	
	console.log('')
})

console.log('🎉 Goal Modification Testing Complete!')