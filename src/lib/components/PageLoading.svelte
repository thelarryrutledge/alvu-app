<script lang="ts">
	import LoadingSpinner from './LoadingSpinner.svelte'
	
	// Props
	export let title: string = 'Loading...'
	export let subtitle: string = ''
	export let variant: 'spinner' | 'dots' | 'pulse' | 'bars' = 'spinner'
	export let showLogo: boolean = true
</script>

<div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
	<div class="text-center">
		<!-- Logo section -->
		{#if showLogo}
			<div class="mb-8">
				<h1 class="text-4xl font-bold text-blue-600 mb-2">Alvu</h1>
				<p class="text-gray-600">Budget Management</p>
			</div>
		{/if}
		
		<!-- Loading spinner -->
		<div class="mb-6">
			<LoadingSpinner 
				size="xl" 
				color="primary" 
				{variant}
				centered={true}
			/>
		</div>
		
		<!-- Loading text -->
		<div class="space-y-2">
			<h2 class="text-xl font-semibold text-gray-900">{title}</h2>
			{#if subtitle}
				<p class="text-gray-600">{subtitle}</p>
			{/if}
		</div>
		
		<!-- Progress indicator dots -->
		<div class="mt-8 flex justify-center space-x-2">
			<div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
			<div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
			<div class="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
		</div>
	</div>
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}
	
	.animate-pulse {
		animation: pulse 1.5s ease-in-out infinite;
	}
</style>