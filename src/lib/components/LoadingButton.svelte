<script lang="ts">
	import LoadingSpinner from './LoadingSpinner.svelte'
	
	// Props
	export let loading: boolean = false
	export let disabled: boolean = false
	export let variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary'
	export let size: 'sm' | 'md' | 'lg' = 'md'
	export let type: 'button' | 'submit' | 'reset' = 'button'
	export let fullWidth: boolean = false
	export let loadingText: string = ''
	
	// Button variant classes
	const variantClasses = {
		primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
		secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent',
		outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border-blue-600',
		ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent'
	}
	
	// Button size classes
	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	}
	
	// Spinner size mapping
	const spinnerSizes = {
		sm: 'sm' as const,
		md: 'sm' as const,
		lg: 'md' as const
	}
	
	// Get classes for current props
	$: variantClass = variantClasses[variant]
	$: sizeClass = sizeClasses[size]
	$: spinnerSize = spinnerSizes[size]
	$: isDisabled = disabled || loading
</script>

<button
	{type}
	disabled={isDisabled}
	class="inline-flex items-center justify-center font-medium rounded-md border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed {variantClass} {sizeClass} {fullWidth ? 'w-full' : ''}"
	on:click
>
	{#if loading}
		<LoadingSpinner 
			size={spinnerSize} 
			color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'white'} 
			variant="spinner" 
		/>
		<span class="ml-2">
			{loadingText || 'Loading...'}
		</span>
	{:else}
		<slot />
	{/if}
</button>