# Alvu PWA - Project Structure

## Overview
This document outlines the organized folder structure for the Alvu envelope budgeting PWA, designed for scalability and maintainability.

## Root Directory Structure

```
alvu-app/
├── src/                          # Source code
│   ├── lib/                      # Shared libraries and utilities
│   │   ├── components/           # Reusable Svelte components
│   │   ├── stores/               # Svelte stores for state management
│   │   ├── utils/                # Utility functions and helpers
│   │   ├── types/                # TypeScript type definitions
│   │   └── index.ts              # Library exports
│   ├── routes/                   # SvelteKit routes (pages)
│   │   ├── auth/                 # Authentication pages
│   │   ├── dashboard/            # Main dashboard
│   │   ├── income/               # Income management
│   │   ├── expenses/             # Expense tracking
│   │   ├── envelopes/            # Envelope management
│   │   ├── categories/           # Category management
│   │   ├── transactions/         # Transaction history
│   │   ├── api/                  # API endpoints
│   │   ├── +layout.svelte        # Root layout
│   │   └── +page.svelte          # Home page
│   ├── app.html                  # HTML template
│   ├── app.css                   # Global styles
│   └── app.d.ts                  # App type definitions
├── static/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── favicon.png               # App icon
├── test/                         # Test files and utilities
└── docs/                         # Documentation files
```

## Detailed Structure

### `/src/lib/` - Shared Libraries

#### `/src/lib/components/`
Reusable Svelte components organized by functionality:
- **UI Components**: Buttons, inputs, modals, cards
- **Layout Components**: Navigation, sidebars, headers
- **Business Components**: Envelope cards, transaction items, allocation forms
- **Form Components**: Input validation, form wrappers

#### `/src/lib/stores/`
Svelte stores for application state:
- `auth.ts` - Authentication state and user data
- `envelopes.ts` - Envelope data and operations
- `transactions.ts` - Transaction history and management
- `categories.ts` - Category management
- `ui.ts` - UI state (modals, notifications, loading)

#### `/src/lib/utils/`
Utility functions and helpers:
- `supabase.ts` - Supabase client configuration
- `currency.ts` - Currency formatting and calculations
- `validation.ts` - Form validation helpers
- `date.ts` - Date formatting and manipulation
- `constants.ts` - Application constants

#### `/src/lib/types/`
TypeScript type definitions:
- `database.ts` - Database schema types
- `auth.ts` - Authentication types
- `envelope.ts` - Envelope and category types
- `transaction.ts` - Transaction types
- `ui.ts` - UI component types

### `/src/routes/` - Application Pages

#### `/src/routes/auth/`
Authentication-related pages:
- `login/+page.svelte` - Login form
- `register/+page.svelte` - Registration form
- `reset-password/+page.svelte` - Password reset
- `profile/+page.svelte` - User profile management

#### `/src/routes/dashboard/`
Main application dashboard:
- `+page.svelte` - Dashboard overview
- `+layout.svelte` - Dashboard layout with navigation

#### `/src/routes/income/`
Income management:
- `+page.svelte` - Income sources list
- `add/+page.svelte` - Add new income source
- `[id]/+page.svelte` - Edit income source
- `[id]/transactions/+page.svelte` - Income transaction history

#### `/src/routes/expenses/`
Expense tracking:
- `+page.svelte` - Recent expenses
- `add/+page.svelte` - Add new expense
- `[id]/+page.svelte` - Edit expense

#### `/src/routes/envelopes/`
Envelope management:
- `+page.svelte` - Envelopes overview
- `add/+page.svelte` - Create new envelope
- `[id]/+page.svelte` - Envelope details and transactions
- `[id]/edit/+page.svelte` - Edit envelope settings

#### `/src/routes/categories/`
Category management:
- `+page.svelte` - Categories list
- `add/+page.svelte` - Add new category
- `[id]/+page.svelte` - Category details

#### `/src/routes/transactions/`
Transaction history and management:
- `+page.svelte` - Transaction history with filtering
- `[id]/+page.svelte` - Transaction details
- `allocate/+page.svelte` - Fund allocation interface
- `transfer/+page.svelte` - Transfer between envelopes

#### `/src/routes/api/`
API endpoints for server-side operations:
- `auth/` - Authentication endpoints
- `envelopes/` - Envelope CRUD operations
- `transactions/` - Transaction operations
- `categories/` - Category operations

### `/static/` - Static Assets
- PWA manifest and service worker
- Icons and images
- Favicon and app icons

### `/test/` - Testing
- Unit tests for components
- Integration tests for workflows
- Utility test scripts (like Supabase connection test)

## File Naming Conventions

### SvelteKit Routes
- `+page.svelte` - Page components
- `+layout.svelte` - Layout components
- `+page.server.ts` - Server-side page logic
- `+layout.server.ts` - Server-side layout logic
- `+error.svelte` - Error pages

### Components
- PascalCase for component files: `EnvelopeCard.svelte`
- Descriptive names indicating purpose: `TransactionForm.svelte`

### Stores
- camelCase with descriptive names: `authStore.ts`
- Grouped by functionality: `envelopeStore.ts`

### Utilities
- camelCase with clear purpose: `currencyUtils.ts`
- Grouped by domain: `validationUtils.ts`

## Development Guidelines

### Component Organization
- Keep components focused and single-purpose
- Use composition over inheritance
- Implement proper TypeScript typing
- Include JSDoc comments for complex components

### State Management
- Use Svelte stores for shared state
- Keep stores focused on specific domains
- Implement proper error handling
- Use derived stores for computed values

### Routing
- Follow SvelteKit conventions
- Use proper route parameters
- Implement loading states
- Handle error conditions

### API Design
- RESTful endpoints where appropriate
- Consistent error handling
- Proper HTTP status codes
- Input validation and sanitization

This structure provides a solid foundation for the Alvu PWA while maintaining flexibility for future enhancements.