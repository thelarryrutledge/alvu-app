<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { calculateSavingsGoalProgress } from '$lib/utils/savingsGoalCalculations'
	import { checkGoalAchievements, displayNotifications, displayCelebration, defaultNotificationPreferences } from '$lib/utils/goalNotifications'
	import { trackMilestoneAchievement, trackGoalCompletion } from '$lib/utils/goalHistoryTracking'
	import { user } from '$lib/stores/auth'
	import MilestoneCelebration from './MilestoneCelebration.svelte'
	import type { Envelope } from '$lib/types/database'
	import type { SavingsGoalProgress } from '$lib/utils/savingsGoalCalculations'
	import type { GoalNotification, NotificationPreferences } from '$lib/utils/goalNotifications'
	
	// Props
	export let envelopes: Envelope[] = []
	export let notificationPreferences: NotificationPreferences = defaultNotificationPreferences
	export let enabled: boolean = true
	
	// Internal state
	let previousProgressMap = new Map<string, SavingsGoalProgress>()
	let isInitialized = false
	let notificationQueue: GoalNotification[] = []
	
	// Celebration state
	let showCelebration = false
	let currentCelebrationNotification: GoalNotification | null = null
	let currentCelebrationGoal: { currentAmount: number; targetAmount: number; goalName: string } | null = null
	
	// Reactive statement to check for goal achievements when envelopes change
	$: if (enabled && isInitialized && envelopes.length > 0) {
		checkForGoalAchievements(envelopes)
	}
	
	/**
	 * Check all savings envelopes for goal achievements
	 */
	function checkForGoalAchievements(currentEnvelopes: Envelope[]) {
		const allNotifications: GoalNotification[] = []
		
		// Filter to only savings envelopes with targets
		const savingsEnvelopes = currentEnvelopes.filter(
			envelope => envelope.type === 'savings' && envelope.target_amount
		)
		
		for (const envelope of savingsEnvelopes) {
			try {
				// Calculate current progress
				const currentProgress = calculateSavingsGoalProgress(
					envelope.balance,
					envelope.target_amount!,
					envelope.target_date
				)
				
				// Get previous progress if available
				const previousProgress = previousProgressMap.get(envelope.id) || null
				
				// Check for achievements
				const notifications = checkGoalAchievements(
					currentProgress,
					previousProgress,
					envelope.name,
					envelope.id,
					notificationPreferences
				)
				
				// Add to notification queue
				allNotifications.push(...notifications)
				
				// Update previous progress map
				previousProgressMap.set(envelope.id, currentProgress)
				
			} catch (error) {
				console.error(`Error checking achievements for envelope ${envelope.name}:`, error)
			}
		}
		
		// Display notifications if any
		if (allNotifications.length > 0) {
			queueNotifications(allNotifications, savingsEnvelopes)
		}
	}
	
	/**
	 * Queue notifications for display
	 */
	async function queueNotifications(notifications: GoalNotification[], envelopes: Envelope[]) {
		// Track milestone and completion achievements in history
		const currentUser = $user
		if (currentUser) {
			for (const notification of notifications) {
				const envelope = envelopes.find(e => e.id === notification.goalId)
				if (envelope) {
					if (notification.type === 'milestone' && notification.milestonePercentage) {
						await trackMilestoneAchievement(currentUser.id, envelope, notification.milestonePercentage)
					} else if (notification.type === 'achievement') {
						await trackGoalCompletion(currentUser.id, envelope)
					}
				}
			}
		}
		
		// Separate celebration notifications from regular notifications
		const celebrationNotifications = notifications.filter(n =>
			n.type === 'milestone' || n.type === 'achievement'
		)
		const regularNotifications = notifications.filter(n =>
			n.type !== 'milestone' && n.type !== 'achievement'
		)
		
		// Add regular notifications to queue
		notificationQueue.push(...regularNotifications)
		
		// Handle celebrations immediately
		if (celebrationNotifications.length > 0) {
			processCelebrationQueue(celebrationNotifications, envelopes)
		}
		
		// Process regular notification queue
		if (regularNotifications.length > 0) {
			processNotificationQueue()
		}
	}
	
	/**
	 * Process notification queue with appropriate timing
	 */
	function processNotificationQueue() {
		if (notificationQueue.length === 0) return
		
		// Get notifications to display (limit to avoid overwhelming user)
		const notificationsToDisplay = notificationQueue.splice(0, 3) // Max 3 at a time
		
		// Display notifications
		displayNotifications(notificationsToDisplay)
		
		// If more notifications remain, schedule them for later
		if (notificationQueue.length > 0) {
			setTimeout(() => {
				processNotificationQueue()
			}, 5000) // 5 second delay before showing more
		}
	}
	
	/**
	 * Process celebration queue with enhanced visual effects
	 */
	function processCelebrationQueue(celebrations: GoalNotification[], envelopes: Envelope[]) {
		if (celebrations.length === 0) return
		
		// Show celebrations one at a time
		const celebration = celebrations[0]
		const envelope = envelopes.find(e => e.id === celebration.goalId)
		
		if (envelope) {
			// Set up celebration data
			currentCelebrationNotification = celebration
			currentCelebrationGoal = {
				currentAmount: envelope.balance,
				targetAmount: envelope.target_amount || 0,
				goalName: envelope.name
			}
			
			// Show celebration modal
			showCelebration = true
			
			// If more celebrations remain, schedule them for later
			if (celebrations.length > 1) {
				setTimeout(() => {
					processCelebrationQueue(celebrations.slice(1), envelopes)
				}, 3000) // 3 second delay between celebrations
			}
		}
	}
	
	/**
	 * Handle celebration close
	 */
	function handleCelebrationClose() {
		showCelebration = false
		currentCelebrationNotification = null
		currentCelebrationGoal = null
	}
	
	/**
	 * Handle celebration share
	 */
	function handleCelebrationShare() {
		// Handle sharing logic here if needed
		console.log('Celebration shared!')
	}
	
	/**
	 * Initialize progress tracking for existing envelopes
	 */
	function initializeProgressTracking(initialEnvelopes: Envelope[]) {
		const savingsEnvelopes = initialEnvelopes.filter(
			envelope => envelope.type === 'savings' && envelope.target_amount
		)
		
		for (const envelope of savingsEnvelopes) {
			try {
				const progress = calculateSavingsGoalProgress(
					envelope.balance,
					envelope.target_amount!,
					envelope.target_date
				)
				
				previousProgressMap.set(envelope.id, progress)
			} catch (error) {
				console.error(`Error initializing progress for envelope ${envelope.name}:`, error)
			}
		}
		
		isInitialized = true
	}
	
	/**
	 * Reset progress tracking (useful when user changes or data reloads)
	 */
	export function resetProgressTracking() {
		previousProgressMap.clear()
		notificationQueue.length = 0
		isInitialized = false
		
		// Re-initialize if envelopes are available
		if (envelopes.length > 0) {
			initializeProgressTracking(envelopes)
		}
	}
	
	/**
	 * Manually trigger achievement check (useful for testing)
	 */
	export function triggerAchievementCheck() {
		if (envelopes.length > 0) {
			checkForGoalAchievements(envelopes)
		}
	}
	
	/**
	 * Get current progress for all savings envelopes
	 */
	export function getCurrentProgress(): Map<string, SavingsGoalProgress> {
		return new Map(previousProgressMap)
	}
	
	// Initialize when component mounts
	onMount(() => {
		if (envelopes.length > 0) {
			initializeProgressTracking(envelopes)
		}
	})
	
	// Cleanup when component unmounts
	onDestroy(() => {
		previousProgressMap.clear()
		notificationQueue.length = 0
	})
	
	// Watch for envelope changes and initialize if needed
	$: if (!isInitialized && envelopes.length > 0) {
		initializeProgressTracking(envelopes)
	}
</script>

<!-- This component doesn't render any UI - it's purely functional -->
<!-- It monitors envelope changes and triggers notifications automatically -->

<!-- Celebration Modal -->
{#if showCelebration && currentCelebrationNotification && currentCelebrationGoal}
	<MilestoneCelebration
		notification={currentCelebrationNotification}
		goalName={currentCelebrationGoal.goalName}
		currentAmount={currentCelebrationGoal.currentAmount}
		targetAmount={currentCelebrationGoal.targetAmount}
		show={showCelebration}
		on:close={handleCelebrationClose}
		on:shared={handleCelebrationShare}
	/>
{/if}

<style>
	/* No styles needed - this is a functional component */
</style>