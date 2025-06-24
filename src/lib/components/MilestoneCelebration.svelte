<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { fly, scale } from 'svelte/transition'
	import { formatCurrency, formatProgressPercentage } from '$lib/utils/savingsGoalCalculations'
	import type { GoalNotification } from '$lib/utils/goalNotifications'
	
	// Props
	export let notification: GoalNotification
	export let goalName: string = ''
	export let currentAmount: number = 0
	export let targetAmount: number = 0
	export let show: boolean = false
	
	// Event dispatcher
	const dispatch = createEventDispatcher()
	
	// Celebration state
	let celebrationContainer: HTMLElement
	let confettiElements: HTMLElement[] = []
	let showConfetti = false
	let celebrationComplete = false
	
	// Milestone-specific configurations
	const milestoneConfigs = {
		25: {
			title: "Quarter Milestone! 🌱",
			subtitle: "You're building momentum!",
			color: "from-green-400 to-green-600",
			badge: "🌱",
			confettiColors: ['#10B981', '#34D399', '#6EE7B7']
		},
		50: {
			title: "Halfway There! 🎯",
			subtitle: "Amazing progress!",
			color: "from-blue-400 to-blue-600", 
			badge: "🎯",
			confettiColors: ['#3B82F6', '#60A5FA', '#93C5FD']
		},
		75: {
			title: "Almost There! 🔥",
			subtitle: "The finish line is in sight!",
			color: "from-orange-400 to-red-500",
			badge: "🔥",
			confettiColors: ['#F97316', '#FB923C', '#FDBA74']
		},
		100: {
			title: "Goal Achieved! 🎉",
			subtitle: "Congratulations on your success!",
			color: "from-purple-400 to-pink-500",
			badge: "🏆",
			confettiColors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#F472B6', '#FB7185']
		}
	}
	
	// Get milestone configuration
	$: milestonePercentage = notification.milestonePercentage || (notification.type === 'achievement' ? 100 : 25)
	$: config = milestoneConfigs[milestonePercentage as keyof typeof milestoneConfigs] || milestoneConfigs[25]
	
	// Create confetti effect
	function createConfetti() {
		if (!celebrationContainer) return
		
		showConfetti = true
		confettiElements = []
		
		// Create multiple confetti pieces
		for (let i = 0; i < 50; i++) {
			const confetti = document.createElement('div')
			confetti.className = 'confetti-piece'
			confetti.style.cssText = `
				position: absolute;
				width: 10px;
				height: 10px;
				background-color: ${config.confettiColors[Math.floor(Math.random() * config.confettiColors.length)]};
				left: ${Math.random() * 100}%;
				top: -10px;
				border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
				animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
				animation-delay: ${Math.random() * 2}s;
				transform: rotate(${Math.random() * 360}deg);
				z-index: 1000;
			`
			
			celebrationContainer.appendChild(confetti)
			confettiElements.push(confetti)
		}
		
		// Clean up confetti after animation
		setTimeout(() => {
			confettiElements.forEach(el => {
				if (el.parentNode) {
					el.parentNode.removeChild(el)
				}
			})
			showConfetti = false
		}, 5000)
	}
	
	// Handle celebration completion
	function handleCelebrationComplete() {
		celebrationComplete = true
		setTimeout(() => {
			dispatch('close')
		}, 1000)
	}
	
	// Handle close
	function handleClose() {
		dispatch('close')
	}
	
	// Handle share achievement
	function handleShare() {
		const shareText = `🎉 I just reached ${milestonePercentage}% of my ${goalName} savings goal! ${formatCurrency(currentAmount)} of ${formatCurrency(targetAmount)} saved. #SavingsGoals #FinancialSuccess`
		
		if (navigator.share) {
			navigator.share({
				title: 'Savings Milestone Achievement',
				text: shareText,
				url: window.location.href
			}).catch(console.error)
		} else {
			// Fallback to clipboard
			navigator.clipboard.writeText(shareText).then(() => {
				dispatch('shared')
			}).catch(console.error)
		}
	}
	
	// Start celebration when component shows
	$: if (show && !showConfetti) {
		setTimeout(() => {
			createConfetti()
		}, 500)
	}
	
	onMount(() => {
		// Add confetti animation styles
		const style = document.createElement('style')
		style.textContent = `
			@keyframes confetti-fall {
				0% {
					transform: translateY(-10px) rotate(0deg);
					opacity: 1;
				}
				100% {
					transform: translateY(100vh) rotate(720deg);
					opacity: 0;
				}
			}
			
			@keyframes bounce-in {
				0% {
					transform: scale(0.3) rotate(-10deg);
					opacity: 0;
				}
				50% {
					transform: scale(1.1) rotate(5deg);
				}
				100% {
					transform: scale(1) rotate(0deg);
					opacity: 1;
				}
			}
			
			@keyframes pulse-glow {
				0%, 100% {
					box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
				}
				50% {
					box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
				}
			}
		`
		document.head.appendChild(style)
		
		return () => {
			if (style.parentNode) {
				style.parentNode.removeChild(style)
			}
		}
	})
