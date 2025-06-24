<script lang="ts">
	import { onMount } from 'svelte'
	import AchievementBadge from './AchievementBadge.svelte'
	import { user } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'
	import type { Envelope } from '$lib/types/database'
	
	// Props
	export let envelopes: Envelope[] = []
	export let showTitle: boolean = true
	export let maxDisplay: number = 0 // 0 means show all
	export let size: 'sm' | 'md' | 'lg' = 'md'
	
	// State
	let achievements: Achievement[] = []
	let loading = true
	let error: string | null = null
	
	// Achievement interface
	interface Achievement {
		id: string
		type: 'milestone' | 'achievement' | 'streak' | 'special'
		percentage: number
		goalName: string
		goalId: string
		achievedDate: Date
		earned: boolean
	}
	
	// Load achievements from goal history
	async function loadAchievements() {
		if (!$user) return
		
		try {
			loading = true
			error = null
			
			// Fetch goal history from database
			const { data: goalHistory, error: historyError } = await supabase
				.from('goal_history')
				.select('*')
				.eq('user_id', $user.id)
				.order('achieved_at', { ascending: false })
			
			if (historyError) throw historyError
			
			// Convert goal history to achievements
			const loadedAchievements: Achievement[] = []
			
			// Process milestone achievements
			if (goalHistory) {
				for (const history of goalHistory) {
					const envelope = envelopes.find(e => e.id === history.envelope_id)
					if (envelope) {
						if (history.milestone_percentage) {
							loadedAchievements.push({
								id: `milestone-${history.envelope_id}-${history.milestone_percentage}`,
								type: 'milestone',
								percentage: history.milestone_percentage,
								goalName: envelope.name,
								goalId: envelope.id,
								achievedDate: new Date(history.achieved_at),
								earned: true
							})
						}
						
						if (history.goal_completed) {
							loadedAchievements.push({
								id: `achievement-${history.envelope_id}`,
								type: 'achievement',
								percentage: 100,
								goalName: envelope.name,
								goalId: envelope.id,
								achievedDate: new Date(history.achieved_at),
								earned: true
							})
						}
					}
				}
			}
			
			// Add potential achievements (not yet earned)
			const savingsEnvelopes = envelopes.filter(e => e.type === 'savings' && e.target_amount)
			for (const envelope of savingsEnvelopes) {
				const milestones = [25, 50, 75, 100]
				const currentProgress = (envelope.balance / envelope.target_amount!) * 100
				
				for (const milestone of milestones) {
					const achievementId = milestone === 100 
						? `achievement-${envelope.id}`
						: `milestone-${envelope.id}-${milestone}`
					
					// Check if already earned
					const alreadyEarned = loadedAchievements.some(a => a.id === achievementId)
					
					if (!alreadyEarned) {
						loadedAchievements.push({
							id: achievementId,
							type: milestone === 100 ? 'achievement' : 'milestone',
							percentage: milestone,
							goalName: envelope.name,
							goalId: envelope.id,
							achievedDate: new Date(),
							earned: currentProgress >= milestone
						})
					}
				}
			}
			
			// Sort achievements: earned first, then by date/percentage
			achievements = loadedAchievements.sort((a, b) => {
				if (a.earned !== b.earned) {
					return a.earned ? -1 : 1
				}
				if (a.earned) {
					return b.achievedDate.getTime() - a.achievedDate.getTime()
				}
				return a.percentage - b.percentage
			})
			
			// Limit display if maxDisplay is set
			if (maxDisplay > 0) {
				achievements = achievements.slice(0, maxDisplay)
			}
			
		} catch (err) {
			console.error('Error loading achievements:', err)
			error = err instanceof Error ? err.message : 'Failed to load achievements'
		} finally {
			loading = false
		}
	}
	
	// Get achievement statistics
	$: stats = {
		total: achievements.length,
		earned: achievements.filter(a => a.earned).length,
		milestones: achievements.filter(a => a.type === 'milestone' && a.earned).length,
		completed: achievements.filter(a => a.type === 'achievement' && a.earned).length
	}
	
	// Load achievements when component mounts or envelopes change
	$: if ($user && envelopes.length > 0) {
		loadAchievements()
	}
	
	onMount(() => {
		if ($user && envelopes.length > 0) {
			loadAchievements()
		}
	})
</script>

<div class="achievement-gallery">
	{#if showTitle}
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-gray-900">
				Achievements
			</h3>
			
			{#if !loading && achievements.length > 0}
				<div class="text-sm text-gray-600">
					{stats.earned} of {stats.total} earned
				</div>
			{/if}
		</div>
	{/if}
	
	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
		</div>
	{:else if error}
		<div class="text-center py-8">
			<div class="text-red-600 mb-2">⚠️</div>
			<p class="text-sm text-red-600">{error}</p>
			<button 
				on:click={loadAchievements}
				class="mt-2 text-sm text-blue-600 hover:text-blue-800"
			>
				Try again
			</button>
		</div>
	{:else if achievements.length === 0}
		<div class="text-center py-8">
			<div class="text-4xl mb-2">🎯</div>
			<p class="text-sm text-gray-600">
				Start saving to earn your first achievement!
			</p>
		</div>
	{:else}
		<!-- Achievement Stats -->
		{#if showTitle && stats.earned > 0}
			<div class="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
				<div class="text-center">
					<div class="text-2xl font-bold text-blue-600">{stats.milestones}</div>
					<div class="text-xs text-gray-600">Milestones</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600">{stats.completed}</div>
					<div class="text-xs text-gray-600">Goals</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-purple-600">{stats.earned}</div>
					<div class="text-xs text-gray-600">Total</div>
				</div>
			</div>
		{/if}
		
		<!-- Achievement Grid -->
		<div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
			{#each achievements as achievement (achievement.id)}
				<AchievementBadge
					type={achievement.type}
					percentage={achievement.percentage}
					goalName={achievement.goalName}
					achievedDate={achievement.earned ? achievement.achievedDate : null}
					{size}
					earned={achievement.earned}
					showDetails={true}
				/>
			{/each}
		</div>
		
		<!-- Show More Link -->
		{#if maxDisplay > 0 && achievements.length >= maxDisplay}
			<div class="text-center mt-4">
				<button 
					on:click={() => maxDisplay = 0}
					class="text-sm text-blue-600 hover:text-blue-800 font-medium"
				>
					Show all achievements
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.achievement-gallery {
		/* Custom styles for the gallery */
	}
</style>