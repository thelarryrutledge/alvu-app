// Goal History Tracking Utilities
// Comprehensive tracking and management of savings goal history

import { supabase } from './supabase'
import { calculateSavingsGoalProgress } from './savingsGoalCalculations'
import type { Envelope } from '$lib/types/database'

export type GoalHistoryEventType = 
	| 'goal_created'
	| 'goal_modified'
	| 'milestone_reached'
	| 'goal_completed'
	| 'progress_update'
	| 'target_date_changed'
	| 'target_amount_changed'

export interface GoalHistoryEntry {
	id: string
	user_id: string
	envelope_id: string
	event_type: GoalHistoryEventType
	event_date: string
	balance_at_event: number
	target_amount_at_event?: number
	target_date_at_event?: string
	progress_percentage: number
	previous_target_amount?: number
	previous_target_date?: string
	previous_progress_percentage?: number
	milestone_percentage?: number
	notes?: string
	metadata: Record<string, any>
	created_at: string
}

export interface GoalHistorySummary {
	total_events: number
	milestones_reached: number
	modifications_made: number
	days_since_created: number
	first_event_date?: string
	last_event_date?: string
	completion_date?: string
}

export interface ProgressTimelineEntry {
	event_date: string
	progress_percentage: number
	balance_at_event: number
	target_amount_at_event?: number
	event_type: GoalHistoryEventType
}

export interface GoalModificationChange {
	targetAmountChanged: boolean
	targetDateChanged: boolean
	oldTargetAmount?: number
	newTargetAmount?: number
	oldTargetDate?: string
	newTargetDate?: string
	progressImpact: {
		oldProgress: number
		newProgress: number
		progressChange: number
	}
}

/**
 * Add a goal history entry
 */
export async function addGoalHistoryEntry(
	userId: string,
	envelopeId: string,
	eventType: GoalHistoryEventType,
	balanceAtEvent: number,
	targetAmountAtEvent?: number,
	targetDateAtEvent?: string,
	progressPercentage: number = 0,
	previousTargetAmount?: number,
	previousTargetDate?: string,
	previousProgressPercentage?: number,
	milestonePercentage?: number,
	notes?: string,
	metadata: Record<string, any> = {}
): Promise<string | null> {
	try {
		const { data, error } = await supabase.rpc('add_goal_history_entry', {
			p_user_id: userId,
			p_envelope_id: envelopeId,
			p_event_type: eventType,
			p_balance_at_event: balanceAtEvent,
			p_target_amount_at_event: targetAmountAtEvent,
			p_target_date_at_event: targetDateAtEvent,
			p_progress_percentage: progressPercentage,
			p_previous_target_amount: previousTargetAmount,
			p_previous_target_date: previousTargetDate,
			p_previous_progress_percentage: previousProgressPercentage,
			p_milestone_percentage: milestonePercentage,
			p_notes: notes,
			p_metadata: metadata
		})

		if (error) {
			console.error('Error adding goal history entry:', error)
			return null
		}

		return data
	} catch (error) {
		console.error('Error adding goal history entry:', error)
		return null
	}
}

/**
 * Get goal history for an envelope
 */
export async function getGoalHistory(
	userId: string,
	envelopeId: string,
	limit: number = 50,
	offset: number = 0
): Promise<GoalHistoryEntry[]> {
	try {
		const { data, error } = await supabase.rpc('get_goal_history', {
			p_user_id: userId,
			p_envelope_id: envelopeId,
			p_limit: limit,
			p_offset: offset
		})

		if (error) {
			console.error('Error fetching goal history:', error)
			return []
		}

		return data || []
	} catch (error) {
		console.error('Error fetching goal history:', error)
		return []
	}
}

/**
 * Get goal history summary
 */
export async function getGoalHistorySummary(
	userId: string,
	envelopeId: string
): Promise<GoalHistorySummary | null> {
	try {
		const { data, error } = await supabase.rpc('get_goal_history_summary', {
			p_user_id: userId,
			p_envelope_id: envelopeId
		})

		if (error) {
			console.error('Error fetching goal history summary:', error)
			return null
		}

		return data?.[0] || null
	} catch (error) {
		console.error('Error fetching goal history summary:', error)
		return null
	}
}

