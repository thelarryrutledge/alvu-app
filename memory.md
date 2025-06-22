# Alvu PWA Budget App - Project Memory

## Project Overview

Alvu is a Progressive Web Application for envelope-based budget management built with Svelte, Tailwind CSS, Supabase, and deployed on Vercel.

## Technology Stack

- **Frontend**: Svelte with Vite, Tailwind CSS for responsive design
- **Backend**: Supabase (PostgreSQL, authentication, real-time features)
- **Deployment**: Vercel hosting with PWA configuration
- **Database**: PostgreSQL with Row Level Security (RLS) policies

## Core Architecture Decisions

### Data Model Structure
- **Users**: Supabase Auth with profile extensions
- **Income Sources**: Multiple streams with frequency enum (weekly, bi-weekly, semi-monthly, monthly, custom)
- **Categories**: Three default categories (Unassigned, Savings, Debt) plus user-defined custom categories
- **Envelopes**: Three types - Regular (basic budgeting), Savings (goal-oriented), Debt (balance tracking with APR)
- **Transactions**: Four types - Income, Expense, Transfer, Allocation
- **Allocations**: Income distribution rules (manual for MVP, automation planned)
- **Payees**: Saved payee information with smart defaults

### Key Business Logic
- **Income Processing**: Income adds to "Available" bucket, then user allocates to envelopes
- **Envelope Assignment**: Auto-assignment by type (Savings→Savings category, Debt→Debt category, others→Unassigned)
- **Manual Allocation**: Current implementation uses manual allocation interface
- **Balance Management**: Real-time balance updates across all components

### Security & Data Integrity
- **Row Level Security**: All tables implement RLS policies with user_id filtering
- **Database Constraints**: Foreign key relationships with appropriate CASCADE/RESTRICT rules
- **Input Validation**: Comprehensive validation on both client and server side
- **Authentication**: Supabase Auth with PKCE flow and session management

## Development Approach

- **Task-Based Development**: Single subtask implementation with testing and validation
- **Quality Assurance**: Each task includes testing, documentation, and git commits
- **Component Architecture**: Reusable components with TypeScript support
- **State Management**: Svelte stores for auth, modal, and toast systems

## Current Status

### Completed Tasks (1-7)
- ✅ **Task 1**: Project Foundation & Setup - Complete Svelte/Vite project with PWA, Tailwind, Vercel deployment
- ✅ **Task 2**: Database Schema & Supabase Configuration - All tables created with RLS policies and functions
- ✅ **Task 3**: Authentication System - Complete auth flow with login, registration, password reset, route protection
- ✅ **Task 4**: Core UI Framework & Navigation - AppLayout, responsive navigation, modal/toast systems, form components
- ✅ **Task 5**: Dashboard & Available Funds Display - Dynamic dashboard with financial overview and quick actions
- ✅ **Task 6**: Income Source Management - Complete CRUD operations with filtering, validation, and status management
- ✅ **Task 7**: Category Management System - Categories list, add/edit/delete with envelope reassignment, color coding system

### Task 7 Implementation Notes
- Categories page with comprehensive filtering and search
- Default categories auto-created on user signup via database trigger
- Add/Edit category forms with validation and color selection
- Delete functionality with envelope reassignment workflow
- Protection for default categories (cannot be deleted)
- **Category Display Components**: Created reusable components for better maintainability
  - `CategoryCard.svelte`: Individual category display with actions and styling
  - `CategorySummaryCards.svelte`: Statistics cards showing category counts
  - `CategoryList.svelte`: Grid layout with loading states and empty state handling
  - `CategoryEmptyState.svelte`: New user onboarding experience
- **Category Color Coding System**: Fully implemented visual categorization
  - Database schema includes `color` field with hex validation constraint
  - Default categories auto-assigned colors: Unassigned (gray), Savings (green), Debt (red)
  - Add/Edit forms feature comprehensive color picker with 18 predefined options
  - Category cards display colored icon backgrounds for visual distinction
  - Real-time color preview and validation in forms

## Critical Implementation Details

### Database Relationships
- `envelopes.category_id` references `categories.id` with `ON DELETE RESTRICT`
- Delete category requires envelope reassignment first to maintain referential integrity
- Default categories have `is_default: true` and special handling in UI

### Component Patterns
- Modal system with global state management via stores
- Form components with comprehensive validation and error handling
- Loading states and user feedback via toast notifications
- Responsive design with mobile-first approach

### Authentication Flow
- Protected routes with automatic redirects
- User session management with real-time auth state
- Profile management with password change functionality

## Next Development Phase

**Current**: Task 8 - Envelope Management System
- Create envelopes list page with category grouping
- Implement envelope CRUD operations with type-specific validation
- Add progress tracking for savings goals and debt payoff

## Future Considerations

- **Automation**: Automatic allocation rules based on percentages
- **Recurring Transactions**: Scheduled recurring income and expenses
- **Advanced Features**: Bank API integration, shared budgets, advanced reporting
- **Performance**: Virtual scrolling for large lists, efficient state management

## MVP Constraints

- Manual entry only (no bank sync)
- Single currency support
- Basic reporting (advanced analytics post-MVP)
