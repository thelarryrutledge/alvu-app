// Goal Achievement Notification System
// Handles notifications for savings goal milestones and achievements

import { toastHelpers } from '$lib/stores/toast'
import type { SavingsGoalProgress } from './savingsGoalCalculations'

export interface GoalNotification {
	id: string
	type: 'milestone' | 'achievement' | 'warning' | 'encouragement'
	title: string
	message: string
	icon: string
	color: 'green' | 'blue' | 'yellow' | 'red'
	timestamp: Date
	goalId?: string
	milestonePercentage?: number
}

export interface NotificationPreferences {
	enableMilestoneNotifications: boolean
	enableAchievementNotifications: boolean
	enableWarningNotifications: boolean
	enableEncouragementNotifications: boolean
	notificationFrequency: 'immediate' | 'daily' | 'weekly'
}

// Default notification preferences
export const defaultNotificationPreferences: NotificationPreferences = {
	enableMilestoneNotifications: true,
	enableAchievementNotifications: true,
	enableWarningNotifications: true,
	enableEncouragementNotifications: true,
	notificationFrequency: 'immediate'
}

/**
 * Check for goal achievements and trigger appropriate notifications
 */
export function checkGoalAchievements(
	currentProgress: SavingsGoalProgress,
	previousProgress: SavingsGoalProgress | null,
	goalName: string,
	goalId: string,
	preferences: NotificationPreferences = defaultNotificationPreferences
): GoalNotification[] {
	const notifications: GoalNotification[] = []
	
	// Check for goal completion
	if (currentProgress.isCompleted && (!previousProgress || !previousProgress.isCompleted)) {
		if (preferences.enableAchievementNotifications) {
			notifications.push(createGoalCompletionNotification(goalName, goalId, currentProgress))
		}
	}
	
	// Check for milestone achievements
	if (preferences.enableMilestoneNotifications) {
		const milestoneNotifications = checkMilestoneAchievements(
			currentProgress,
			previousProgress,
			goalName,
			goalId
		)
		notifications.push(...milestoneNotifications)
	}
	
	// Check for warning conditions
	if (preferences.enableWarningNotifications) {
		const warningNotifications = checkWarningConditions(
			currentProgress,
			goalName,
			goalId
		)
		notifications.push(...warningNotifications)
	}
	
	// Check for encouragement opportunities
	if (preferences.enableEncouragementNotifications) {
		const encouragementNotifications = checkEncouragementOpportunities(
			currentProgress,
			previousProgress,
			goalName,
			goalId
		)
		notifications.push(...encouragementNotifications)
	}
	
	return notifications
}

/**
 * Create goal completion notification
 */
function createGoalCompletionNotification(
	goalName: string,
	goalId: string,
	progress: SavingsGoalProgress
): GoalNotification {
	const messages = [
		`🎉 Congratulations! You've reached your ${goalName} goal!`,
		`🌟 Amazing! Your ${goalName} goal is complete!`,
		`🎊 Success! You've achieved your ${goalName} target!`,
		`🏆 Well done! Your ${goalName} goal has been reached!`
	]
	
	const message = messages[Math.floor(Math.random() * messages.length)]
	
	return {
		id: `goal-complete-${goalId}-${Date.now()}`,
		type: 'achievement',
		title: 'Goal Achieved!',
		message,
		icon: '🎉',
		color: 'green',
		timestamp: new Date(),
		goalId
	}
}

/**
 * Check for milestone achievements (25%, 50%, 75%)
 */
function checkMilestoneAchievements(
	currentProgress: SavingsGoalProgress,
	previousProgress: SavingsGoalProgress | null,
	goalName: string,
	goalId: string
): GoalNotification[] {
	const notifications: GoalNotification[] = []
	const milestones = [25, 50, 75]
	
	for (const milestone of milestones) {
		const currentReached = currentProgress.progressPercentage >= milestone
		const previousReached = previousProgress ? previousProgress.progressPercentage >= milestone : false
		
		if (currentReached && !previousReached) {
			notifications.push(createMilestoneNotification(goalName, goalId, milestone))
		}
	}
	
	return notifications
}

/**
 * Create milestone achievement notification
 */
function createMilestoneNotification(
	goalName: string,
	goalId: string,
	milestone: number
): GoalNotification {
	const milestoneMessages = {
		25: {
			title: 'Quarter Way There!',
			messages: [
				`🌱 Great start! You're 25% of the way to your ${goalName} goal!`,
				`📈 Nice progress! A quarter of your ${goalName} goal is complete!`,
				`🎯 Keep it up! You've reached 25% of your ${goalName} target!`
			],
			icon: '🌱'
		},
		50: {
			title: 'Halfway Point!',
			messages: [
				`🎯 Fantastic! You're halfway to your ${goalName} goal!`,
				`⭐ Amazing progress! 50% of your ${goalName} goal is done!`,
				`🚀 You're on fire! Halfway to your ${goalName} target!`
			],
			icon: '🎯'
		},
		75: {
			title: 'Almost There!',
			messages: [
				`🔥 So close! You're 75% of the way to your ${goalName} goal!`,
				`💪 Incredible! Three quarters of your ${goalName} goal is complete!`,
				`🌟 Final stretch! 75% of your ${goalName} target achieved!`
			],
			icon: '🔥'
		}
	}
	
	const config = milestoneMessages[milestone as keyof typeof milestoneMessages]
	const message = config.messages[Math.floor(Math.random() * config.messages.length)]
	
	return {
		id: `milestone-${milestone}-${goalId}-${Date.now()}`,
		type: 'milestone',
		title: config.title,
		message,
		icon: config.icon,
		color: 'blue',
		timestamp: new Date(),
		goalId,
		milestonePercentage: milestone
	}
}

