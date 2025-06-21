# Alvu PWA Budget App - Project Memory

## Project Overview
Alvu is a Progressive Web Application for envelope-based budget management. The app enables users to manage multiple income sources, organize spending into categorized envelopes, and track financial goals through savings and debt management.

## Technology Stack
- **Frontend**: Svelte with Vite build system
- **Styling**: Tailwind CSS for responsive design
- **Backend**: Supabase (PostgreSQL database, authentication, real-time features)
- **Deployment**: Vercel hosting platform
- **PWA**: Service worker and manifest for mobile installation

## Core Architecture Decisions

### Data Model Structure
- **Users**: Authentication and profile management via Supabase Auth
- **Income Sources**: Multiple streams with configurable frequencies (weekly, bi-weekly, semi-monthly, monthly, custom)
- **Categories**: Three default categories (Unassigned, Savings, Debt) plus user-defined custom categories
- **Envelopes**: Three types - Regular (basic budgeting), Savings (goal-oriented with progress tracking), Debt (balance tracking with APR calculations)
- **Transactions**: Four types - Income (adds to available funds), Expense (deducts from envelope), Transfer (moves between envelopes), Allocation (distributes from available to envelopes)

### Key Business Logic
- **Income Processing**: Income transactions add to "Available" bucket, then user can allocate to envelopes via dynamic interface
- **Envelope Assignment**: Savings envelopes auto-assign to Savings category, Debt envelopes to Debt category, others to Unassigned unless specified
- **Manual Allocation**: Current implementation uses manual allocation interface; automation planned for future
- **Balance Management**: Real-time balance updates across all components

### User Experience Design
- **Mobile-First**: PWA optimized for mobile devices with home screen installation
- **Responsive**: Tailwind CSS ensures functionality across all screen sizes
- **Manual Entry Focus**: All transactions manually entered (no bank sync for MVP)
- **Quick Action Dashboard**: Prominent buttons for Add Income, Add Expense, Transfer Funds, Allocate Funds
- **Dynamic Interface**: Real-time allocation interface with add/remove rows and live balance updates
- **Progress Tracking**: Visual indicators for savings goals and debt paydown

## Development Approach
- **Task-Based Development**: Single subtask implementation with testing and validation
- **Incremental Building**: 20 major tasks broken into granular subtasks
- **Quality Assurance**: Each task includes testing, documentation, and git commits
- **Security Focus**: Row Level Security (RLS) policies, input validation, and data protection

## Current Status
- Project initialized with comprehensive planning documents
- Implementation Plan created with detailed system architecture
- Todo list established with 200+ granular subtasks across 20 major tasks
- **Task 1 Progress**: Project Foundation & Setup
  - ✅ Svelte project with Vite successfully initialized
    - Node.js v24.2.0 and npm v11.3.0 installed via Homebrew
    - Svelte project created using `npx sv create` with minimal template
    - TypeScript support configured
    - Project structure established with src/, static/, and configuration files
    - Dependencies installed and project ready for development
  - ✅ Tailwind CSS configured for responsive design
    - Installed `tailwindcss` and `@tailwindcss/vite` packages
    - Configured Vite plugin in `vite.config.ts` with `@tailwindcss/vite`
    - Created `tailwind.config.js` with proper content paths
    - Set up `src/app.css` with `@import "tailwindcss";`
    - Imported CSS in `src/routes/+layout.svelte`
    - Verified responsive design works across desktop and mobile
    - Professional card-based layout with gray background and blue accents
  - ✅ PWA configuration (manifest.json, service worker)
    - Created comprehensive `static/manifest.json` with app metadata, icons, and shortcuts
    - Implemented `static/sw.js` service worker with caching, offline support, and future sync capabilities
    - Updated `src/app.html` with PWA meta tags, manifest link, and service worker registration
    - Added mobile-web-app-capable meta tag and Apple-specific PWA meta tags
    - Configured theme colors, app shortcuts, and proper PWA display settings
    - Service worker successfully registers and caches static assets
    - App is now installable as PWA on mobile devices and desktop
  - ✅ Vercel deployment configuration
    - Created comprehensive `vercel.json` with SvelteKit framework settings
    - Configured proper headers for PWA functionality and security
    - Set up service worker caching headers and manifest content-type
    - Added security headers (XSS protection, CSRF, frame options)
    - Created `.env.example` with required Supabase environment variables
    - Documented deployment process in `DEPLOYMENT.md` with step-by-step instructions
    - Configured API route handling for future Supabase functions
    - Ready for one-click deployment to Vercel platform
  - ✅ Supabase project setup and API keys
    - Created comprehensive `SUPABASE_SETUP.md` with step-by-step instructions
    - Documented project creation process with recommended settings
    - Provided API key extraction and security guidelines
    - Included environment variable configuration for development and production
    - Added Vercel environment variable setup instructions
    - Documented security best practices (RLS, key management)
    - Included troubleshooting section and support resources
    - Ready for database schema creation and authentication setup
  - ✅ Environment configuration files and Supabase connection
    - Environment variables configured in `.env` file with Supabase credentials
    - Supabase JavaScript client library installed (@supabase/supabase-js v2.50.0)
    - Vercel environment variables updated for production deployment
    - Created connection test script in `test/test-supabase.js` for debugging
    - Successfully tested Supabase connection with live database
    - Confirmed API keys and project URL are working correctly
    - Ready for database schema creation and table setup

## Critical Implementation Notes
- **Database Security**: All tables must implement Row Level Security (RLS) policies
- **Real-Time Updates**: Leverage Supabase real-time features for balance updates
- **PWA Requirements**: Must be installable on mobile devices and work offline
- **Responsive Design**: Must function seamlessly on desktop and mobile
- **Financial Data Integrity**: All monetary calculations must be precise and validated

## Future Considerations (Post-MVP)
- **Automation System**: Automatic allocation rules based on percentages or fixed amounts
- **Recurring Transactions**: Scheduled recurring income and expenses
- **Advanced Features**: Bank API integration, shared budgets
- **Enhanced Reporting**: Budget vs actual analysis, spending pattern insights
- **Data Export**: CSV/PDF export capabilities for transaction history
- **Performance**: Virtual scrolling for large transaction lists, efficient state management

## MVP Constraints
- **Manual Entry Only**: No bank account synchronization or automatic transaction importing
- **No Multi-Currency**: Single currency support for initial release
- **Basic Reporting**: Transaction history and filtering, advanced analytics post-MVP

## Development Guidelines
- Follow task-based development approach from guideline.md
- Implement one subtask at a time with proper testing
- Update memory.md after significant architectural decisions
- Commit changes with descriptive messages after each completed subtask
- Maintain focus on security and data integrity for financial application