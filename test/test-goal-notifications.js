// Test file for goal achievement notification system
// Tests notification triggers, milestone detection, and user feedback

import { checkGoalAchievements, createGoalCompletionNotification, defaultNotificationPreferences } from '../src/lib/utils/goalNotifications.js'

console.log('🧪 Testing Goal Achievement Notification System\n')

// Mock progress data for testing
const testCases = [
	{
		name: 'Goal completion notification',
		current: {
			currentAmount: 1000,
			targetAmount: 1000,
			progressPercentage: 100,
			remainingAmount: 0,
			isCompleted: true,
			isOnTrack: true
		},
		previous: {
			currentAmount: 950,
			targetAmount: 1000,
			progressPercentage: 95,
			remainingAmount: 50,
			isCompleted: false,
			isOnTrack: true
		},
		expectedNotifications: ['achievement']
	},
	{
		name: '25% milestone achievement',
		current: {
			currentAmount: 250,
			targetAmount: 1000,
			progressPercentage: 25,
			remainingAmount: 750,
			isCompleted: false,
			isOnTrack: true
		},
		previous: {
			currentAmount: 200,
			targetAmount: 1000,
			progressPercentage: 20,
			remainingAmount: 800,
			isCompleted: false,
			isOnTrack: true
		},
		expectedNotifications: ['milestone']
	},
	{
		name: '50% milestone achievement',
		current: {
			currentAmount: 500,
			targetAmount: 1000,
			progressPercentage: 50,
			remainingAmount: 500,
			isCompleted: false,
			isOnTrack: true
		},
		previous: {
			currentAmount: 450,
			targetAmount: 1000,
			progressPercentage: 45,
			remainingAmount: 550,
			isCompleted: false,
			isOnTrack: true
		},
		expectedNotifications: ['milestone']
	},
	{
		name: '75% milestone achievement',
		current: {
			currentAmount: 750,
			targetAmount: 1000,
			progressPercentage: 75,
			remainingAmount: 250,
			isCompleted: false,
			isOnTrack: true
		},
		previous: {
			currentAmount: 700,
			targetAmount: 1000,
			progressPercentage: 70,
			remainingAmount: 300,
			isCompleted: false,
			isOnTrack: true
		},
		expectedNotifications: ['milestone']
	},
	{
		name: 'Behind schedule warning',
		current: {
			currentAmount: 300,
			targetAmount: 1000,
			progressPercentage: 30,
			remainingAmount: 700,
			isCompleted: false,
			isOnTrack: false,
			timeProgressPercentage: 60,
			daysRemaining: 60
		},
		previous: {
			currentAmount: 280,
			targetAmount: 1000,
			progressPercentage: 28,
			remainingAmount: 720,
			isCompleted: false,
			isOnTrack: false,
			timeProgressPercentage: 58,
			daysRemaining: 62
		},
		expectedNotifications: ['warning']
	},
	{
		name: 'Deadline approaching warning',
		current: {
			currentAmount: 600,
			targetAmount: 1000,
			progressPercentage: 60,
			remainingAmount: 400,
			isCompleted: false,
			isOnTrack: false,
			daysRemaining: 25
		},
		previous: {
			currentAmount: 580,
			targetAmount: 1000,
			progressPercentage: 58,
			remainingAmount: 420,
			isCompleted: false,
			isOnTrack: false,
			daysRemaining: 27
		},
		expectedNotifications: ['warning']
	},
	{
		name: 'No notifications for small progress',
		current: {
			currentAmount: 105,
			targetAmount: 1000,
			progressPercentage: 10.5,
			remainingAmount: 895,
			isCompleted: false,
			isOnTrack: true
		},
		previous: {
			currentAmount: 100,
			targetAmount: 1000,
			progressPercentage: 10,
			remainingAmount: 900,
			isCompleted: false,
			isOnTrack: true
		},
		expectedNotifications: []
	},
	{
		name: 'Multiple milestones in one update (20% to 60%)',
		current: {
			currentAmount: 600,
			targetAmount: 1000,
			progressPercentage: 60,
			remainingAmount: 400,
			isCompleted: false,
			isOnTrack: true
		},
		previous: {
			currentAmount: 200,
			targetAmount: 1000,
			progressPercentage: 20,
			remainingAmount: 800,
			isCompleted: false,
			isOnTrack: true
		},
		expectedNotifications: ['milestone', 'milestone'] // 25% and 50%
	}
]

