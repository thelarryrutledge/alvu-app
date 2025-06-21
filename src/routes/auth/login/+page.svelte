<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { authStore, user, loading, error, isAuthenticated } from '$lib/stores/auth'

	// Form state
	let email = ''
	let password = ''
	let isSubmitting = false
	let showPassword = false
	let formErrors = {
		email: '',
		password: '',
		general: ''
	}

	// Redirect if already authenticated
	$: if ($isAuthenticated) {
		goto('/dashboard')
	}

	// Clear general error when form changes
	$: if (email || password) {
		formErrors.general = ''
		formErrors.email = ''
		formErrors.password = ''
	}

	// Validate email format
	function validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	// Handle form submission
	async function handleSubmit() {
		// Reset errors
		formErrors = { email: '', password: '', general: '' }

		// Validate form
		let hasErrors = false

		if (!email.trim()) {
			formErrors.email = 'Email is required'
			hasErrors = true
		} else if (!validateEmail(email)) {
			formErrors.email = 'Please enter a valid email address'
			hasErrors = true
		}

		if (!password) {
			formErrors.password = 'Password is required'
			hasErrors = true
		} else if (password.length < 6) {
			formErrors.password = 'Password must be at least 6 characters'
			hasErrors = true
		}

		if (hasErrors) return

		// Attempt sign in
		isSubmitting = true
		
		try {
			const result = await authStore.signIn(email.trim(), password)
			
			if (result.success) {
				// Success - redirect will happen automatically via store subscription
				console.log('Login successful')
			} else {
				formErrors.general = result.error || 'Login failed. Please try again.'
			}
		} catch (err) {
			formErrors.general = 'An unexpected error occurred. Please try again.'
			console.error('Login error:', err)
		} finally {
			isSubmitting = false
		}
	}

	// Handle Enter key submission
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSubmit()
		}
	}
</script>

<svelte:head>
	<title>Login - Alvu</title>
	<meta name="description" content="Sign in to your Alvu budget management account" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
			<p class="text-gray-600">Sign in to your Alvu account</p>
		</div>

		<!-- Login Form -->
		<form on:submit|preventDefault={handleSubmit} class="mt-8 space-y-6">
			<div class="bg-white p-8 rounded-lg shadow-md space-y-6">
				<!-- Email Field -->
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						Email address
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						bind:value={email}
						on:keydown={handleKeydown}
						disabled={isSubmitting || $loading}
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						class:border-red-500={formErrors.email}
						class:focus:ring-red-500={formErrors.email}
						class:focus:border-red-500={formErrors.email}
						placeholder="Enter your email"
					/>
					{#if formErrors.email}
						<p class="mt-1 text-sm text-red-600">{formErrors.email}</p>
					{/if}
				</div>

				<!-- Password Field -->
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<div class="relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							bind:value={password}
							on:keydown={handleKeydown}
							disabled={isSubmitting || $loading}
							class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							class:border-red-500={formErrors.password}
							class:focus:ring-red-500={formErrors.password}
							class:focus:border-red-500={formErrors.password}
							placeholder="Enter your password"
						/>
						<button
							type="button"
							on:click={() => showPassword = !showPassword}
							disabled={isSubmitting || $loading}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
						>
							{#if showPassword}
								<!-- Eye slash icon -->
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
								</svg>
							{:else}
								<!-- Eye icon -->
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{/if}
						</button>
					</div>
					{#if formErrors.password}
						<p class="mt-1 text-sm text-red-600">{formErrors.password}</p>
					{/if}
				</div>

				<!-- General Error -->
				{#if formErrors.general || $error}
					<div class="bg-red-50 border border-red-200 rounded-md p-3">
						<p class="text-sm text-red-600">{formErrors.general || $error}</p>
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting || $loading}
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
				>
					{#if isSubmitting || $loading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Signing in...
					{:else}
						Sign in
					{/if}
				</button>
			</div>
		</form>

		<!-- Footer Links -->
		<div class="text-center space-y-4">
			<div>
				<a 
					href="/auth/forgot-password" 
					class="text-sm text-blue-600 hover:text-blue-500 hover:underline"
				>
					Forgot your password?
				</a>
			</div>
			<div class="text-sm text-gray-600">
				Don't have an account?
				<a 
					href="/auth/register" 
					class="text-blue-600 hover:text-blue-500 hover:underline font-medium"
				>
					Sign up
				</a>
			</div>
		</div>
	</div>
</div>