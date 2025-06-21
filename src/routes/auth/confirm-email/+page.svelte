<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { authStore, isAuthenticated } from '$lib/stores/auth'

	let email = ''
	let isResending = false
	let resendMessage = ''
	let resendError = ''

	// Get email from URL params or localStorage
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search)
		const emailParam = urlParams.get('email')
		
		if (emailParam) {
			email = emailParam
		} else {
			// Try to get from localStorage (set during registration)
			const storedEmail = localStorage.getItem('pendingConfirmationEmail')
			if (storedEmail) {
				email = storedEmail
				localStorage.removeItem('pendingConfirmationEmail')
			}
		}
	})

	// Redirect if already authenticated
	$: if ($isAuthenticated) {
		goto('/dashboard')
	}

	// Resend confirmation email
	async function resendConfirmation() {
		if (!email) {
			resendError = 'Email address not found. Please try registering again.'
			return
		}

		isResending = true
		resendError = ''
		resendMessage = ''

		try {
			const { error } = await authStore.resetPassword(email, `${window.location.origin}/auth/login`)
			
			if (error) {
				resendError = 'Failed to resend confirmation email. Please try again.'
			} else {
				resendMessage = 'Confirmation email sent! Please check your inbox.'
			}
		} catch (err) {
			resendError = 'An unexpected error occurred. Please try again.'
			console.error('Resend confirmation error:', err)
		} finally {
			isResending = false
		}
	}
</script>

<svelte:head>
	<title>Confirm Email - Alvu</title>
	<meta name="description" content="Confirm your email address to complete registration" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<!-- Header -->
		<div class="text-center">
			<div class="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
				<!-- Mail icon -->
				<svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Check your email</h1>
			<p class="text-gray-600">We've sent a confirmation link to your email address</p>
		</div>

		<!-- Content -->
		<div class="bg-white p-8 rounded-lg shadow-md space-y-6">
			{#if email}
				<div class="text-center">
					<p class="text-sm text-gray-600 mb-4">
						We sent a confirmation email to:
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
						<li>Click the confirmation link in the email</li>
						<li>Return to sign in to your account</li>
					</ol>
				</div>

				<!-- Resend confirmation -->
				<div class="text-center space-y-4">
					{#if resendMessage}
						<div class="bg-green-50 border border-green-200 rounded-md p-3">
							<p class="text-sm text-green-600">{resendMessage}</p>
						</div>
					{/if}

					{#if resendError}
						<div class="bg-red-50 border border-red-200 rounded-md p-3">
							<p class="text-sm text-red-600">{resendError}</p>
						</div>
					{/if}

					<div>
						<p class="text-sm text-gray-600 mb-2">Didn't receive the email?</p>
						<button
							on:click={resendConfirmation}
							disabled={isResending || !email}
							class="text-sm text-blue-600 hover:text-blue-500 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
						>
							{#if isResending}
								Sending...
							{:else}
								Resend confirmation email
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Action buttons -->
			<div class="space-y-3">
				<a
					href="/auth/login"
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
				>
					Go to Sign In
				</a>
				
				<a
					href="/auth/register"
					class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
				>
					Back to Registration
				</a>
			</div>
		</div>

		<!-- Help text -->
		<div class="text-center">
			<p class="text-xs text-gray-500">
				Having trouble? The confirmation link will expire in 24 hours.
			</p>
		</div>
	</div>
</div>