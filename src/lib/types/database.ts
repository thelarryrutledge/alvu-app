// Database type definitions for Alvu PWA
// These will be updated as we create the database schema

export interface User {
	id: string
	email: string
	created_at: string
	updated_at: string
}

export interface Category {
	id: string
	user_id: string
	name: string
	color?: string
	is_default: boolean
	created_at: string
	updated_at: string
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

export interface IncomeSource {
	id: string
	user_id: string
	name: string
	amount: number
	frequency: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly' | 'custom'
	is_active: boolean
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