/**
 * Check for warning conditions (behind schedule, etc.)
 */
function checkWarningConditions(
	currentProgress: SavingsGoalProgress,
	goalName: string,
	goalId: string
): GoalNotification[] {
	const notifications: GoalNotification[] = []
	
	// Check if significantly behind schedule
	if (currentProgress.isOnTrack === false && 
		currentProgress.timeProgressPercentage !== undefined &&
		currentProgress.timeProgressPercentage > 50 &&
		currentProgress.progressPercentage < currentProgress.timeProgressPercentage - 20) {
		
		notifications.push({
			id: `warning-behind-${goalId}-${Date.now()}`,
			type: 'warning',
			title: 'Behind Schedule',
			message: `⚠️ Your ${goalName} goal is falling behind schedule. Consider increasing your savings rate to stay on track.`,
			icon: '⚠️',
			color: 'yellow',
			timestamp: new Date(),
			goalId
		})
	}
	
	// Check if target date is approaching with low progress
	if (currentProgress.daysRemaining !== undefined &&
		currentProgress.daysRemaining <= 30 &&
		currentProgress.progressPercentage < 80 &&
		!currentProgress.isCompleted) {
		
		notifications.push({
			id: `warning-deadline-${goalId}-${Date.now()}`,
			type: 'warning',
			title: 'Deadline Approaching',
			message: `🕒 Your ${goalName} goal deadline is approaching in ${currentProgress.daysRemaining} days. You may need to adjust your target or increase savings.`,
			icon: '🕒',
			color: 'yellow',
			timestamp: new Date(),
			goalId
		})
	}
	
	return notifications
}

/**
 * Check for encouragement opportunities
 */
function checkEncouragementOpportunities(
	currentProgress: SavingsGoalProgress,
	previousProgress: SavingsGoalProgress | null,
	goalName: string,
	goalId: string
): GoalNotification[] {
	const notifications: GoalNotification[] = []
	
	// Encourage if making good progress
	if (currentProgress.isOnTrack === true &&
		currentProgress.progressPercentage > 10 &&
		currentProgress.progressPercentage < 90) {
		
		// Only send encouragement occasionally (random chance)
		if (Math.random() < 0.1) { // 10% chance
			notifications.push({
				id: `encouragement-${goalId}-${Date.now()}`,
				type: 'encouragement',
				title: 'Great Progress!',
				message: `💪 You're doing great with your ${goalName} goal! Keep up the excellent work!`,
				icon: '💪',
				color: 'green',
				timestamp: new Date(),
				goalId
			})
		}
	}
	
	return notifications
}

/**
 * Display notification using toast system
 */
export function displayNotification(notification: GoalNotification): void {
	const toastType = getToastType(notification.type)
	
	switch (toastType) {
		case 'success':
			toastHelpers.success(notification.message, {
				title: notification.title,
				duration: notification.type === 'achievement' ? 8000 : 5000
			})
			break
		case 'info':
			toastHelpers.info(notification.message, {
				title: notification.title,
				duration: 5000
			})
			break
		case 'warning':
			toastHelpers.warning(notification.message, {
				title: notification.title,
				duration: 7000
			})
			break
		case 'error':
			toastHelpers.error(notification.message, {
				title: notification.title,
				duration: 6000
			})
			break
	}
}

/**
 * Map notification type to toast type
 */
function getToastType(notificationType: GoalNotification['type']): 'success' | 'info' | 'warning' | 'error' {
	switch (notificationType) {
		case 'achievement':
		case 'milestone':
		case 'encouragement':
			return 'success'
		case 'warning':
			return 'warning'
		default:
			return 'info'
	}
}

/**
 * Batch display multiple notifications with delays
 */
export function displayNotifications(notifications: GoalNotification[]): void {
	notifications.forEach((notification, index) => {
		// Stagger notifications to avoid overwhelming the user
		setTimeout(() => {
			displayNotification(notification)
		}, index * 1000) // 1 second delay between notifications
	})
}

/**
 * Format notification for storage/logging
 */
export function formatNotificationForStorage(notification: GoalNotification): string {
	return JSON.stringify({
		...notification,
		timestamp: notification.timestamp.toISOString()
	})
}

/**
 * Parse stored notification
 */
export function parseStoredNotification(stored: string): GoalNotification {
	const parsed = JSON.parse(stored)
	return {
		...parsed,
		timestamp: new Date(parsed.timestamp)
	}
}

/**
 * Get notification summary for UI display
 */
export function getNotificationSummary(notifications: GoalNotification[]): {
	total: number
	achievements: number
	milestones: number
	warnings: number
	encouragements: number
} {
	return {
		total: notifications.length,
		achievements: notifications.filter(n => n.type === 'achievement').length,
		milestones: notifications.filter(n => n.type === 'milestone').length,
		warnings: notifications.filter(n => n.type === 'warning').length,
		encouragements: notifications.filter(n => n.type === 'encouragement').length
	}
}