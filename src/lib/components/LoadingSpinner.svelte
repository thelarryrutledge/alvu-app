<script lang="ts">
	// Props
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md'
	export let color: 'primary' | 'secondary' | 'white' | 'gray' = 'primary'
	export let variant: 'spinner' | 'dots' | 'pulse' | 'bars' = 'spinner'
	export let text: string = ''
	export let centered: boolean = false
	export let overlay: boolean = false
	
	// Size classes
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6', 
		lg: 'w-8 h-8',
		xl: 'w-12 h-12'
	}
	
	// Color classes
	const colorClasses = {
		primary: 'text-blue-600',
		secondary: 'text-gray-600',
		white: 'text-white',
		gray: 'text-gray-400'
	}
	
	// Text size classes
	const textSizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base',
		xl: 'text-lg'
	}
	
	// Get classes for current props
	$: sizeClass = sizeClasses[size]
	$: colorClass = colorClasses[color]
	$: textSizeClass = textSizeClasses[size]
</script>

{#if overlay}
	<!-- Overlay wrapper -->
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 shadow-xl">
			<div class="flex flex-col items-center space-y-4">
				<!-- Spinner content for overlay -->
				<div class="flex {text ? 'flex-col' : ''} items-center {text ? 'space-y-2' : ''}">
					<!-- Spinner Variant -->
					{#if variant === 'spinner'}
						<svg class="animate-spin {sizeClass} {colorClass}" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					{/if}
					
					<!-- Dots Variant -->
					{#if variant === 'dots'}
						<div class="flex space-x-1">
							<div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
							<div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
							<div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
						</div>
					{/if}
					
					<!-- Pulse Variant -->
					{#if variant === 'pulse'}
						<div class="{sizeClass} bg-blue-600 rounded-full animate-pulse"></div>
					{/if}
					
					<!-- Bars Variant -->
					{#if variant === 'bars'}
						<div class="flex items-end space-x-1">
							<div class="w-1 h-4 bg-blue-600 animate-pulse" style="animation-delay: 0ms"></div>
							<div class="w-1 h-6 bg-blue-600 animate-pulse" style="animation-delay: 150ms"></div>
							<div class="w-1 h-4 bg-blue-600 animate-pulse" style="animation-delay: 300ms"></div>
							<div class="w-1 h-6 bg-blue-600 animate-pulse" style="animation-delay: 450ms"></div>
							<div class="w-1 h-4 bg-blue-600 animate-pulse" style="animation-delay: 600ms"></div>
						</div>
					{/if}
					
					<!-- Loading text -->
					{#if text}
						<p class="{textSizeClass} {colorClass} font-medium">{text}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Regular spinner without overlay -->
	<div class="loading-spinner {centered ? 'flex items-center justify-center' : ''}">
		<div class="flex {text ? 'flex-col' : ''} items-center {text ? 'space-y-2' : ''}">
			<!-- Spinner Variant -->
			{#if variant === 'spinner'}
				<svg class="animate-spin {sizeClass} {colorClass}" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{/if}
			
			<!-- Dots Variant -->
			{#if variant === 'dots'}
				<div class="flex space-x-1">
					{#if color === 'primary'}
						<div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
						<div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
						<div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
					{:else if color === 'secondary'}
						<div class="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
						<div class="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
						<div class="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
					{:else if color === 'white'}
						<div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0ms"></div>
						<div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 150ms"></div>
						<div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 300ms"></div>
					{:else}
						<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
						<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
						<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
					{/if}
				</div>
			{/if}
			
			<!-- Pulse Variant -->
			{#if variant === 'pulse'}
				{#if color === 'primary'}
					<div class="{sizeClass} bg-blue-600 rounded-full animate-pulse"></div>
				{:else if color === 'secondary'}
					<div class="{sizeClass} bg-gray-600 rounded-full animate-pulse"></div>
				{:else if color === 'white'}
					<div class="{sizeClass} bg-white rounded-full animate-pulse"></div>
				{:else}
					<div class="{sizeClass} bg-gray-400 rounded-full animate-pulse"></div>
				{/if}
			{/if}
			
			<!-- Bars Variant -->
			{#if variant === 'bars'}
				<div class="flex items-end space-x-1">
					{#if color === 'primary'}
						<div class="w-1 h-4 bg-blue-600 animate-pulse" style="animation-delay: 0ms"></div>
						<div class="w-1 h-6 bg-blue-600 animate-pulse" style="animation-delay: 150ms"></div>
						<div class="w-1 h-4 bg-blue-600 animate-pulse" style="animation-delay: 300ms"></div>
						<div class="w-1 h-6 bg-blue-600 animate-pulse" style="animation-delay: 450ms"></div>
						<div class="w-1 h-4 bg-blue-600 animate-pulse" style="animation-delay: 600ms"></div>
					{:else if color === 'secondary'}
						<div class="w-1 h-4 bg-gray-600 animate-pulse" style="animation-delay: 0ms"></div>
						<div class="w-1 h-6 bg-gray-600 animate-pulse" style="animation-delay: 150ms"></div>
						<div class="w-1 h-4 bg-gray-600 animate-pulse" style="animation-delay: 300ms"></div>
						<div class="w-1 h-6 bg-gray-600 animate-pulse" style="animation-delay: 450ms"></div>
						<div class="w-1 h-4 bg-gray-600 animate-pulse" style="animation-delay: 600ms"></div>
					{:else if color === 'white'}
						<div class="w-1 h-4 bg-white animate-pulse" style="animation-delay: 0ms"></div>
						<div class="w-1 h-6 bg-white animate-pulse" style="animation-delay: 150ms"></div>
						<div class="w-1 h-4 bg-white animate-pulse" style="animation-delay: 300ms"></div>
						<div class="w-1 h-6 bg-white animate-pulse" style="animation-delay: 450ms"></div>
						<div class="w-1 h-4 bg-white animate-pulse" style="animation-delay: 600ms"></div>
					{:else}
						<div class="w-1 h-4 bg-gray-400 animate-pulse" style="animation-delay: 0ms"></div>
						<div class="w-1 h-6 bg-gray-400 animate-pulse" style="animation-delay: 150ms"></div>
						<div class="w-1 h-4 bg-gray-400 animate-pulse" style="animation-delay: 300ms"></div>
						<div class="w-1 h-6 bg-gray-400 animate-pulse" style="animation-delay: 450ms"></div>
						<div class="w-1 h-4 bg-gray-400 animate-pulse" style="animation-delay: 600ms"></div>
					{/if}
				</div>
			{/if}
			
			<!-- Loading text -->
			{#if text}
				<p class="{textSizeClass} {colorClass} font-medium">{text}</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Custom animations for better performance */
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
	
	/* Apply custom animations */
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	.animate-bounce {
		animation: bounce 1.4s ease-in-out infinite;
	}
	
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>