// Application constants for Alvu PWA

// Default categories that are created for new users
export const DEFAULT_CATEGORIES = [
	{ name: 'Unassigned', color: '#6b7280', is_default: true },
	{ name: 'Savings', color: '#10b981', is_default: true },
	{ name: 'Debt', color: '#ef4444', is_default: true }
] as const

// Envelope types
export const ENVELOPE_TYPES = {
	REGULAR: 'regular',
	SAVINGS: 'savings',
	DEBT: 'debt'
} as const

// Transaction types
export const TRANSACTION_TYPES = {
	INCOME: 'income',
	EXPENSE: 'expense',
	TRANSFER: 'transfer',
	ALLOCATION: 'allocation'
} as const

// Income frequencies
export const INCOME_FREQUENCIES = {
	WEEKLY: 'weekly',
	BI_WEEKLY: 'bi-weekly',
	SEMI_MONTHLY: 'semi-monthly',
	MONTHLY: 'monthly',
	CUSTOM: 'custom'
} as const

// Currency settings
export const CURRENCY = {
	SYMBOL: '$',
	CODE: 'USD',
	LOCALE: 'en-US'
} as const

// UI Constants
export const UI = {
	TOAST_DURATION: 3000,
	DEBOUNCE_DELAY: 300,
	PAGINATION_SIZE: 20
} as const

// Validation constants
export const VALIDATION = {
	MIN_PASSWORD_LENGTH: 8,
	MAX_ENVELOPE_NAME_LENGTH: 50,
	MAX_DESCRIPTION_LENGTH: 200,
	MIN_AMOUNT: 0.01,
	MAX_AMOUNT: 999999.99
} as const

// Color palette for categories and envelopes
export const COLORS = [
	'#3b82f6', // blue
	'#10b981', // emerald
	'#f59e0b', // amber
	'#ef4444', // red
	'#8b5cf6', // violet
	'#06b6d4', // cyan
	'#84cc16', // lime
	'#f97316', // orange
	'#ec4899', // pink
	'#6b7280' // gray
] as const
