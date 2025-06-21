# Database Migrations

This directory contains SQL migration files for the Alvu PWA database schema.

## Migration Files

- `001_create_users_table.sql` - Creates the users table with RLS policies
- `002_create_income_sources_table.sql` - Creates income sources table with frequency enum
- `003_create_categories_table.sql` - Creates categories table with default categories
- `004_create_envelopes_table.sql` - Creates envelopes table with type enum (regular, savings, debt)
- `005_create_transactions_table.sql` - Creates transactions table with type enum (income, expense, transfer, allocation)
- `006_create_allocations_table.sql` - Creates allocations table for income distribution rules
- `007_create_payees_table.sql` - Creates payees table for saved payee information

## How to Apply Migrations

### Using Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file
4. Execute the SQL commands in order (001, 002, etc.)

**Note**: You may see a warning about "destructive operations" due to the `DROP TRIGGER IF EXISTS` statement. This is expected and safe - it ensures the trigger can be recreated if it already exists.

### Using Supabase CLI (Alternative)

If you have the Supabase CLI installed:

```bash
# Apply a specific migration
supabase db reset --db-url "your-database-url"

# Or apply migrations manually
psql "your-database-url" -f database/migrations/001_create_users_table.sql
```

## Migration Order

Migrations must be applied in numerical order:

1. `001_create_users_table.sql` - Base users table
2. `002_create_income_sources_table.sql` - Income sources with frequency enum
3. `003_create_categories_table.sql` - Categories with default categories
4. `004_create_envelopes_table.sql` - Envelopes with type enum (regular, savings, debt)
5. `005_create_transactions_table.sql` - Transactions with type enum (income, expense, transfer, allocation)
6. `006_create_allocations_table.sql` - Allocations for income distribution rules
7. `007_create_payees_table.sql` - Payees for saved payee information
8. Future migrations will be numbered sequentially

## Database Schema Overview

### Users Table

The `users` table extends Supabase Auth with additional profile information:

- **id**: UUID (references auth.users.id)
- **email**: User's email address
- **first_name**: Optional first name
- **last_name**: Optional last name
- **display_name**: Display name (defaults to email)
- **avatar_url**: Optional profile picture URL
- **timezone**: User's timezone (default: UTC)
- **currency**: User's preferred currency (default: USD)
- **date_format**: User's preferred date format (default: MM/DD/YYYY)
- **created_at**: Timestamp of profile creation
- **updated_at**: Timestamp of last profile update

### Income Sources Table

The `income_sources` table manages multiple income streams for users:

- **id**: UUID primary key
- **user_id**: References users table
- **name**: Income source name (e.g., "Main Job", "Freelance")
- **amount**: Income amount (decimal with 2 decimal places)
- **frequency**: Enum (weekly, bi-weekly, semi-monthly, monthly, custom)
- **custom_frequency_days**: Days for custom frequency (required when frequency = 'custom')
- **is_active**: Whether the income source is currently active
- **description**: Optional description
- **next_expected_date**: Automatically calculated next income date
- **created_at/updated_at**: Timestamps

### Categories Table

The `categories` table manages envelope categories with three default categories:

- **id**: UUID primary key
- **user_id**: References users table
- **name**: Category name (unique per user)
- **color**: Hex color code for UI display (validated format)
- **icon**: Optional icon name/class for UI
- **description**: Optional category description
- **is_default**: Whether this is a default system category
- **sort_order**: Order for displaying categories
- **created_at/updated_at**: Timestamps

#### Default Categories

