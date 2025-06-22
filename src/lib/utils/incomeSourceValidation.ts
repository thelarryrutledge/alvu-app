import type { IncomeFrequency } from '$lib/types/database'

export interface IncomeSourceFormData {
	name: string
	amount: number
	frequency: IncomeFrequency | ''
	custom_frequency_days?: number
	description?: string
	is_active: boolean
}

export interface ValidationErrors {
	[key: string]: string
}

export interface ValidationResult {
	isValid: boolean
	errors: ValidationErrors
}

// Validation constants
export const VALIDATION_RULES = {
	name: {
		minLength: 2,
		maxLength: 100,
		required: true
	},
	amount: {
		min: 0.01,
		max: 1000000,
		required: true
	},
	description: {
		maxLength: 500,
		required: false
	},
	customFrequencyDays: {
		min: 1,
		max: 365,
		required: true // when frequency is 'custom'
	}
}

// Reserved/forbidden income source names
const RESERVED_NAMES = [
	'system',
	'admin',
	'default',
	'null',
	'undefined',
	'test',
	'temp',
	'temporary'
]

// Common income source name patterns to suggest better naming
const GENERIC_PATTERNS = [
	/^income$/i,
	/^money$/i,
	/^cash$/i,
	/^pay$/i,
	/^salary$/i,
	/^job$/i,
	/^work$/i
]

/**
 * Validates income source name
 */
