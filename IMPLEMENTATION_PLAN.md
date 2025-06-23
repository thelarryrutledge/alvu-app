# Alvu PWA Budget App - Implementation Plan

## Project Overview

Alvu is a Progressive Web Application (PWA) envelope-based budget management system built with:

- **Frontend**: Svelte + Tailwind CSS (responsive design)
- **Backend**: Supabase (database, authentication, real-time features)
- **Deployment**: Vercel
- **Architecture**: PWA for mobile/desktop accessibility

## Core System Architecture

### MVP Focus: Manual Transaction Entry

- All transactions will be manually entered by users
- No bank account synchronization or automatic importing
- Quick action dashboard buttons for efficient manual entry
- Focus on streamlined user experience for manual data entry

### 1. Data Models

#### Users

- Authentication and profile management
- User preferences and settings

#### Income Sources

- Multiple income streams per user
- Configurable frequencies: weekly, bi-weekly, semi-monthly, monthly, custom
- Support for regular payroll, freelance, and unexpected income

#### Categories

- **Default Categories**: Unassigned, Savings, Debt
- **Custom Categories**: User-defined organizational groups
- Hierarchical structure for envelope organization

#### Envelopes

- **Regular Envelopes**: Basic budget allocation containers
- **Savings Envelopes**: Goal-oriented with target amounts, dates, and progress tracking
- **Debt Envelopes**: Balance tracking with APR, minimum payments, due dates, and paydown progress
- Category assignment (automatic for Savings/Debt types, manual for others)

#### Transactions

- **Income**: Adds to available funds bucket
- **Expense**: Deducts from specific envelope to payee
- **Transfer**: Moves funds between envelopes
- **Allocation**: Moves funds from available bucket to envelopes

### 2. Core Workflows

#### Unified Transaction System

**Architecture Decision**: Single transaction interface with type selection rather than separate forms
- **Transactions Page**: Central hub for all transaction management with history display
- **Unified Add Transaction Form**: One form that adapts based on transaction type selection
- **Dashboard Quick Actions**: Pre-fill transaction form with selected type
- **Transaction Types**: Income, Expense, Transfer, Allocation handled in unified interface

#### Income Processing

1. User selects "Income" transaction type or uses dashboard quick action
2. Unified form shows income-specific fields (income source, amount, description)
3. Funds added to "Available" bucket
4. System prompts for allocation (can be skipped)
5. Dynamic allocation interface allows distribution to envelopes
6. Remaining funds stay in Available bucket

#### Expense Processing

1. User selects "Expense" transaction type or uses dashboard quick action
2. Unified form shows expense-specific fields (envelope selection, payee, amount)
3. System validates sufficient envelope balance
4. Payee information saved for future use
5. Funds deducted from envelope

#### Transfer Processing

1. User selects "Transfer" transaction type
2. Form shows source and destination envelope selection
3. System validates sufficient balance in source envelope
4. Funds moved between envelopes atomically

#### Allocation Processing

1. User selects "Allocation" transaction type or triggered after income entry
2. Form shows available funds and envelope selection
3. Dynamic allocation rows for multiple envelope distributions
4. Funds moved from available bucket to selected envelopes

#### Envelope Management

- **Savings Envelopes**: Progress tracking toward goals with visual indicators
- **Debt Envelopes**: Reverse progress showing paydown with payment scheduling
- **Transfer System**: Integrated into unified transaction system

### 3. User Interface Design

#### Dashboard

- Available funds display prominently
- Envelope overview with balances and progress indicators
- **Quick Action Buttons** for core functionality:
  - Add Income (with allocation prompt)
  - Add Expense (envelope selection)
  - Transfer Funds (between envelopes)
  - Allocate Funds (from available to envelopes)
- Recent transactions preview
- Savings goals and debt paydown progress indicators

#### Responsive Design

- Mobile-first approach using Tailwind CSS
- PWA capabilities for home screen installation
- Touch-friendly interface for mobile devices
- Desktop optimization for larger screens

#### Dynamic Allocation Interface

- Real-time available balance updates
- Dropdown envelope selection
- Amount input with validation
- Add/remove allocation rows dynamically
- Visual feedback for remaining funds

### 4. Technical Implementation Strategy

#### Phase 1: Foundation

- Project setup and configuration
- Database schema design
- Authentication system
- Basic UI framework

#### Phase 2: Core Features

- Income source management
- Category and envelope system
- Basic transaction processing
- Allocation interface

#### Phase 3: Advanced Features

- Savings goal tracking
- Debt management with calculations
- Enhanced UI/UX
- PWA optimization

#### Phase 4: Polish & Deployment

- Testing and validation
- Performance optimization
- Production deployment
- Documentation

### 5. Database Schema Overview

#### Tables Structure

- `users` - User authentication and profiles
- `income_sources` - Income stream definitions
- `categories` - Budget category organization
- `envelopes` - Individual budget envelopes
- `transactions` - All financial transactions
- `allocations` - Income-to-envelope distributions
- `payees` - Saved payee information

#### Key Relationships

- Users → Income Sources (1:many)
- Users → Categories (1:many)
- Categories → Envelopes (1:many)
- Users → Transactions (1:many)
- Envelopes → Transactions (1:many)
- Transactions → Allocations (1:many)

### 6. Security & Data Integrity

#### Authentication

- Supabase Auth for user management
- Row Level Security (RLS) policies
- Secure API endpoints

#### Data Validation

- Client-side and server-side validation
- Balance verification before transactions
- Input sanitization and type checking

### 7. Future Enhancements (Post-MVP)

#### Automation Features

- Automatic allocation rules based on percentages or fixed amounts
- Recurring transaction scheduling
- Smart allocation suggestions

#### Reporting & Analytics

- Transaction history and filtering
- Spending pattern analysis
- Budget vs. actual reporting
- Data export capabilities (CSV/PDF)

#### Advanced Features (Post-MVP)

- Recurring transaction scheduling
- Automatic allocation rules and automation
- Shared budgets for families
- Advanced debt payoff strategies
- Enhanced reporting and analytics

## Success Metrics

- Functional PWA installable on mobile devices
- Responsive design working across all screen sizes
- Complete envelope budgeting workflow
- Real-time balance updates and allocation
- Secure user data management
- Intuitive user experience for financial management

This implementation plan provides a roadmap for building a comprehensive envelope budgeting system that scales from basic functionality to advanced financial management features.
