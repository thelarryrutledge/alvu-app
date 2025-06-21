import { writable, derived } from 'svelte/store'
import type { User, Session } from '@supabase/supabase-js'
import { auth } from '$lib/utils/supabase'
import { browser } from '$app/environment'

// Core authentication stores
export const user = writable<User | null>(null)
export const session = writable<Session | null>(null)
export const loading = writable<boolean>(true)
export const error = writable<string | null>(null)

// Derived store for authentication status
export const isAuthenticated = derived(
	[user, session],
	([$user, $session]) => !!$user && !!$session
)

// Initialize auth state on app load
let initialized = false

export const initializeAuth = async () => {
	if (!browser || initialized) return
	
	try {
		loading.set(true)
		error.set(null)
		
		// Get initial session
		const { data: { session: initialSession }, error: sessionError } = await auth.getSession()
		
		if (sessionError) {
			console.error('Error getting session:', sessionError)
			error.set(sessionError.message)
		} else {
			session.set(initialSession)
			user.set(initialSession?.user ?? null)
		}
		
		// Listen for auth state changes
		auth.onAuthStateChange((event, newSession) => {
			console.log('Auth state changed:', event, newSession?.user?.email)
			
			session.set(newSession)
			user.set(newSession?.user ?? null)
			loading.set(false)
			
			// Clear error on successful auth
			if (newSession?.user) {
				error.set(null)
			}
		})
		
		initialized = true
	} catch (err) {
		console.error('Error initializing auth:', err)
		error.set(err instanceof Error ? err.message : 'Failed to initialize authentication')
	} finally {
		loading.set(false)
	}
}

// Authentication helper functions
export const authStore = {
	// Initialize authentication
	initialize: initializeAuth,
	
	// Sign up with email and password
	signUp: async (email: string, password: string, userData?: Record<string, any>) => {
		try {
			loading.set(true)
			error.set(null)
			
			const { data, error: signUpError } = await auth.signUp(email, password, {
				data: userData
			})
			
			if (signUpError) {
				error.set(signUpError.message)
				return { success: false, error: signUpError.message }
			}
			
			return { success: true, data }
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
			error.set(errorMessage)
			return { success: false, error: errorMessage }
		} finally {
			loading.set(false)
		}
	},
	
	// Sign in with email and password
	signIn: async (email: string, password: string) => {
		try {
			loading.set(true)
			error.set(null)
			
			const { data, error: signInError } = await auth.signIn(email, password)
			
			if (signInError) {
				error.set(signInError.message)
				return { success: false, error: signInError.message }
			}
			
			return { success: true, data }
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
			error.set(errorMessage)
			return { success: false, error: errorMessage }
		} finally {
			loading.set(false)
		}
	},
	
	// Sign out
	signOut: async () => {
		try {
			loading.set(true)
			error.set(null)
			
			const { error: signOutError } = await auth.signOut()
			
			if (signOutError) {
				error.set(signOutError.message)
				return { success: false, error: signOutError.message }
			}
			
			// Clear stores
			user.set(null)
			session.set(null)
			
			return { success: true }
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
			error.set(errorMessage)
			return { success: false, error: errorMessage }
		} finally {
			loading.set(false)
		}
	},
	
	// Reset password
	resetPassword: async (email: string, redirectTo?: string) => {
		try {
			loading.set(true)
			error.set(null)
			
			const { error: resetError } = await auth.resetPassword(email, redirectTo)
			
			if (resetError) {
				error.set(resetError.message)
				return { success: false, error: resetError.message }
			}
			
			return { success: true }
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Password reset failed'
			error.set(errorMessage)
			return { success: false, error: errorMessage }
		} finally {
			loading.set(false)
		}
	},
	
	// Update user profile
	updateUser: async (attributes: { email?: string; password?: string; data?: Record<string, any> }) => {
		try {
			loading.set(true)
			error.set(null)
			
			const { data, error: updateError } = await auth.updateUser(attributes)
			
			if (updateError) {
				error.set(updateError.message)
				return { success: false, error: updateError.message }
			}
			
			return { success: true, data }
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Profile update failed'
			error.set(errorMessage)
			return { success: false, error: errorMessage }
		} finally {
			loading.set(false)
		}
	},
	
	// Set loading state
	setLoading: (isLoading: boolean) => {
		loading.set(isLoading)
	},
	
	// Set error state
	setError: (errorMessage: string | null) => {
		error.set(errorMessage)
	},
	
	// Clear all auth state
	clear: () => {
		user.set(null)
		session.set(null)
		loading.set(false)
		error.set(null)
	}
}
