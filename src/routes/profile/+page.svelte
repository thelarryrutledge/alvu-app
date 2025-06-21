<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { authStore, user, loading, error } from '$lib/stores/auth'
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte'
	import AppLayout from '$lib/components/AppLayout.svelte'

	// Form state
	let firstName = ''
	let lastName = ''
	let email = ''
	let currentPassword = ''
	let newPassword = ''
	let confirmPassword = ''
	let isSubmitting = false
	let showCurrentPassword = false
	let showNewPassword = false
	let showConfirmPassword = false
	let successMessage = ''
	let formErrors = {
		firstName: '',
		lastName: '',
		email: '',
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
		general: ''
	}

	// Load user data on mount
	onMount(() => {
		if ($user) {
			firstName = $user.user_metadata?.first_name || ''
			lastName = $user.user_metadata?.last_name || ''
			email = $user.email || ''
		}
	})

	// Update form when user data changes
	$: if ($user) {
		firstName = $user.user_metadata?.first_name || ''
		lastName = $user.user_metadata?.last_name || ''
		email = $user.email || ''
	}

	// Clear messages when form changes
	$: if (firstName || lastName || email || currentPassword || newPassword || confirmPassword) {
		formErrors = {
			firstName: '',
			lastName: '',
			email: '',
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
			general: ''
		}
		successMessage = ''
	}

	// Validate name format (supports international characters)
	function validateName(name: string): boolean {
		return name.trim().length >= 2 && /^[\p{L}\s'-]+$/u.test(name.trim())
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

	// Handle profile update
	async function handleProfileUpdate() {
		// Reset errors
		formErrors = {
			firstName: '',
			lastName: '',
			email: '',
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
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

		if (hasErrors) return

		// Attempt profile update
		isSubmitting = true
		
		try {
			const updateData: any = {
				data: {
					first_name: firstName.trim(),
					last_name: lastName.trim(),
					display_name: `${firstName.trim()} ${lastName.trim()}`
				}
			}

			// Only update email if it changed
			if (email.trim() !== $user?.email) {
				updateData.email = email.trim()
			}

			const result = await authStore.updateUser(updateData)
			
			if (result.success) {
				successMessage = 'Profile updated successfully!'
				console.log('Profile update successful')
			} else {
				formErrors.general = result.error || 'Profile update failed. Please try again.'
			}
		} catch (err) {
			formErrors.general = 'An unexpected error occurred. Please try again.'
			console.error('Profile update error:', err)
		} finally {
			isSubmitting = false
		}
	}

	// Handle password change
	async function handlePasswordChange() {
		// Reset errors
		formErrors = {
			firstName: '',
			lastName: '',
			email: '',
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
			general: ''
		}

		// Validate form
		let hasErrors = false

		// Current password validation (for security)
		if (!currentPassword) {
			formErrors.currentPassword = 'Current password is required'
			hasErrors = true
		}

		// New password validation
		if (!newPassword) {
			formErrors.newPassword = 'New password is required'
			hasErrors = true
		} else {
			const passwordValidation = validatePassword(newPassword)
			if (!passwordValidation.isValid) {
				formErrors.newPassword = passwordValidation.message
				hasErrors = true
			}
		}

		// Confirm password validation
		if (!confirmPassword) {
			formErrors.confirmPassword = 'Please confirm your new password'
			hasErrors = true
		} else if (newPassword !== confirmPassword) {
			formErrors.confirmPassword = 'Passwords do not match'
			hasErrors = true
		}

		if (hasErrors) return

		// Attempt password change
		isSubmitting = true
		
		try {
			// First verify current password by attempting to sign in
			const verifyResult = await authStore.signIn($user?.email || '', currentPassword)
			
			if (!verifyResult.success) {
				formErrors.currentPassword = 'Current password is incorrect'
				return
			}

			// Update password
			const result = await authStore.updateUser({ password: newPassword })
			
			if (result.success) {
				successMessage = 'Password updated successfully!'
				currentPassword = ''
				newPassword = ''
				confirmPassword = ''
				console.log('Password update successful')
			} else {
				formErrors.general = result.error || 'Password update failed. Please try again.'
			}
		} catch (err) {
			formErrors.general = 'An unexpected error occurred. Please try again.'
			console.error('Password update error:', err)
		} finally {
			isSubmitting = false
		}
	}

</script>

<ProtectedRoute>
	<AppLayout title="Profile - Alvu">
		<!-- Page Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Profile Settings</h1>
			<p class="text-gray-600 mt-1">Manage your account information and preferences</p>
		</div>

		<!-- Profile Content -->
		<div class="max-w-4xl space-y-8">
				<!-- Success Message -->
				{#if successMessage}
					<div class="bg-green-50 border border-green-200 rounded-md p-4">
						<p class="text-sm text-green-600">{successMessage}</p>
					</div>
				{/if}

				<!-- Profile Information -->
				<div class="bg-white shadow rounded-lg">
					<div class="px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-medium text-gray-900">Profile Information</h2>
						<p class="text-sm text-gray-600">Update your personal information and email address.</p>
					</div>
					<form on:submit|preventDefault={handleProfileUpdate} class="p-6 space-y-6">
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

						<!-- General Error -->
						{#if formErrors.general}
							<div class="bg-red-50 border border-red-200 rounded-md p-3">
								<p class="text-sm text-red-600">{formErrors.general}</p>
							</div>
						{/if}

						<!-- Submit Button -->
						<button
							type="submit"
							disabled={isSubmitting || $loading}
							class="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
						>
							{#if isSubmitting}
								<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Updating...
							{:else}
								Update Profile
							{/if}
						</button>
					</form>
				</div>

				<!-- Change Password -->
				<div class="bg-white shadow rounded-lg">
					<div class="px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-medium text-gray-900">Change Password</h2>
						<p class="text-sm text-gray-600">Update your password to keep your account secure.</p>
					</div>
					<form on:submit|preventDefault={handlePasswordChange} class="p-6 space-y-6">
						<!-- Current Password -->
						<div>
							<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
								Current password
							</label>
							<div class="relative">
								<input
									id="currentPassword"
									name="currentPassword"
									type={showCurrentPassword ? 'text' : 'password'}
									autocomplete="current-password"
									bind:value={currentPassword}
									disabled={isSubmitting || $loading}
									class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									class:border-red-500={formErrors.currentPassword}
									class:focus:ring-red-500={formErrors.currentPassword}
									class:focus:border-red-500={formErrors.currentPassword}
									placeholder="Enter current password"
								/>
								<button
									type="button"
									on:click={() => showCurrentPassword = !showCurrentPassword}
									disabled={isSubmitting || $loading}
									class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
								>
									{#if showCurrentPassword}
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
							{#if formErrors.currentPassword}
								<p class="mt-1 text-sm text-red-600">{formErrors.currentPassword}</p>
							{/if}
						</div>

						<!-- New Password -->
						<div>
							<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
								New password
							</label>
							<div class="relative">
								<input
									id="newPassword"
									name="newPassword"
									type={showNewPassword ? 'text' : 'password'}
									autocomplete="new-password"
									bind:value={newPassword}
									disabled={isSubmitting || $loading}
									class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									class:border-red-500={formErrors.newPassword}
									class:focus:ring-red-500={formErrors.newPassword}
									class:focus:border-red-500={formErrors.newPassword}
									placeholder="Enter new password"
								/>
								<button
									type="button"
									on:click={() => showNewPassword = !showNewPassword}
									disabled={isSubmitting || $loading}
									class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
								>
									{#if showNewPassword}
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
							{#if formErrors.newPassword}
								<p class="mt-1 text-sm text-red-600">{formErrors.newPassword}</p>
							{:else}
								<p class="mt-1 text-sm text-gray-500">
									Password must be at least 8 characters with uppercase, lowercase, and number
								</p>
							{/if}
						</div>

						<!-- Confirm New Password -->
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
									disabled={isSubmitting || $loading}
									class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									class:border-red-500={formErrors.confirmPassword}
									class:focus:ring-red-500={formErrors.confirmPassword}
									class:focus:border-red-500={formErrors.confirmPassword}
									placeholder="Confirm new password"
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

						<!-- Submit Button -->
						<button
							type="submit"
							disabled={isSubmitting || $loading}
							class="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
						>
							{#if isSubmitting}
								<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Updating...
							{:else}
								Change Password
							{/if}
						</button>
					</form>
				</div>
		</div>
	</AppLayout>
</ProtectedRoute>