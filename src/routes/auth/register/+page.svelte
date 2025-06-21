<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { authStore, user, loading, error, isAuthenticated } from '$lib/stores/auth'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'

	// Form state
	let email = ''
	let password = ''
	let confirmPassword = ''
	let firstName = ''
	let lastName = ''
	let isSubmitting = false
	let showPassword = false
	let showConfirmPassword = false
	let formErrors = {
		email: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: '',
		general: ''
	}


	// Clear general error when form changes
	$: if (email || password || confirmPassword || firstName || lastName) {
		formErrors.general = ''
		formErrors.email = ''
		formErrors.password = ''
		formErrors.confirmPassword = ''
		formErrors.firstName = ''
		formErrors.lastName = ''
	}

	// Validate email format
	function validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	// Validate password strength
	function validatePassword(password: string): { isValid: boolean; message: string } {
		if (password.length < 8) {
			return { isValid: false, message: 'Password must be at least 8 characters long' }
		}
		if (!/[A-Z]/.test(password)) {
			return { isValid: false, message: 'Password must contain at least one uppercase letter' }
		}
		if (!/[a-z]/.test(password)) {
			return { isValid: false, message: 'Password must contain at least one lowercase letter' }
		}
		if (!/[0-9]/.test(password)) {
			return { isValid: false, message: 'Password must contain at least one number' }
		}
		return { isValid: true, message: '' }
	}

	// Validate name format (supports international characters)
	function validateName(name: string): boolean {
		return name.trim().length >= 2 && /^[\p{L}\s'-]+$/u.test(name.trim())
	}

	// Handle form submission
	async function handleSubmit() {
		// Reset errors
		formErrors = { 
			email: '', 
			password: '', 
			confirmPassword: '', 
			firstName: '', 
			lastName: '', 
			general: '' 
		}

		// Validate form
		let hasErrors = false

		// First name validation
		if (!firstName.trim()) {
			formErrors.firstName = 'First name is required'
			hasErrors = true
		} else if (!validateName(firstName)) {
			formErrors.firstName = 'First name must be at least 2 characters and contain only letters, spaces, hyphens, and apostrophes'
			hasErrors = true
		}

		// Last name validation
		if (!lastName.trim()) {
			formErrors.lastName = 'Last name is required'
			hasErrors = true
		} else if (!validateName(lastName)) {
			formErrors.lastName = 'Last name must be at least 2 characters and contain only letters, spaces, hyphens, and apostrophes'
			hasErrors = true
		}

		// Email validation
		if (!email.trim()) {
			formErrors.email = 'Email is required'
			hasErrors = true
		} else if (!validateEmail(email)) {
			formErrors.email = 'Please enter a valid email address'
			hasErrors = true
		}

		// Password validation
		if (!password) {
			formErrors.password = 'Password is required'
			hasErrors = true
		} else {
			const passwordValidation = validatePassword(password)
			if (!passwordValidation.isValid) {
				formErrors.password = passwordValidation.message
				hasErrors = true
			}
		}

		// Confirm password validation
		if (!confirmPassword) {
			formErrors.confirmPassword = 'Please confirm your password'
			hasErrors = true
		} else if (password !== confirmPassword) {
			formErrors.confirmPassword = 'Passwords do not match'
			hasErrors = true
		}

		if (hasErrors) return

		// Attempt registration
		isSubmitting = true
		
		try {
			const result = await authStore.signUp(email.trim(), password, {
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				display_name: `${firstName.trim()} ${lastName.trim()}`
			})
			
			if (result.success) {
				// Success - store email for confirmation page and redirect
				console.log('Registration successful')
				localStorage.setItem('pendingConfirmationEmail', email.trim())
				goto('/auth/confirm-email')
			} else {
				formErrors.general = result.error || 'Registration failed. Please try again.'
			}
		} catch (err) {
			console.error('Registration error:', err)
			
			// Provide more specific error messages
			if (err instanceof Error) {
				if (err.message.includes('credentials')) {
					formErrors.general = 'Configuration error: Please check your Supabase settings.'
				} else if (err.message.includes('fetch')) {
					formErrors.general = 'Network error: Please check your internet connection and try again.'
				} else {
					formErrors.general = `Error: ${err.message}`
				}
			} else {
				formErrors.general = 'An unexpected error occurred. Please try again.'
			}
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
	<title>Sign Up - Alvu</title>
	<meta name="description" content="Create your Alvu budget management account" />
</svelte:head>

<ProtectedRoute requireAuth={false}>
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
			<p class="text-gray-600">Start managing your budget with Alvu</p>
		</div>

		<!-- Registration Form -->
		<form on:submit|preventDefault={handleSubmit} class="mt-8 space-y-6">
			<div class="bg-white p-8 rounded-lg shadow-md space-y-6">
				<!-- Name Fields -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<!-- First Name -->
					<div>
						<label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
							First name
						</label>
						<input
							id="firstName"
							name="firstName"
							type="text"
							autocomplete="given-name"
							bind:value={firstName}
							on:keydown={handleKeydown}
							disabled={isSubmitting || $loading}
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							class:border-red-500={formErrors.firstName}
							class:focus:ring-red-500={formErrors.firstName}
							class:focus:border-red-500={formErrors.firstName}
							placeholder="First name"
						/>
						{#if formErrors.firstName}
							<p class="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
						{/if}
					</div>

					<!-- Last Name -->
					<div>
						<label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
							Last name
						</label>
						<input
							id="lastName"
							name="lastName"
							type="text"
							autocomplete="family-name"
							bind:value={lastName}
							on:keydown={handleKeydown}
							disabled={isSubmitting || $loading}
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							class:border-red-500={formErrors.lastName}
							class:focus:ring-red-500={formErrors.lastName}
							class:focus:border-red-500={formErrors.lastName}
							placeholder="Last name"
						/>
						{#if formErrors.lastName}
							<p class="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
						{/if}
					</div>
				</div>

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
							autocomplete="new-password"
							bind:value={password}
							on:keydown={handleKeydown}
							disabled={isSubmitting || $loading}
							class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							class:border-red-500={formErrors.password}
							class:focus:ring-red-500={formErrors.password}
							class:focus:border-red-500={formErrors.password}
							placeholder="Create a password"
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
					{:else}
						<p class="mt-1 text-sm text-gray-500">
							Password must be at least 8 characters with uppercase, lowercase, and number
						</p>
					{/if}
				</div>

				<!-- Confirm Password Field -->
				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
						Confirm password
					</label>
					<div class="relative">
						<input
							id="confirmPassword"
							name="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							autocomplete="new-password"
							bind:value={confirmPassword}
							on:keydown={handleKeydown}
							disabled={isSubmitting || $loading}
							class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							class:border-red-500={formErrors.confirmPassword}
							class:focus:ring-red-500={formErrors.confirmPassword}
							class:focus:border-red-500={formErrors.confirmPassword}
							placeholder="Confirm your password"
						/>
						<button
							type="button"
							on:click={() => showConfirmPassword = !showConfirmPassword}
							disabled={isSubmitting || $loading}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
						>
							{#if showConfirmPassword}
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
					{#if formErrors.confirmPassword}
						<p class="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
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
						Creating account...
					{:else}
						Create account
					{/if}
				</button>
			</div>
		</form>

		<!-- Footer Links -->
		<div class="text-center">
			<div class="text-sm text-gray-600">
				Already have an account?
				<a 
					href="/auth/login" 
					class="text-blue-600 hover:text-blue-500 hover:underline font-medium"
				>
					Sign in
				</a>
			</div>
		</div>
	</div>
</div>
</ProtectedRoute>