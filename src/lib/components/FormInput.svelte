<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		input: string;
		change: string;
		focus: FocusEvent;
		blur: FocusEvent;
	}>();
	
	// Props
	export let id: string = '';
	export let name: string = '';
	export let type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'datetime-local' | 'time' = 'text';
	export let value: string | number = '';
	export let placeholder: string = '';
	export let label: string = '';
	export let hint: string = '';
	export let error: string = '';
	export let required: boolean = false;
	export let disabled: boolean = false;
	export let readonly: boolean = false;
	export let min: number | string = '';
	export let max: number | string = '';
	export let step: number | string = '';
	export let maxlength: number | undefined = undefined;
	export let pattern: string = '';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let variant: 'default' | 'filled' | 'outlined' = 'default';
	
	// Generate unique ID if not provided
	const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
	
	// Size classes
	const sizeClasses = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-4 py-2.5 text-base',
		lg: 'px-4 py-3 text-lg'
	};
	
	// Variant classes
	const variantClasses = {
		default: 'border border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
		filled: 'border-0 bg-gray-100 focus:bg-white focus:ring-blue-500',
		outlined: 'border-2 border-gray-300 bg-transparent focus:border-blue-500 focus:ring-0'
	};
	
	// Handle input events
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = type === 'number' ? target.valueAsNumber || 0 : target.value;
		dispatch('input', target.value);
	}
	
	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		dispatch('change', target.value);
	}
	
	function handleFocus(event: FocusEvent) {
		dispatch('focus', event);
	}
	
	function handleBlur(event: FocusEvent) {
		dispatch('blur', event);
	}
	
	// Computed classes
	$: inputClasses = [
		'w-full rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
		sizeClasses[size],
		variantClasses[variant],
		error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '',
		disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : '',
		readonly ? 'bg-gray-50' : ''
	].filter(Boolean).join(' ');
</script>

<div class="space-y-1">
	<!-- Label -->
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-gray-700">
			{label}
			{#if required}
				<span class="text-red-500 ml-1">*</span>
			{/if}
		</label>
	{/if}
	
	<!-- Input -->
	<div class="relative">
		<input
			{...$$restProps}
			id={inputId}
			{name}
			{type}
			{value}
			{placeholder}
			{required}
			{disabled}
			{readonly}
			{min}
			{max}
			{step}
			{maxlength}
			{pattern}
			class={inputClasses}
			on:input={handleInput}
			on:change={handleChange}
			on:focus={handleFocus}
			on:blur={handleBlur}
		/>
		
		<!-- Error icon -->
		{#if error}
			<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
				<svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
				</svg>
			</div>
		{/if}
	</div>
	
	<!-- Hint text -->
	{#if hint && !error}
		<p class="text-sm text-gray-500">{hint}</p>
	{/if}
	
	<!-- Error message -->
	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>