/**
 * Get progress timeline
 */
export async function getProgressTimeline(
	userId: string,
	envelopeId: string,
	daysBack: number = 90
): Promise<ProgressTimelineEntry[]> {
	try {
		const { data, error } = await supabase.rpc('get_progress_timeline', {
			p_user_id: userId,
			p_envelope_id: envelopeId,
			p_days_back: daysBack
		})

		if (error) {
			console.error('Error fetching progress timeline:', error)
			return []
		}

		return data || []
	} catch (error) {
		console.error('Error fetching progress timeline:', error)
		return []
	}
}

/**
 * Track milestone achievement
 */
export async function trackMilestoneAchievement(
	userId: string,
	envelope: Envelope,
	milestonePercentage: number
): Promise<boolean> {
	if (!envelope.target_amount) return false

	const progress = calculateSavingsGoalProgress(
		envelope.balance,
		envelope.target_amount,
		envelope.target_date
	)

	const historyId = await addGoalHistoryEntry(
		userId,
		envelope.id,
		'milestone_reached',
		envelope.balance,
		envelope.target_amount,
		envelope.target_date,
		progress.progressPercentage,
		undefined,
		undefined,
		undefined,
		milestonePercentage,
		`${milestonePercentage}% milestone reached`,
		{
			envelope_name: envelope.name,
			milestone_amount: (envelope.target_amount * milestonePercentage) / 100
		}
	)

	return historyId !== null
}

/**
 * Track goal completion
 */
export async function trackGoalCompletion(
	userId: string,
	envelope: Envelope
): Promise<boolean> {
	if (!envelope.target_amount) return false

	const progress = calculateSavingsGoalProgress(
		envelope.balance,
		envelope.target_amount,
		envelope.target_date
	)

	const historyId = await addGoalHistoryEntry(
		userId,
		envelope.id,
		'goal_completed',
		envelope.balance,
		envelope.target_amount,
		envelope.target_date,
		progress.progressPercentage,
		undefined,
		undefined,
		undefined,
		100,
		'Goal completed successfully!',
		{
			envelope_name: envelope.name,
			completion_amount: envelope.balance,
			days_to_complete: progress.daysTotal ? progress.daysTotal - (progress.daysRemaining || 0) : undefined
		}
	)

	return historyId !== null
}

/**
 * Track goal modification
 */
export async function trackGoalModification(
	userId: string,
	envelope: Envelope,
	changes: GoalModificationChange
): Promise<boolean> {
	if (!envelope.target_amount) return false

	const progress = calculateSavingsGoalProgress(
		envelope.balance,
		envelope.target_amount,
		envelope.target_date
	)

	let eventType: GoalHistoryEventType = 'goal_modified'
	let notes = 'Goal modified'

	if (changes.targetAmountChanged && changes.targetDateChanged) {
		eventType = 'goal_modified'
		notes = 'Target amount and date modified'
	} else if (changes.targetAmountChanged) {
		eventType = 'target_amount_changed'
		notes = 'Target amount changed'
	} else if (changes.targetDateChanged) {
		eventType = 'target_date_changed'
		notes = 'Target date changed'
	}

	const historyId = await addGoalHistoryEntry(
		userId,
		envelope.id,
		eventType,
		envelope.balance,
		envelope.target_amount,
		envelope.target_date,
		progress.progressPercentage,
		changes.oldTargetAmount,
		changes.oldTargetDate,
		changes.progressImpact.oldProgress,
		undefined,
		notes,
		{
			envelope_name: envelope.name,
			changes: {
				target_amount_changed: changes.targetAmountChanged,
				target_date_changed: changes.targetDateChanged,
				progress_change: changes.progressImpact.progressChange
			}
		}
	)

	return historyId !== null
}

/**
 * Format event type for display
 */
export function formatEventType(eventType: GoalHistoryEventType): string {
	const eventTypeMap: Record<GoalHistoryEventType, string> = {
		goal_created: 'Goal Created',
		goal_modified: 'Goal Modified',
		milestone_reached: 'Milestone Reached',
		goal_completed: 'Goal Completed',
		progress_update: 'Progress Updated',
		target_date_changed: 'Target Date Changed',
		target_amount_changed: 'Target Amount Changed'
	}

	return eventTypeMap[eventType] || eventType
}

