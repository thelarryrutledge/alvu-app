<script lang="ts">
	import { onMount } from 'svelte'
	import { formatCurrency, formatDate, formatRelativeTime } from '$lib/utils/savingsGoalCalculations'
	import { 
		getGoalHistory, 
		getGoalHistorySummary, 
		getProgressTimeline,
		formatHistoryEntry,
		calculateGoalStatistics,
		type GoalHistoryEntry,
		type GoalHistorySummary,
		type ProgressTimelineEntry
	} from '$lib/utils/goalHistoryTracking'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import type { Envelope } from '$lib/types/database'
	
	// Props
	export let envelope: Envelope
	export let userId: string
	export let open = false
	
	// Component state
	let loading = true
	let historyEntries: GoalHistoryEntry[] = []
	let historySummary: GoalHistorySummary | null = null
	let progressTimeline: ProgressTimelineEntry[] = []
	let selectedTab: 'timeline' | 'statistics' | 'events' = 'timeline'
	let showAllEvents = false
	
	// Reactive values
	$: visibleEntries = showAllEvents ? historyEntries : historyEntries.slice(0, 10)
	$: goalStatistics = calculateGoalStatistics(historyEntries)
	
	/**
	 * Load goal history data
	 */
	async function loadGoalHistory() {
		if (!envelope.id || !userId) return
		
		loading = true
		
		try {
			// Load all data in parallel
			const [history, summary, timeline] = await Promise.all([
				getGoalHistory(userId, envelope.id, 100),
				getGoalHistorySummary(userId, envelope.id),
				getProgressTimeline(userId, envelope.id, 90)
			])
			
			historyEntries = history
			historySummary = summary
			progressTimeline = timeline
		} catch (error) {
			console.error('Error loading goal history:', error)
		} finally {
			loading = false
		}
	}
	
	/**
	 * Format progress change for display
	 */
	function formatProgressChange(current: number, previous?: number): string {
		if (previous === undefined) return `${current.toFixed(1)}%`
		
		const change = current - previous
		const direction = change > 0 ? '+' : ''
		return `${current.toFixed(1)}% (${direction}${change.toFixed(1)}%)`
	}
	
	/**
	 * Get timeline chart data points
	 */
	function getTimelineChartData(): Array<{ date: string; progress: number; balance: number }> {
		return progressTimeline.map(entry => ({
			date: entry.event_date,
			progress: entry.progress_percentage,
			balance: entry.balance_at_event
		}))
	}
	
	/**
	 * Get color class for event type
	 */
	function getEventColorClass(color: string): string {
		const colorMap: Record<string, string> = {
			blue: 'bg-blue-100 text-blue-800 border-blue-200',
			green: 'bg-green-100 text-green-800 border-green-200',
			yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
			red: 'bg-red-100 text-red-800 border-red-200',
			gray: 'bg-gray-100 text-gray-800 border-gray-200'
		}
		return colorMap[color] || colorMap.gray
	}
	
	/**
	 * Handle tab change
	 */
	function handleTabChange(tab: typeof selectedTab) {
		selectedTab = tab
	}
	
	// Load data when component mounts or envelope changes
	$: if (open && envelope.id && userId) {
		loadGoalHistory()
	}
</script>