// Run notification tests
testCases.forEach((testCase, index) => {
	console.log(`Test ${index + 1}: ${testCase.name}`)
	
	try {
		const notifications = checkGoalAchievements(
			testCase.current,
			testCase.previous,
			'Test Goal',
			`test-goal-${index}`,
			defaultNotificationPreferences
		)
		
		console.log(`  Generated ${notifications.length} notification(s)`)
		
		// Check notification types
		const notificationTypes = notifications.map(n => n.type)
		console.log(`  Notification types: [${notificationTypes.join(', ')}]`)
		
		// Verify expected notifications
		if (testCase.expectedNotifications.length === 0) {
			if (notifications.length === 0) {
				console.log('  ✅ Correctly generated no notifications')
			} else {
				console.log('  ❌ Expected no notifications but got some')
			}
		} else {
			const hasExpectedTypes = testCase.expectedNotifications.every(expectedType =>
				notifications.some(n => n.type === expectedType)
			)
			
			if (hasExpectedTypes) {
				console.log('  ✅ Generated expected notification types')
			} else {
				console.log('  ❌ Missing expected notification types')
				console.log(`    Expected: [${testCase.expectedNotifications.join(', ')}]`)
				console.log(`    Got: [${notificationTypes.join(', ')}]`)
			}
		}
		
		// Display notification details
		notifications.forEach((notification, nIndex) => {
			console.log(`    ${nIndex + 1}. ${notification.type}: ${notification.title}`)
			console.log(`       ${notification.message}`)
			console.log(`       Color: ${notification.color}, Icon: ${notification.icon}`)
		})
		
		console.log('')
		
	} catch (error) {
		console.log(`  ❌ Test failed: ${error.message}\n`)
	}
})

// Test notification message variety
console.log('🎭 Testing Notification Message Variety\n')

try {
	const goalNames = ['Emergency Fund', 'Vacation Fund', 'Car Down Payment', 'Wedding Fund']
	const messageVariety = new Set()
	
	goalNames.forEach(goalName => {
		// Test completion messages
		for (let i = 0; i < 10; i++) {
			const notifications = checkGoalAchievements(
				{
					currentAmount: 1000,
					targetAmount: 1000,
					progressPercentage: 100,
					remainingAmount: 0,
					isCompleted: true
				},
				{
					currentAmount: 950,
					targetAmount: 1000,
					progressPercentage: 95,
					remainingAmount: 50,
					isCompleted: false
				},
				goalName,
				`test-${i}`,
				defaultNotificationPreferences
			)
			
			if (notifications.length > 0) {
				messageVariety.add(notifications[0].message)
			}
		}
	})
	
	console.log(`Generated ${messageVariety.size} unique completion messages:`)
	Array.from(messageVariety).forEach((message, index) => {
		console.log(`  ${index + 1}. ${message}`)
	})
	
	if (messageVariety.size >= 4) {
		console.log('  ✅ Good message variety achieved')
	} else {
		console.log('  ⚠️  Limited message variety')
	}
	
} catch (error) {
	console.log(`  ❌ Message variety test failed: ${error.message}`)
}

// Test notification preferences
console.log('\n⚙️  Testing Notification Preferences\n')

const preferenceTests = [
	{
		name: 'Achievements disabled',
		preferences: {
			...defaultNotificationPreferences,
			enableAchievementNotifications: false
		},
		progress: {
			current: { currentAmount: 1000, targetAmount: 1000, progressPercentage: 100, isCompleted: true },
			previous: { currentAmount: 950, targetAmount: 1000, progressPercentage: 95, isCompleted: false }
		},
		expectedCount: 0
	},
	{
		name: 'Milestones disabled',
		preferences: {
			...defaultNotificationPreferences,
			enableMilestoneNotifications: false
		},
		progress: {
			current: { currentAmount: 250, targetAmount: 1000, progressPercentage: 25, isCompleted: false },
			previous: { currentAmount: 200, targetAmount: 1000, progressPercentage: 20, isCompleted: false }
		},
		expectedCount: 0
	},
	{
		name: 'Warnings disabled',
		preferences: {
			...defaultNotificationPreferences,
			enableWarningNotifications: false
		},
		progress: {
			current: { 
				currentAmount: 300, 
				targetAmount: 1000, 
				progressPercentage: 30, 
				isCompleted: false,
				isOnTrack: false,
				timeProgressPercentage: 60,
				daysRemaining: 25
			},
			previous: { 
				currentAmount: 280, 
				targetAmount: 1000, 
				progressPercentage: 28, 
				isCompleted: false,
				isOnTrack: false,
				timeProgressPercentage: 58,
				daysRemaining: 27
			}
		},
		expectedCount: 0
	}
]

preferenceTests.forEach((test, index) => {
	console.log(`Preference Test ${index + 1}: ${test.name}`)
	
	try {
		const notifications = checkGoalAchievements(
			test.progress.current,
			test.progress.previous,
			'Test Goal',
			`pref-test-${index}`,
			test.preferences
		)
		
		if (notifications.length === test.expectedCount) {
			console.log(`  ✅ Correctly generated ${notifications.length} notification(s)`)
		} else {
			console.log(`  ❌ Expected ${test.expectedCount} notifications, got ${notifications.length}`)
		}
		
	} catch (error) {
		console.log(`  ❌ Preference test failed: ${error.message}`)
	}
})

console.log('\n🎉 Goal Notification Testing Complete!')