Three categories are automatically created for new users:
1. **Unassigned** (#6B7280) - Default category for unassigned envelopes
2. **Savings** (#10B981) - Category for savings goals and emergency funds
3. **Debt** (#EF4444) - Category for debt payments and loan management

### Envelopes Table

The `envelopes` table manages budget envelopes with three distinct types:

- **id**: UUID primary key
- **user_id**: References users table
- **category_id**: References categories table
- **name**: Envelope name (unique per user)
- **type**: Enum (regular, savings, debt)
- **balance**: Current envelope balance (decimal with 2 decimal places)
- **target_amount**: Target amount for savings envelopes (required for savings type)
- **target_date**: Optional target date for savings goals
- **apr**: Annual percentage rate for debt envelopes (required for debt type)
- **minimum_payment**: Minimum payment amount for debt envelopes
- **created_at/updated_at**: Timestamps

#### Envelope Types

1. **Regular** - Standard budget envelopes with positive balances
2. **Savings** - Goal-oriented envelopes with target amounts and dates
3. **Debt** - Debt tracking envelopes with negative balances and APR calculations

#### Type-Specific Constraints

- **Regular envelopes**: Balance must be >= 0, no APR or minimum payment
- **Savings envelopes**: Must have target_amount, balance >= 0
- **Debt envelopes**: Balance must be <= 0, must have APR

### Transactions Table

The `transactions` table manages all financial transactions with four distinct types:

- **id**: UUID primary key
- **user_id**: References users table
- **envelope_id**: References envelopes table (for expense and allocation transactions)
- **type**: Enum (income, expense, transfer, allocation)
- **amount**: Transaction amount (decimal with 2 decimal places, must be positive)
- **description**: Transaction description (required, non-empty)
- **payee**: Optional payee name for expense transactions
- **date**: Transaction date (defaults to current date)
- **created_at/updated_at**: Timestamps
- **source_envelope_id**: Source envelope for transfer transactions
- **destination_envelope_id**: Destination envelope for transfer transactions
- **income_source_id**: Income source reference for income transactions

#### Transaction Types

1. **Income** - Money coming in from income sources (goes to available funds)
2. **Expense** - Money spent from envelopes (reduces envelope balance)
3. **Transfer** - Money moved between envelopes (reduces source, increases destination)
4. **Allocation** - Money allocated from available funds to envelopes

#### Type-Specific Constraints

- **Income transactions**: Must have income_source_id, no envelope references
- **Expense transactions**: Must have envelope_id, no other references
- **Transfer transactions**: Must have both source_envelope_id and destination_envelope_id (different)
- **Allocation transactions**: Must have envelope_id, no other references

### Allocations Table

The `allocations` table manages allocation rules for distributing income to envelopes:

- **id**: UUID primary key
- **user_id**: References users table
- **envelope_id**: References envelopes table (destination for allocation)
- **income_source_id**: Optional reference to specific income source
- **amount**: Fixed allocation amount (for non-percentage allocations)
- **percentage**: Percentage of income to allocate (for percentage allocations)
- **is_percentage**: Whether this allocation uses percentage or fixed amount
- **is_automatic**: Whether allocation should be processed automatically
- **priority**: Priority order for automatic allocations (higher = first)
- **description**: Optional description for the allocation rule
- **created_at/updated_at**: Timestamps

#### Allocation Types

1. **Fixed Amount** - Allocate a specific dollar amount to envelope
2. **Percentage** - Allocate a percentage of income to envelope
3. **Automatic** - Process allocation automatically when income is received
4. **Manual** - Require user confirmation before processing

### Payees Table

The `payees` table manages saved payee information for quick expense entry:

- **id**: UUID primary key
- **user_id**: References users table
- **name**: Payee name (unique per user)
- **category**: Optional category for grouping payees
- **default_envelope_id**: Optional default envelope for expenses to this payee
- **default_amount**: Optional default amount for expenses to this payee
- **notes**: Optional notes about the payee
- **is_favorite**: Whether payee is marked as favorite
- **last_used_at**: Timestamp of last use
- **usage_count**: Number of times payee has been used
- **created_at/updated_at**: Timestamps

#### Payee Features

1. **Auto-completion** - Suggest payees based on partial name matches
2. **Usage tracking** - Track frequency and recency of payee usage
3. **Smart defaults** - Remember default envelope and amount for each payee
4. **Categories** - Group payees by category for better organization
5. **Favorites** - Mark frequently used payees as favorites

### Row Level Security (RLS)

All tables implement Row Level Security policies:

- Users can only access their own data
- Policies are enforced at the database level
- Automatic profile creation on user signup

### Triggers and Functions

- `handle_new_user()`: Automatically creates user profile and default categories on signup
- `update_updated_at_column()`: Automatically updates the updated_at timestamp
- `calculate_next_income_date()`: Calculates next expected income date based on frequency
- `set_next_income_date()`: Automatically sets next_expected_date on insert/update
- `create_default_categories()`: Creates the three default categories for a user
- `get_category_stats()`: Returns category statistics with envelope counts and balances
- `reorder_categories()`: Updates sort order for multiple categories
- `get_envelope_summary()`: Returns envelope summary grouped by type with counts and totals
- `get_available_funds()`: Returns total available funds (sum of positive envelope balances)
- `get_total_debt()`: Returns total debt amount (absolute value of negative debt balances)
- `calculate_savings_progress()`: Calculates savings goal progress percentage
- `calculate_debt_progress()`: Calculates debt payoff progress percentage
- `process_income_transaction()`: Processes income transactions and updates available funds
- `process_expense_transaction()`: Processes expense transactions with balance validation
- `process_transfer_transaction()`: Processes transfers between envelopes with balance updates
- `process_allocation_transaction()`: Processes allocation from available funds to envelopes
- `get_transaction_summary()`: Returns transaction summary by type with date filtering
- `calculate_allocation_amount()`: Calculates allocation amount based on percentage or fixed amount
- `get_allocation_rules()`: Returns allocation rules for a user or specific income source
- `process_automatic_allocations()`: Processes automatic allocations when income is received
- `validate_allocation_percentages()`: Validates that allocation percentages don't exceed 100%
- `get_or_create_payee()`: Gets existing payee or creates new one with usage tracking
- `get_payee_suggestions()`: Returns payee suggestions based on search term and usage
- `get_payees_by_category()`: Returns payees grouped by category
- `update_payee_usage()`: Updates payee usage statistics
- `merge_payees()`: Merges two payees and updates transaction references
- `cleanup_unused_payees()`: Removes unused payees older than specified days

## Testing Migrations

After applying migrations, test the schema with:

```bash
node test/test-supabase.js
```

This will verify the database connection and basic operations.