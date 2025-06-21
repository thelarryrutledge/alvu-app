import { writable } from 'svelte/store'
import type { User } from '@supabase/supabase-js'

// Authentication store for managing user state
export const user = writable<User | null>(null)
export const loading = writable<boolean>(true)
export const error = writable<string | null>(null)

// Helper functions for authentication state
export const authStore = {
  // Set user data
  setUser: (userData: User | null) => {
    user.set(userData)
    loading.set(false)
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
    loading.set(false)
    error.set(null)
  }
}