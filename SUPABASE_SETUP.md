# Supabase Setup Guide for Alvu PWA

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization (or create one)
4. Fill in project details:
   - **Name**: `alvu-budget-app`
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users (e.g., US East, Europe West)
   - **Pricing Plan**: Start with Free tier (includes 500MB database, 2GB bandwidth)
5. Click "Create new project"
6. Wait for project initialization (2-3 minutes)

## Step 2: Obtain API Keys

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Project API Keys** → **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Project API Keys** → **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret)

## Step 3: Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Copy from .env.example and fill in your values
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Application Configuration
PUBLIC_APP_NAME=Alvu
PUBLIC_APP_VERSION=0.0.1

# Environment
NODE_ENV=development
```

## Step 4: Set Environment Variables in Vercel

For production deployment:

1. Go to your Vercel dashboard
2. Select your alvu-app project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:
   - `PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `PUBLIC_APP_NAME` = Alvu
   - `PUBLIC_APP_VERSION` = 0.0.1
   - `NODE_ENV` = production

## Step 5: Install Supabase Client

The Supabase JavaScript client will be installed in the next task, but for reference:

```bash
npm install @supabase/supabase-js
```

## Step 6: Verify Setup

After completing the setup:

1. **Test Connection**: The Supabase client should connect successfully
2. **Check Dashboard**: Verify you can access the Supabase dashboard
3. **API Access**: Confirm API keys work with basic queries
4. **Environment Variables**: Ensure all variables are set correctly

## Important Security Notes

- **Never commit** the `.env` file to version control
- **Keep service_role key secret** - only use for server-side operations
- **Use anon key** for client-side operations (it has limited permissions)
- **Enable RLS** (Row Level Security) on all tables for data protection

## Next Steps

After completing this setup:
1. Database schema creation (Task 2)
2. Authentication configuration (Task 3)
3. Supabase client integration in the app

## Troubleshooting

**Common Issues:**
- **Project not loading**: Wait a few more minutes for initialization
- **API keys not working**: Ensure you copied the complete keys
- **Connection errors**: Verify the project URL is correct
- **Environment variables**: Check spelling and ensure no extra spaces

**Support Resources:**
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [SvelteKit + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-sveltekit)