{#if open}
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<!-- Header -->
		<div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-medium text-gray-900">Goal History</h3>
					<p class="text-sm text-gray-600 mt-1">{envelope.name}</p>
				</div>
				{#if historySummary}
					<div class="text-right">
						<div class="text-sm text-gray-600">
							{historySummary.total_events} events • {historySummary.days_since_created} days
						</div>
						{#if historySummary.completion_date}
							<div class="text-xs text-green-600 font-medium">
								Completed {formatRelativeTime(new Date(historySummary.completion_date))}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Tab Navigation -->
		<div class="border-b border-gray-200">
			<nav class="flex space-x-8 px-6" aria-label="Tabs">
				<button
					type="button"
					class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {selectedTab === 'timeline' 
						? 'border-blue-500 text-blue-600' 
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					on:click={() => handleTabChange('timeline')}
				>
					Timeline
				</button>
				<button
					type="button"
					class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {selectedTab === 'statistics' 
						? 'border-blue-500 text-blue-600' 
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					on:click={() => handleTabChange('statistics')}
				>
					Statistics
				</button>
				<button
					type="button"
					class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {selectedTab === 'events' 
						? 'border-blue-500 text-blue-600' 
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					on:click={() => handleTabChange('events')}
				>
					Events ({historyEntries.length})
				</button>
			</nav>
		</div>
		
		<!-- Content -->
		<div class="p-6">
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<LoadingSpinner size="lg" />
				</div>
			{:else if selectedTab === 'timeline'}
				<!-- Progress Timeline -->
				<div class="space-y-6">
					{#if progressTimeline.length > 0}
						<!-- Simple Progress Chart -->
						<div class="bg-gray-50 rounded-lg p-4">
							<h4 class="text-sm font-medium text-gray-900 mb-4">Progress Over Time (Last 90 Days)</h4>
							<div class="space-y-2">
								{#each progressTimeline.slice(-10) as entry, index}
									<div class="flex items-center justify-between text-sm">
										<div class="flex items-center space-x-3">
											<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
											<span class="text-gray-600">{formatDate(new Date(entry.event_date))}</span>
										</div>
										<div class="flex items-center space-x-4">
											<span class="text-gray-900">{entry.progress_percentage.toFixed(1)}%</span>
											<span class="text-gray-600">{formatCurrency(entry.balance_at_event)}</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
						
						<!-- Key Milestones -->
						{#if Object.keys(goalStatistics.milestonesDates).length > 0}
							<div>
								<h4 class="text-sm font-medium text-gray-900 mb-3">Milestones Achieved</h4>
								<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
									{#each Object.entries(goalStatistics.milestonesDates) as [percentage, date]}
										<div class="bg-green-50 rounded-lg p-3 text-center">
											<div class="text-lg font-semibold text-green-600">{percentage}%</div>
											<div class="text-xs text-green-700">{formatDate(new Date(date))}</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{:else}
						<div class="text-center py-8 text-gray-500">
							<div class="text-4xl mb-2">📈</div>
							<p>No timeline data available yet</p>
						</div>
					{/if}
				</div>
			{:else if selectedTab === 'statistics'}
				<!-- Goal Statistics -->
				<div class="space-y-6">
					{#if historySummary}
						<!-- Summary Cards -->
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<div class="bg-blue-50 rounded-lg p-4 text-center">
								<div class="text-2xl font-bold text-blue-600">{historySummary.total_events}</div>
								<div class="text-sm text-blue-700">Total Events</div>
							</div>
							<div class="bg-green-50 rounded-lg p-4 text-center">
								<div class="text-2xl font-bold text-green-600">{historySummary.milestones_reached}</div>
								<div class="text-sm text-green-700">Milestones</div>
							</div>
							<div class="bg-yellow-50 rounded-lg p-4 text-center">
								<div class="text-2xl font-bold text-yellow-600">{historySummary.modifications_made}</div>
								<div class="text-sm text-yellow-700">Modifications</div>
							</div>
							<div class="bg-purple-50 rounded-lg p-4 text-center">
								<div class="text-2xl font-bold text-purple-600">{historySummary.days_since_created}</div>
								<div class="text-sm text-purple-700">Days Active</div>
							</div>
						</div>
						
						<!-- Detailed Statistics -->
						<div class="bg-gray-50 rounded-lg p-4">
							<h4 class="text-sm font-medium text-gray-900 mb-4">Goal Performance</h4>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
								<div>
									<span class="text-gray-600">Average Progress per Day:</span>
									<span class="ml-2 font-medium text-gray-900">
										{goalStatistics.averageProgressPerDay > 0 ? '+' : ''}{goalStatistics.averageProgressPerDay.toFixed(2)}%
									</span>
								</div>
								<div>
									<span class="text-gray-600">Goal Created:</span>
									<span class="ml-2 font-medium text-gray-900">
										{historySummary.first_event_date ? formatDate(new Date(historySummary.first_event_date)) : 'Unknown'}
									</span>
								</div>
								<div>
									<span class="text-gray-600">Last Activity:</span>
									<span class="ml-2 font-medium text-gray-900">
										{historySummary.last_event_date ? formatRelativeTime(new Date(historySummary.last_event_date)) : 'Unknown'}
									</span>
								</div>
								{#if historySummary.completion_date}
									<div>
										<span class="text-gray-600">Completed:</span>
										<span class="ml-2 font-medium text-green-600">
											{formatDate(new Date(historySummary.completion_date))}
										</span>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">
							<div class="text-4xl mb-2">📊</div>
							<p>No statistics available yet</p>
						</div>
					{/if}
				</div>
			{:else if selectedTab === 'events'}
				<!-- Event History -->
				<div class="space-y-4">
					{#if historyEntries.length > 0}
						{#each visibleEntries as entry}
							{@const formatted = formatHistoryEntry(entry)}
							<div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 rounded-full {getEventColorClass(formatted.color)} flex items-center justify-center text-sm">
										{formatted.icon}
									</div>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between">
										<h5 class="text-sm font-medium text-gray-900">{formatted.title}</h5>
										<span class="text-xs text-gray-500">{formatRelativeTime(formatted.timestamp)}</span>
									</div>
									<p class="text-sm text-gray-600 mt-1">{formatted.description}</p>
									<div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
										<span>Progress: {entry.progress_percentage.toFixed(1)}%</span>
										<span>Balance: {formatCurrency(entry.balance_at_event)}</span>
										{#if entry.target_amount_at_event}
											<span>Target: {formatCurrency(entry.target_amount_at_event)}</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
						
						{#if historyEntries.length > 10 && !showAllEvents}
							<div class="text-center pt-4">
								<button
									type="button"
									on:click={() => showAllEvents = true}
									class="text-blue-600 hover:text-blue-700 text-sm font-medium"
								>
									Show all {historyEntries.length} events
								</button>
							</div>
						{:else if showAllEvents}
							<div class="text-center pt-4">
								<button
									type="button"
									on:click={() => showAllEvents = false}
									class="text-blue-600 hover:text-blue-700 text-sm font-medium"
								>
									Show less
								</button>
							</div>
						{/if}
					{:else}
						<div class="text-center py-8 text-gray-500">
							<div class="text-4xl mb-2">📝</div>
							<p>No events recorded yet</p>
							<p class="text-sm mt-1">History will appear as you make progress on your goal</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Additional styles if needed */
</style>