/**
 * Get event type icon
 */
export function getEventTypeIcon(eventType: GoalHistoryEventType): string {
	const iconMap: Record<GoalHistoryEventType, string> = {
		goal_created: '🎯',
		goal_modified: '✏️',
		milestone_reached: '🏆',
		goal_completed: '🎉',
		progress_update: '📈',
		target_date_changed: '📅',
		target_amount_changed: '💰'
	}

	return iconMap[eventType] || '📝'
}

/**
 * Get event type color
 */
export function getEventTypeColor(eventType: GoalHistoryEventType): string {
	const colorMap: Record<GoalHistoryEventType, string> = {
		goal_created: 'blue',
		goal_modified: 'yellow',
		milestone_reached: 'green',
		goal_completed: 'green',
		progress_update: 'blue',
		target_date_changed: 'yellow',
		target_amount_changed: 'yellow'
	}

	return colorMap[eventType] || 'gray'
}

/**
 * Format history entry for display
 */
export function formatHistoryEntry(entry: GoalHistoryEntry): {
	title: string
	description: string
	icon: string
	color: string
	timestamp: Date
} {
	const timestamp = new Date(entry.event_date)
	const icon = getEventTypeIcon(entry.event_type)
	const color = getEventTypeColor(entry.event_type)
	
	let title = formatEventType(entry.event_type)
	let description = entry.notes || ''

	// Add specific details based on event type
	switch (entry.event_type) {
		case 'milestone_reached':
			if (entry.milestone_percentage) {
				title = `${entry.milestone_percentage}% Milestone Reached`
				description = `Reached ${entry.milestone_percentage}% of your savings goal`
			}
			break
		case 'goal_completed':
			title = 'Goal Completed! 🎉'
			description = 'Congratulations! You\'ve reached your savings target'
			break
		case 'target_amount_changed':
			if (entry.previous_target_amount && entry.target_amount_at_event) {
				const change = entry.target_amount_at_event - entry.previous_target_amount
				const direction = change > 0 ? 'increased' : 'decreased'
				description = `Target amount ${direction} by $${Math.abs(change).toFixed(2)}`
			}
			break
		case 'progress_update':
			if (entry.previous_progress_percentage !== undefined) {
				const change = entry.progress_percentage - entry.previous_progress_percentage
				if (Math.abs(change) > 0.1) {
					const direction = change > 0 ? 'increased' : 'decreased'
					description = `Progress ${direction} by ${Math.abs(change).toFixed(1)}%`
				}
			}
			break
	}

	return {
		title,
		description,
		icon,
		color,
		timestamp
	}
}

/**
 * Calculate goal statistics from history
 */
export function calculateGoalStatistics(history: GoalHistoryEntry[]): {
	totalDays: number
	averageProgressPerDay: number
	milestonesDates: Record<number, string>
	completionDate?: string
	modificationCount: number
} {
	if (history.length === 0) {
		return {
			totalDays: 0,
			averageProgressPerDay: 0,
			milestonesDates: {},
			modificationCount: 0
		}
	}

	const sortedHistory = [...history].sort((a, b) => 
		new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
	)

	const firstEntry = sortedHistory[0]
	const lastEntry = sortedHistory[sortedHistory.length - 1]
	
	const startDate = new Date(firstEntry.event_date)
	const endDate = new Date(lastEntry.event_date)
	const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
	
	const progressChange = lastEntry.progress_percentage - firstEntry.progress_percentage
	const averageProgressPerDay = totalDays > 0 ? progressChange / totalDays : 0

	const milestonesDates: Record<number, string> = {}
	const modificationCount = history.filter(entry => 
		['goal_modified', 'target_amount_changed', 'target_date_changed'].includes(entry.event_type)
	).length

	// Find milestone dates
	history.forEach(entry => {
		if (entry.event_type === 'milestone_reached' && entry.milestone_percentage) {
			milestonesDates[entry.milestone_percentage] = entry.event_date
		}
	})

	const completionEntry = history.find(entry => entry.event_type === 'goal_completed')
	const completionDate = completionEntry?.event_date

	return {
		totalDays,
		averageProgressPerDay,
		milestonesDates,
		completionDate,
		modificationCount
	}
}