</script>

{#if show}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		on:click={handleClose}
		transition:fly={{ duration: 300, opacity: 0 }}
	>
		<!-- Celebration Container -->
		<div 
			bind:this={celebrationContainer}
			class="relative overflow-hidden"
			on:click|stopPropagation
		>
			<!-- Main Celebration Modal -->
			<div 
				class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto relative overflow-hidden"
				transition:scale={{ duration: 600, start: 0.3 }}
				style="animation: bounce-in 0.6s ease-out;"
			>
				<!-- Gradient Header -->
				<div class="bg-gradient-to-r {config.color} p-6 text-white text-center relative">
					<!-- Badge -->
					<div class="text-6xl mb-2 animate-pulse">
						{config.badge}
					</div>
					
					<!-- Title -->
					<h2 class="text-2xl font-bold mb-1">
						{config.title}
					</h2>
					
					<!-- Subtitle -->
					<p class="text-lg opacity-90">
						{config.subtitle}
					</p>
					
					<!-- Progress Ring -->
					<div class="absolute top-4 right-4">
						<div class="relative w-16 h-16">
							<svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
								<path
									class="text-white text-opacity-20"
									stroke="currentColor"
									stroke-width="3"
									fill="none"
									d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								/>
								<path
									class="text-white"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									fill="none"
									stroke-dasharray="{milestonePercentage}, 100"
									d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								/>
							</svg>
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-xs font-bold text-white">
									{milestonePercentage}%
								</span>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Content -->
				<div class="p-6 space-y-4">
					<!-- Goal Information -->
					<div class="text-center space-y-2">
						<h3 class="text-lg font-semibold text-gray-900">
							{goalName}
						</h3>
						
						<div class="space-y-1">
							<div class="text-2xl font-bold text-gray-900">
								{formatCurrency(currentAmount)}
							</div>
							<div class="text-sm text-gray-600">
								of {formatCurrency(targetAmount)} saved
							</div>
						</div>
						
						{#if milestonePercentage < 100}
							<div class="text-sm text-gray-600">
								{formatCurrency(targetAmount - currentAmount)} remaining to reach your goal
							</div>
						{/if}
					</div>
					
					<!-- Achievement Message -->
					<div class="bg-gray-50 rounded-lg p-4 text-center">
						<p class="text-sm text-gray-700">
							{notification.message}
						</p>
					</div>
					
					<!-- Action Buttons -->
					<div class="flex space-x-3">
						<button
							on:click={handleShare}
							class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
						>
							<span>📱</span>
							<span>Share</span>
						</button>
						
						<button
							on:click={handleCelebrationComplete}
							class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
						>
							Continue
						</button>
					</div>
				</div>
				
				<!-- Celebration Effects Overlay -->
				{#if showConfetti}
					<div class="absolute inset-0 pointer-events-none overflow-hidden">
						<!-- Additional sparkle effects -->
						<div class="absolute top-1/4 left-1/4 text-2xl animate-ping">✨</div>
						<div class="absolute top-1/3 right-1/4 text-xl animate-pulse">⭐</div>
						<div class="absolute bottom-1/3 left-1/3 text-lg animate-bounce">🌟</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Additional custom styles for enhanced animations */
	:global(.confetti-piece) {
		pointer-events: none;
	}
</style>