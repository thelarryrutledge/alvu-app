<script lang="ts">
	import { formatDate } from '$lib/utils/savingsGoalCalculations'
	
	// Props
	export let type: 'milestone' | 'achievement' | 'streak' | 'special' = 'milestone'
	export let percentage: number = 0
	export let goalName: string = ''
	export let achievedDate: Date | string | null = null
	export let size: 'sm' | 'md' | 'lg' = 'md'
	export let earned: boolean = false
	export let showDetails: boolean = true
	
	// Badge configurations
	const badgeConfigs = {
		milestone: {
			25: { icon: '🌱', title: 'First Steps', color: 'from-green-400 to-green-600', bgColor: 'bg-green-100' },
			50: { icon: '🎯', title: 'Halfway Hero', color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-100' },
			75: { icon: '🔥', title: 'Almost There', color: 'from-orange-400 to-red-500', bgColor: 'bg-orange-100' },
			100: { icon: '🏆', title: 'Goal Crusher', color: 'from-purple-400 to-pink-500', bgColor: 'bg-purple-100' }
		},
		achievement: {
			100: { icon: '🎉', title: 'Goal Achieved', color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-100' }
		},
		streak: {
			7: { icon: '📅', title: 'Week Warrior', color: 'from-indigo-400 to-purple-500', bgColor: 'bg-indigo-100' },
			30: { icon: '🗓️', title: 'Month Master', color: 'from-purple-400 to-pink-500', bgColor: 'bg-purple-100' },
			90: { icon: '🏅', title: 'Quarter Champion', color: 'from-pink-400 to-red-500', bgColor: 'bg-pink-100' }
		},
		special: {
			0: { icon: '⭐', title: 'Special Achievement', color: 'from-cyan-400 to-blue-500', bgColor: 'bg-cyan-100' }
		}
	}
	
	// Size configurations
	const sizeConfigs = {
		sm: {
			container: 'w-12 h-12',
			icon: 'text-lg',
			title: 'text-xs',
			subtitle: 'text-xs'
		},
		md: {
			container: 'w-16 h-16',
			icon: 'text-2xl',
			title: 'text-sm',
			subtitle: 'text-xs'
		},
		lg: {
			container: 'w-20 h-20',
			icon: 'text-3xl',
			title: 'text-base',
			subtitle: 'text-sm'
		}
	}
	
	// Get badge configuration
	$: config = (() => {
		const typeConfig = badgeConfigs[type]
		if (typeConfig) {
			return typeConfig[percentage as keyof typeof typeConfig] ||
			       typeConfig[0 as keyof typeof typeConfig] ||
			       badgeConfigs.special[0]
		}
		return badgeConfigs.special[0]
	})()
	
	$: sizeConfig = sizeConfigs[size]
	
	// Format achievement date
	$: formattedDate = achievedDate ? formatDate(new Date(achievedDate)) : null
</script>

<div class="achievement-badge flex flex-col items-center space-y-2">
	<!-- Badge Circle -->
	<div class="relative">
		<div 
			class="
				{sizeConfig.container} 
				rounded-full 
				flex items-center justify-center 
				transition-all duration-300 
				{earned 
					? `bg-gradient-to-br ${config.color} shadow-lg transform hover:scale-110` 
					: `${config.bgColor} opacity-50 grayscale`
				}
			"
			class:animate-pulse={!earned}
		>
			<!-- Badge Icon -->
			<span class="{sizeConfig.icon} {earned ? '' : 'opacity-50'}">
				{config.icon}
			</span>
			
			<!-- Earned Indicator -->
			{#if earned}
				<div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
					<span class="text-white text-xs">✓</span>
				</div>
			{/if}
		</div>
		
		<!-- Glow Effect for Earned Badges -->
		{#if earned}
			<div 
				class="absolute inset-0 rounded-full bg-gradient-to-br {config.color} opacity-20 animate-ping"
				style="animation-duration: 2s;"
			></div>
		{/if}
	</div>
	
	<!-- Badge Details -->
	{#if showDetails}
		<div class="text-center space-y-1">
			<!-- Title -->
			<h4 class="{sizeConfig.title} font-semibold {earned ? 'text-gray-900' : 'text-gray-500'}">
				{config.title}
			</h4>
			
			<!-- Goal Name -->
			{#if goalName}
				<p class="{sizeConfig.subtitle} text-gray-600 truncate max-w-20">
					{goalName}
				</p>
			{/if}
			
			<!-- Achievement Date -->
			{#if earned && formattedDate}
				<p class="text-xs text-gray-500">
					{formattedDate}
				</p>
			{/if}
			
			<!-- Progress Indicator for Milestones -->
			{#if type === 'milestone' && percentage > 0}
				<p class="text-xs font-medium {earned ? 'text-gray-700' : 'text-gray-400'}">
					{percentage}%
				</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.achievement-badge {
		/* Custom styles for badge animations */
	}
	
	/* Hover effects for earned badges */
	.achievement-badge:hover .bg-gradient-to-br {
		transform: scale(1.05);
	}
</style>