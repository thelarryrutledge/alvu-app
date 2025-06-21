import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

// Log environment variables for debugging (only in development)
if (typeof window !== 'undefined') {
	console.log('Supabase configuration:')
	console.log('URL:', PUBLIC_SUPABASE_URL || 'Not set')
	console.log('Key length:', PUBLIC_SUPABASE_ANON_KEY?.length || 0)
	
	// Warn about potential issues but don't crash
	if (PUBLIC_SUPABASE_URL && !PUBLIC_SUPABASE_URL.startsWith('https://')) {
		console.warn('Warning: Supabase URL should start with https://', PUBLIC_SUPABASE_URL)
	}
	
	if (PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_URL.includes('@')) {
		console.warn('Warning: Supabase URL contains credentials (@). This may cause fetch errors.')
	}
}

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with auth configuration
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		// Configure auth settings
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		// Configure storage for session persistence
		storage: typeof window !== 'undefined' ? window.localStorage : undefined,
		// Configure auth flow type
		flowType: 'pkce'
	},
	// Configure real-time settings
	realtime: {
		params: {
			eventsPerSecond: 10
		}
	}
})

// Auth helper functions
export const auth = {
	// Get current session
	getSession: () => supabase.auth.getSession(),
	
	// Get current user
	getUser: () => supabase.auth.getUser(),
	
	// Sign up with email and password
	signUp: (email: string, password: string, options?: { data?: Record<string, any> }) =>
		supabase.auth.signUp({ email, password, options }),
	
	// Sign in with email and password
	signIn: (email: string, password: string) =>
		supabase.auth.signInWithPassword({ email, password }),
	
	// Sign out
	signOut: () => supabase.auth.signOut(),
	
	// Reset password
	resetPassword: (email: string, redirectTo?: string) =>
		supabase.auth.resetPasswordForEmail(email, { redirectTo }),
	
	// Update user
	updateUser: (attributes: { email?: string; password?: string; data?: Record<string, any> }) =>
		supabase.auth.updateUser(attributes),
	
	// Listen to auth state changes
	onAuthStateChange: (callback: (event: string, session: any) => void) =>
		supabase.auth.onAuthStateChange(callback)
}
