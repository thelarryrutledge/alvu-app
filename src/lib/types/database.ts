// Database type definitions for Alvu PWA
// These will be updated as we create the database schema

export interface User {
	id: string
	email: string
	first_name?: string
	last_name?: string
	display_name?: string
	avatar_url?: string
	timezone: string
	currency: string
	date_format: string
	created_at: string
	updated_at: string
}

export interface Category {
	id: string
	user_id: string
	name: string
	color: string
	icon?: string
	description?: string
	is_default: boolean
	sort_order: number
	created_at: string
	updated_at: string
}

export interface CategoryStats {
	category_id: string
	category_name: string
	envelope_count: number
	total_balance: number
}

export interface Envelope {
	id: string
	user_id: string
	category_id: string
	name: string
	type: 'regular' | 'savings' | 'debt'
	balance: number
	target_amount?: number
	target_date?: string
	apr?: number
	minimum_payment?: number
	created_at: string
	updated_at: string
}

export interface Transaction {
	id: string
	user_id: string
	envelope_id?: string
	type: 'income' | 'expense' | 'transfer' | 'allocation'
	amount: number
	description: string
	payee?: string
	date: string
	created_at: string
	updated_at: string
}

export type IncomeFrequency = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly' | 'custom'

export interface IncomeSource {
	id: string
	user_id: string
	name: string
	amount: number
	frequency: IncomeFrequency
	custom_frequency_days?: number
	is_active: boolean
	description?: string
	next_expected_date?: string
	created_at: string
	updated_at: string
}

export interface Allocation {
	id: string
	user_id: string
	envelope_id: string
	income_source_id?: string
	amount: number
	percentage?: number
	is_percentage: boolean
	is_automatic: boolean
	priority: number
	description?: string
	created_at: string
	updated_at: string
}

export interface Payee {
	id: string
	user_id: string
	name: string
	category?: string
	default_envelope_id?: string
	default_amount?: number
	notes?: string
	is_favorite: boolean
	last_used_at?: string
	usage_count: number
	created_at: string
	updated_at: string
}

// Database response types
export type DatabaseResponse<T> = {
	data: T | null
	error: Error | null
}

export type DatabaseArrayResponse<T> = {
	data: T[] | null
	error: Error | null
}
