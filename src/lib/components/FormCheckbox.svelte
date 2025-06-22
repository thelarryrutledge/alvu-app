<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		change: boolean;
		focus: FocusEvent;
		blur: FocusEvent;
	}>();
	
	// Props
	export let id: string = '';
	export let name: string = '';
	export let checked: boolean = false;
	export let value: string = '';
	export let label: string = '';
	export let description: string = '';
	export let error: string = '';
	export let required: boolean = false;
	export let disabled: boolean = false;
	export let indeterminate: boolean = false;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	
	// Generate unique ID if not provided
	const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
	
	// Size classes
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6'
	};
	
	// Handle checkbox events
	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		checked = target.checked;
		dispatch('change', target.checked);
	}
	
	function handleFocus(event: FocusEvent) {
		dispatch('focus', event);
	}
	
	function handleBlur(event: FocusEvent) {
		dispatch('blur', event);
	}
	
	// Computed classes
	$: checkboxClasses = [
		sizeClasses[size],
		'text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 focus:ring-offset-2',
		error ? 'border-red-300 focus:ring-red-500' : '',
		disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'cursor-pointer'
	].filter(Boolean).join(' ');
	
	$: labelClasses = [
		'font-medium text-gray-900',
		size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base',
		disabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'
	].filter(Boolean).join(' ');
</script>

<div class="space-y-1">
	<div class="flex items-start">
		<div class="flex items-center h-5">
			<input
				{...$$restProps}
				id={checkboxId}
				{name}
				{value}
				{checked}
				{required}
				{disabled}
				{indeterminate}
				type="checkbox"
				class={checkboxClasses}
				on:change={handleChange}
				on:focus={handleFocus}
				on:blur={handleBlur}
			/>
		</div>
		
		{#if label || description}
			<div class="ml-3 text-sm">
				{#if label}
					<label for={checkboxId} class={labelClasses}>
						{label}
						{#if required}
							<span class="text-red-500 ml-1">*</span>
						{/if}
					</label>
				{/if}
				
				{#if description}
					<p class="text-gray-500 {size === 'sm' ? 'text-xs' : 'text-sm'}">{description}</p>
				{/if}
			</div>
		{/if}
	</div>
	
	<!-- Error message -->
	{#if error}
		<p class="text-sm text-red-600 ml-8">{error}</p>
	{/if}
</div>