export function validateName(name: string): string | null {
	const trimmedName = name.trim()
	
	// Required check
	if (!trimmedName) {
		return 'Income source name is required'
	}
	
	// Length checks
	if (trimmedName.length < VALIDATION_RULES.name.minLength) {
		return `Name must be at least ${VALIDATION_RULES.name.minLength} characters long`
	}
	
	if (trimmedName.length > VALIDATION_RULES.name.maxLength) {
		return `Name must be less than ${VALIDATION_RULES.name.maxLength} characters`
	}
	
	// Reserved names check
	if (RESERVED_NAMES.includes(trimmedName.toLowerCase())) {
		return 'This name is reserved. Please choose a different name'
	}
	
	// Generic name warning (not an error, but helpful)
	const isGeneric = GENERIC_PATTERNS.some(pattern => pattern.test(trimmedName))
	if (isGeneric) {
		return 'Consider using a more specific name like "Main Job" or "Freelance Work"'
	}
	
	// Special characters check (allow letters, numbers, spaces, hyphens, apostrophes)
	const validNamePattern = /^[a-zA-Z0-9\s\-']+$/
	if (!validNamePattern.test(trimmedName)) {
		return 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes'
	}
	
	return null
}

/**
 * Validates income amount
 */
export function validateAmount(amount: number): string | null {
	// Required check
	if (!amount || amount <= 0) {
		return 'Amount must be greater than 0'
	}
	
	// Minimum check
	if (amount < VALIDATION_RULES.amount.min) {
		return `Amount must be at least $${VALIDATION_RULES.amount.min}`
	}
	
	// Maximum check
	if (amount > VALIDATION_RULES.amount.max) {
		return `Amount must be less than $${VALIDATION_RULES.amount.max.toLocaleString()}`
	}
	
	// Decimal places check (max 2 decimal places for currency)
	const decimalPlaces = (amount.toString().split('.')[1] || '').length
	if (decimalPlaces > 2) {
		return 'Amount can have at most 2 decimal places'
	}
	
	return null
}

/**
 * Validates frequency selection
 */
export function validateFrequency(frequency: IncomeFrequency | ''): string | null {
	if (!frequency) {
		return 'Please select a frequency'
	}
	
	const validFrequencies: IncomeFrequency[] = ['weekly', 'bi-weekly', 'semi-monthly', 'monthly', 'custom']
	if (!validFrequencies.includes(frequency)) {
		return 'Invalid frequency selected'
	}
	
	return null
}

/**
 * Validates custom frequency days
 */
export function validateCustomFrequencyDays(days: number | undefined, frequency: IncomeFrequency | ''): string | null {
	// Only validate if frequency is custom
	if (frequency !== 'custom') {
		return null
	}
	
	if (!days || days < VALIDATION_RULES.customFrequencyDays.min) {
		return `Custom frequency must be at least ${VALIDATION_RULES.customFrequencyDays.min} day`
	}
	
	if (days > VALIDATION_RULES.customFrequencyDays.max) {
		return `Custom frequency must be less than ${VALIDATION_RULES.customFrequencyDays.max} days`
	}
	
	// Check for whole numbers only
	if (!Number.isInteger(days)) {
		return 'Custom frequency must be a whole number of days'
	}
	
	return null
}

/**
 * Validates description
 */
export function validateDescription(description: string | undefined): string | null {
	if (!description) {
		return null // Description is optional
	}
	
	const trimmedDescription = description.trim()
	
	if (trimmedDescription.length > VALIDATION_RULES.description.maxLength) {
		return `Description must be less than ${VALIDATION_RULES.description.maxLength} characters`
	}
	
	// Check for potentially harmful content (basic XSS prevention)
	const dangerousPatterns = [
		/<script/i,
		/javascript:/i,
		/on\w+\s*=/i,
		/<iframe/i,
		/<object/i,
		/<embed/i
	]
	
	const hasDangerousContent = dangerousPatterns.some(pattern => pattern.test(trimmedDescription))
	if (hasDangerousContent) {
		return 'Description contains invalid content'
	}
	
	return null
}

/**
 * Validates the entire income source form data
 */
export function validateIncomeSourceForm(formData: IncomeSourceFormData): ValidationResult {
	const errors: ValidationErrors = {}
	
	// Validate each field
	const nameError = validateName(formData.name)
	if (nameError) errors.name = nameError
	
	const amountError = validateAmount(formData.amount)
	if (amountError) errors.amount = amountError
	
	const frequencyError = validateFrequency(formData.frequency)
	if (frequencyError) errors.frequency = frequencyError
	
	const customFrequencyError = validateCustomFrequencyDays(formData.custom_frequency_days, formData.frequency)
	if (customFrequencyError) errors.custom_frequency_days = customFrequencyError
	
	const descriptionError = validateDescription(formData.description)
	if (descriptionError) errors.description = descriptionError
	
	return {
		isValid: Object.keys(errors).length === 0,
		errors
	}
}

/**
 * Validates income source name uniqueness (for use with existing income sources)
 */
export function validateNameUniqueness(
	name: string, 
	existingNames: string[], 
	excludeId?: string
): string | null {
	const trimmedName = name.trim()
	
	// Check if name already exists (case-insensitive)
	const isDuplicate = existingNames.some(existingName => 
		existingName.toLowerCase() === trimmedName.toLowerCase()
	)
	
	if (isDuplicate) {
		return 'An income source with this name already exists'
	}
	
	return null
}

/**
 * Sanitizes input data before validation
 */
export function sanitizeIncomeSourceData(formData: IncomeSourceFormData): IncomeSourceFormData {
	return {
		...formData,
		name: formData.name.trim(),
		description: formData.description?.trim() || undefined,
		// Ensure amount is a valid number
		amount: Number(formData.amount) || 0,
		// Ensure custom_frequency_days is a valid integer
		custom_frequency_days: formData.custom_frequency_days ? Math.floor(Number(formData.custom_frequency_days)) : undefined
	}
}

/**
 * Gets validation suggestions for better user experience
 */
export function getValidationSuggestions(formData: IncomeSourceFormData): string[] {
	const suggestions: string[] = []
	
	// Name suggestions
	if (formData.name.trim().length > 0) {
		const isGeneric = GENERIC_PATTERNS.some(pattern => pattern.test(formData.name.trim()))
		if (isGeneric) {
			suggestions.push('Consider using a more descriptive name like "Main Job at Company X" or "Freelance Design Work"')
		}
	}
	
	// Amount suggestions
	if (formData.amount > 0) {
		if (formData.amount < 100 && formData.frequency === 'monthly') {
			suggestions.push('This seems like a low monthly amount. Double-check the frequency and amount.')
		}
		if (formData.amount > 50000 && formData.frequency === 'weekly') {
			suggestions.push('This seems like a high weekly amount. Double-check the frequency and amount.')
		}
	}
	
	// Frequency suggestions
	if (formData.frequency === 'custom' && formData.custom_frequency_days) {
		if (formData.custom_frequency_days === 7) {
			suggestions.push('Consider using "Weekly" instead of custom 7 days')
		} else if (formData.custom_frequency_days === 14) {
			suggestions.push('Consider using "Bi-weekly" instead of custom 14 days')
		} else if (formData.custom_frequency_days === 30 || formData.custom_frequency_days === 31) {
			suggestions.push('Consider using "Monthly" instead of custom 30-31 days')
		}
	}
	
	return suggestions
}