# Database Migrations

This directory contains SQL migration files for the Alvu PWA database schema.

## Migration Files

- `001_create_users_table.sql` - Creates the users table with RLS policies

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
4. Future migrations will be numbered sequentially

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

## Testing Migrations

After applying migrations, test the schema with:

```bash
node test/test-supabase.js
```

This will verify the database connection and basic operations.