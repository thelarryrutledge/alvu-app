<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { authStore, user, loading, error, isAuthenticated } from '$lib/stores/auth'
	import { supabase } from '$lib/utils/supabase'

	// Form state
	let password = ''
	let confirmPassword = ''
	let isSubmitting = false
	let showPassword = false
	let showConfirmPassword = false
	let isSuccess = false
	let accessToken = ''
	let refreshToken = ''
	let formErrors = {
		password: '',
		confirmPassword: '',
		general: ''
	}

	// Redirect if already authenticated
	$: if ($isAuthenticated && !isSuccess) {
		goto('/dashboard')
	}

	// Clear general error when form changes
	$: if (password || confirmPassword) {
		formErrors.general = ''
		formErrors.password = ''
		formErrors.confirmPassword = ''
	}

	// Extract tokens from URL on mount
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.hash.substring(1))
		accessToken = urlParams.get('access_token') || ''
		refreshToken = urlParams.get('refresh_token') || ''

		// If no tokens, redirect to forgot password page
		if (!accessToken || !refreshToken) {
			console.error('Missing reset tokens')
			goto('/auth/forgot-password')
		}
	})

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

	// Handle form submission
	async function handleSubmit() {
		// Reset errors
		formErrors = { password: '', confirmPassword: '', general: '' }

		// Validate form
		let hasErrors = false

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

		// Attempt password update
		isSubmitting = true
		
		try {
			// Set the session with the tokens from the URL
			const { error: sessionError } = await supabase.auth.setSession({
				access_token: accessToken,
				refresh_token: refreshToken
			})

			if (sessionError) {
				formErrors.general = 'Invalid or expired reset link. Please request a new one.'
				return
			}

			// Update the password
			const result = await authStore.updateUser({ password })
			
			if (result.success) {
				// Success - show confirmation
				isSuccess = true
				console.log('Password reset successful')
				
				// Auto-redirect to login after a few seconds
				setTimeout(() => {
					goto('/auth/login')
				}, 3000)
			} else {
				formErrors.general = result.error || 'Failed to reset password. Please try again.'
			}
		} catch (err) {
			formErrors.general = 'An unexpected error occurred. Please try again.'
			console.error('Password reset error:', err)
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
	<title>Reset Password - Alvu</title>
	<meta name="description" content="Create a new password for your Alvu account" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		{#if !isSuccess}
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Create new password</h1>
				<p class="text-gray-600">Enter your new password below</p>
			</div>

			<!-- Reset Form -->
			<form on:submit|preventDefault={handleSubmit} class="mt-8 space-y-6">
				<div class="bg-white p-8 rounded-lg shadow-md space-y-6">
					<!-- Password Field -->
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
							New password
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
								placeholder="Create a new password"
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
							Confirm new password
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
								placeholder="Confirm your new password"
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
							Updating password...
						{:else}
							Update password
						{/if}
					</button>
				</div>
			</form>
		{:else}
			<!-- Success State -->
			<div class="text-center">
				<div class="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
					<!-- Check icon -->
					<svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Password updated!</h1>
				<p class="text-gray-600 mb-6">Your password has been successfully updated</p>
			</div>

			<!-- Success Content -->
			<div class="bg-white p-8 rounded-lg shadow-md space-y-6">
				<div class="bg-green-50 border border-green-200 rounded-md p-4">
					<p class="text-sm text-green-700">
						You can now sign in with your new password. You'll be redirected to the sign in page automatically.
					</p>
				</div>

				<!-- Action button -->
				<a
					href="/auth/login"
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
				>
					Go to Sign In
				</a>
			</div>
		{/if}

		<!-- Footer Links (only show when not in success state) -->
		{#if !isSuccess}
			<div class="text-center">
				<div class="text-sm text-gray-600">
					Remember your password?
					<a 
						href="/auth/login" 
						class="text-blue-600 hover:text-blue-500 hover:underline font-medium"
					>
						Sign in
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>