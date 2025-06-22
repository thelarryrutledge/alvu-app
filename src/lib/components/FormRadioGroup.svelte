<script context="module" lang="ts">
	// Radio option type
	export interface RadioOption {
		value: string | number;
		label: string;
		description?: string;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		change: string | number;
		focus: FocusEvent;
		blur: FocusEvent;
	}>();
	
	// Props
	export let name: string = '';
	export let value: string | number = '';
	export let options: RadioOption[] = [];
	export let label: string = '';
	export let hint: string = '';
	export let error: string = '';
	export let required: boolean = false;
	export let disabled: boolean = false;
	export let orientation: 'vertical' | 'horizontal' = 'vertical';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	
	// Generate unique name if not provided
	const radioName = name || `radio-${Math.random().toString(36).substr(2, 9)}`;
	
	// Size classes
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6'
	};
	
	// Handle radio events
	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		dispatch('change', target.value);
	}
	
	function handleFocus(event: FocusEvent) {
		dispatch('focus', event);
	}
	
	function handleBlur(event: FocusEvent) {
		dispatch('blur', event);
	}
	
	// Computed classes
	$: radioClasses = [
		sizeClasses[size],
		'text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2',
		error ? 'border-red-300 focus:ring-red-500' : '',
		disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'cursor-pointer'
	].filter(Boolean).join(' ');
	
	$: labelClasses = [
		'font-medium text-gray-900',
		size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base',
		disabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'
	].filter(Boolean).join(' ');
	
	$: containerClasses = orientation === 'horizontal' 
		? 'flex flex-wrap gap-6' 
		: 'space-y-4';
</script>

<fieldset class="space-y-3">
	<!-- Legend/Label -->
	{#if label}
		<legend class="text-sm font-medium text-gray-700">
			{label}
			{#if required}
				<span class="text-red-500 ml-1">*</span>
			{/if}
		</legend>
	{/if}
	
	<!-- Hint text -->
	{#if hint && !error}
		<p class="text-sm text-gray-500">{hint}</p>
	{/if}
	
	<!-- Radio options -->
	<div class={containerClasses}>
		{#each options as option, index}
			{@const optionId = `${radioName}-${index}`}
			<div class="flex items-start">
				<div class="flex items-center h-5">
					<input
						{...$$restProps}
						id={optionId}
						name={radioName}
						value={option.value}
						checked={value === option.value}
						required={required}
						disabled={disabled || option.disabled}
						type="radio"
						class={radioClasses}
						on:change={handleChange}
						on:focus={handleFocus}
						on:blur={handleBlur}
					/>
				</div>
				
				<div class="ml-3 text-sm">
					<label for={optionId} class={labelClasses}>
						{option.label}
					</label>
					
					{#if option.description}
						<p class="text-gray-500 {size === 'sm' ? 'text-xs' : 'text-sm'}">{option.description}</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
	
	<!-- Error message -->
	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</fieldset>