<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { authStore, user, loading, error, isAuthenticated } from '$lib/stores/auth'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'

	// Form state
	let email = ''
	let isSubmitting = false
	let isSuccess = false
	let formErrors = {
		email: '',
		general: ''
	}


	// Clear general error when form changes
	$: if (email) {
		formErrors.general = ''
		formErrors.email = ''
	}

	// Validate email format
	function validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	// Handle form submission
	async function handleSubmit() {
		// Reset errors
		formErrors = { email: '', general: '' }

		// Validate form
		let hasErrors = false

		if (!email.trim()) {
			formErrors.email = 'Email is required'
			hasErrors = true
		} else if (!validateEmail(email)) {
			formErrors.email = 'Please enter a valid email address'
			hasErrors = true
		}

		if (hasErrors) return

		// Attempt password reset
		isSubmitting = true
		
		try {
			const redirectTo = `${window.location.origin}/auth/reset-password`
			const result = await authStore.resetPassword(email.trim(), redirectTo)
			
			if (result.success) {
				// Success - show confirmation
				isSuccess = true
				console.log('Password reset email sent')
			} else {
				// Note: Supabase doesn't reveal if email exists for security
				// We'll show success message regardless to prevent email enumeration
				isSuccess = true
				console.log('Password reset requested for:', email.trim())
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

	// Reset form to send another email
	function resetForm() {
		isSuccess = false
		email = ''
		formErrors = { email: '', general: '' }
	}
</script>

<svelte:head>
	<title>Reset Password - Alvu</title>
	<meta name="description" content="Reset your Alvu account password" />
</svelte:head>

<ProtectedRoute requireAuth={false}>
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		{#if !isSuccess}
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Reset your password</h1>
				<p class="text-gray-600">Enter your email address and we'll send you a reset link</p>
			</div>

			<!-- Reset Form -->
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
							placeholder="Enter your email address"
						/>
						{#if formErrors.email}
							<p class="mt-1 text-sm text-red-600">{formErrors.email}</p>
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
							Sending reset link...
						{:else}
							Send reset link
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
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Check your email</h1>
				<p class="text-gray-600 mb-6">We've sent a password reset link to your email address</p>
			</div>

			<!-- Success Content -->
			<div class="bg-white p-8 rounded-lg shadow-md space-y-6">
				{#if email}
					<div class="text-center">
						<p class="text-sm text-gray-600 mb-4">
							We sent a password reset link to:
						</p>
						<p class="text-lg font-medium text-gray-900 bg-gray-50 px-4 py-2 rounded-md">
							{email}
						</p>
					</div>
				{/if}

				<div class="space-y-4">
					<div class="bg-blue-50 border border-blue-200 rounded-md p-4">
						<h3 class="text-sm font-medium text-blue-800 mb-2">Next steps:</h3>
						<ol class="text-sm text-blue-700 space-y-1 list-decimal list-inside">
							<li>Check your email inbox (and spam folder)</li>
							<li>Click the password reset link in the email</li>
							<li>Create a new password</li>
							<li>Sign in with your new password</li>
						</ol>
					</div>

					<!-- Action buttons -->
					<div class="space-y-3">
						<a
							href="/auth/login"
							class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Back to Sign In
						</a>
						
						<button
							on:click={resetForm}
							class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Send to different email
						</button>
					</div>
				</div>
			</div>

			<!-- Help text -->
			<div class="text-center">
				<p class="text-xs text-gray-500">
					Didn't receive the email? Check your spam folder or try again.
				</p>
			</div>
		{/if}

		<!-- Footer Links (only show when not in success state) -->
		{#if !isSuccess}
			<div class="text-center space-y-4">
				<div class="text-sm text-gray-600">
					Remember your password?
					<a 
						href="/auth/login" 
						class="text-blue-600 hover:text-blue-500 hover:underline font-medium"
					>
						Sign in
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
		{/if}
	</div>
</div>
</ProtectedRoute>