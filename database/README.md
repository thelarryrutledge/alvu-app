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
2. Future migrations will be numbered sequentially

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

### Row Level Security (RLS)

All tables implement Row Level Security policies:

- Users can only access their own data
- Policies are enforced at the database level
- Automatic profile creation on user signup

### Triggers and Functions

- `handle_new_user()`: Automatically creates user profile on signup
- `update_updated_at_column()`: Automatically updates the updated_at timestamp

## Testing Migrations

After applying migrations, test the schema with:

```bash
node test/test-supabase.js
```

This will verify the database connection and basic operations.