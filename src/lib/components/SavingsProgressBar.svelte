<script lang="ts">
	import { calculateSavingsGoalProgress, formatProgressPercentage, formatCurrency, formatRelativeTime, getProgressStatusColor, getProgressStatusText, calculateMilestones } from '$lib/utils/savingsGoalCalculations'
	import type { SavingsGoalProgress } from '$lib/utils/savingsGoalCalculations'
	
	// Props
	export let currentAmount: number
	export let targetAmount: number
	export let targetDate: string | Date | undefined = undefined
	export let startDate: string | Date | undefined = undefined
	export let showDetails: boolean = true
	export let showMilestones: boolean = false
	export let size: 'sm' | 'md' | 'lg' = 'md'
	export let variant: 'default' | 'minimal' | 'detailed' = 'default'
	
	// Calculate progress
	$: progress = calculateSavingsGoalProgress(currentAmount, targetAmount, targetDate, startDate)
	$: statusColor = getProgressStatusColor(progress) as 'green' | 'yellow' | 'red'
	$: statusText = getProgressStatusText(progress)
	$: milestones = showMilestones ? calculateMilestones(progress) : []
	
	// Size classes
	const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
		sm: 'h-2',
		md: 'h-3',
		lg: 'h-4'
	}
	
	// Color classes
	const colorClasses: Record<'green' | 'yellow' | 'red', string> = {
		green: 'bg-green-500',
		yellow: 'bg-yellow-500',
		red: 'bg-red-500'
	}
	
	// Background color classes
	const bgColorClasses: Record<'green' | 'yellow' | 'red', string> = {
		green: 'bg-green-100',
		yellow: 'bg-yellow-100',
		red: 'bg-red-100'
	}
	
	// Text color classes
	const textColorClasses: Record<'green' | 'yellow' | 'red', string> = {
		green: 'text-green-700',
		yellow: 'text-yellow-700',
		red: 'text-red-700'
	}
</script>

<div class="savings-progress-bar">
	{#if variant === 'detailed'}
		<!-- Detailed variant with full information -->
		<div class="space-y-4">
			<!-- Header with amounts and status -->
			<div class="flex items-center justify-between">
				<div>
					<h4 class="text-sm font-medium text-gray-900">
						{formatCurrency(progress.currentAmount)} of {formatCurrency(progress.targetAmount)}
					</h4>
					<p class="text-xs {textColorClasses[statusColor]} font-medium">
						{statusText}
					</p>
				</div>
				<div class="text-right">
					<div class="text-lg font-semibold {textColorClasses[statusColor]}">
						{formatProgressPercentage(progress.progressPercentage)}
					</div>
					{#if progress.remainingAmount > 0}
						<div class="text-xs text-gray-500">
							{formatCurrency(progress.remainingAmount)} remaining
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Progress bar -->
			<div class="relative">
				<div class="w-full {bgColorClasses[statusColor]} rounded-full {sizeClasses[size]}">
					<div
						class="{colorClasses[statusColor]} {sizeClasses[size]} rounded-full transition-all duration-500 ease-out"
						style="width: {progress.progressPercentage}%"
					></div>
				</div>
				
				<!-- Milestones -->
				{#if showMilestones}
					<div class="absolute top-0 w-full {sizeClasses[size]}">
						{#each milestones as milestone}
							{#if milestone.percentage < 100}
								<div
									class="absolute top-0 w-0.5 bg-gray-400 {sizeClasses[size]}"
									style="left: {milestone.percentage}%"
									title="{milestone.label} - {formatCurrency(milestone.amount)}"
								></div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
			
			<!-- Time-based progress (if target date exists) -->
			{#if progress.targetDate && progress.timeProgressPercentage !== undefined}
				<div class="space-y-2">
					<div class="flex items-center justify-between text-xs text-gray-600">
						<span>Time Progress</span>
						<span>{formatProgressPercentage(progress.timeProgressPercentage)}</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-1">
						<div
							class="bg-gray-400 h-1 rounded-full transition-all duration-500"
							style="width: {progress.timeProgressPercentage}%"
						></div>
					</div>
					<div class="flex items-center justify-between text-xs text-gray-500">
						<span>Target: {formatRelativeTime(progress.targetDate)}</span>
						{#if progress.daysRemaining !== undefined}
							<span>{progress.daysRemaining} days left</span>
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- Recommendations -->
			{#if progress.dailyTargetAmount && progress.dailyTargetAmount > 0}
				<div class="bg-blue-50 rounded-lg p-3 space-y-1">
					<h5 class="text-xs font-medium text-blue-900">To reach your goal:</h5>
					<div class="grid grid-cols-3 gap-2 text-xs text-blue-700">
						<div>
							<div class="font-medium">{formatCurrency(progress.dailyTargetAmount)}</div>
							<div class="text-blue-600">per day</div>
						</div>
						{#if progress.weeklyTargetAmount}
							<div>
								<div class="font-medium">{formatCurrency(progress.weeklyTargetAmount)}</div>
								<div class="text-blue-600">per week</div>
							</div>
						{/if}
						{#if progress.monthlyTargetAmount}
							<div>
								<div class="font-medium">{formatCurrency(progress.monthlyTargetAmount)}</div>
								<div class="text-blue-600">per month</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{:else if variant === 'minimal'}
		<!-- Minimal variant - just the progress bar -->
		<div class="flex items-center space-x-3">
			<div class="flex-1">
				<div class="w-full {bgColorClasses[statusColor]} rounded-full {sizeClasses[size]}">
					<div
						class="{colorClasses[statusColor]} {sizeClasses[size]} rounded-full transition-all duration-500 ease-out"
						style="width: {progress.progressPercentage}%"
					></div>
				</div>
			</div>
			<div class="text-sm font-medium {textColorClasses[statusColor]} min-w-0">
				{formatProgressPercentage(progress.progressPercentage)}
			</div>
		</div>
	{:else}
		<!-- Default variant -->
		<div class="space-y-2">
			<!-- Progress info -->
			{#if showDetails}
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-700">
						{formatCurrency(progress.currentAmount)} of {formatCurrency(progress.targetAmount)}
					</span>
					<span class="font-medium {textColorClasses[statusColor]}">
						{formatProgressPercentage(progress.progressPercentage)}
					</span>
				</div>
			{/if}
			
			<!-- Progress bar -->
			<div class="relative">
				<div class="w-full {bgColorClasses[statusColor]} rounded-full {sizeClasses[size]}">
					<div
						class="{colorClasses[statusColor]} {sizeClasses[size]} rounded-full transition-all duration-500 ease-out"
						style="width: {progress.progressPercentage}%"
					></div>
				</div>
				
				<!-- Milestones -->
				{#if showMilestones}
					<div class="absolute top-0 w-full {sizeClasses[size]}">
						{#each milestones as milestone}
							{#if milestone.percentage < 100}
								<div
									class="absolute top-0 w-0.5 bg-gray-400 {sizeClasses[size]}"
									style="left: {milestone.percentage}%"
									title="{milestone.label} - {formatCurrency(milestone.amount)}"
								></div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
			
			<!-- Status and target date -->
			{#if showDetails}
				<div class="flex items-center justify-between text-xs text-gray-600">
					<span class="{textColorClasses[statusColor]} font-medium">{statusText}</span>
					{#if progress.targetDate}
						<span>Target: {formatRelativeTime(progress.targetDate)}</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.savings-progress-bar {
		/* Custom styles if needed */
	}
</style>