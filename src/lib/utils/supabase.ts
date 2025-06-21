import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	console.error('Missing Supabase environment variables:')
	console.error('PUBLIC_SUPABASE_URL:', PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
	console.error('PUBLIC_SUPABASE_ANON_KEY:', PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
	throw new Error('Missing Supabase environment variables')
}

// Validate URL format
if (PUBLIC_SUPABASE_URL && !PUBLIC_SUPABASE_URL.startsWith('https://')) {
	console.error('Invalid Supabase URL format:', PUBLIC_SUPABASE_URL)
	throw new Error('Supabase URL must start with https://')
}

// Check for credentials in URL (which causes the fetch error)
if (PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_URL.includes('@')) {
	console.error('Supabase URL contains credentials (@ symbol):', PUBLIC_SUPABASE_URL)
	throw new Error('Supabase URL should not contain credentials. Use the project URL, not a connection string.')
}

console.log('Supabase configuration:')
console.log('URL:', PUBLIC_SUPABASE_URL)
console.log('Key length:', PUBLIC_SUPABASE_ANON_KEY?.length || 0)

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
