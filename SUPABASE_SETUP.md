# Supabase Configuration for OmniSales

## Project Details

- **Project Name:** OmniSales Analytics
- **Project URL:** https://bnmfhmsidqfqhkvcaqpp.supabase.co
- **Project Ref:** bnmfhmsidqfqhkvcaqpp
- **Region:** (default Supabase region)

---

## Credentials

### For Frontend (Vite Application)

These are the credentials you need to add to your `.env` file and Vercel:

```
VITE_SUPABASE_URL=https://bnmfhmsidqfqhkvcaqpp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg
```

### For Database (CLI & Direct Access)

Connection string for direct database access:

```
postgresql://postgres:[YOUR-PASSWORD]@db.bnmfhmsidqfqhkvcaqpp.supabase.co:5432/postgres
```

**Note:** Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

---

## Local Setup

### Step 1: Create `.env` File

```bash
cp .env.example .env
```

Edit `.env` and add:

```
VITE_SUPABASE_URL=https://bnmfhmsidqfqhkvcaqpp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg
SUPABASE_DB_PASSWORD=<your-actual-db-password>
```

### Step 2: Install Supabase CLI

```bash
npm install -g supabase
```

Or with Homebrew (macOS/Linux):

```bash
brew install supabase/tap/supabase
```

### Step 3: Authenticate with Supabase

```bash
supabase login
```

This will open a browser to generate an access token. Copy the token and paste it in the terminal.

### Step 4: Initialize Supabase (Optional)

```bash
supabase init
```

This creates a `supabase/` directory structure locally.

### Step 5: Link to Your Project

```bash
supabase link --project-ref bnmfhmsidqfqhkvcaqpp
```

When prompted, enter your database password:

```
Enter your database password: [paste your Supabase DB password]
```

### Step 6: Verify Connection

```bash
supabase status
```

You should see:

```
Supabase local development setup is complete.
...
API URL: https://bnmfhmsidqfqhkvcaqpp.supabase.co
...
```

---

## Production Deployment Setup

### Step 1: Add to GitHub Secrets

Go to **GitHub repo → Settings → Secrets and variables → Actions**

Add these secrets:

```
Name: SUPABASE_URL
Value: https://bnmfhmsidqfqhkvcaqpp.supabase.co

Name: SUPABASE_ANON_KEY
Value: sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg

Name: SUPABASE_PROJECT_REF
Value: bnmfhmsidqfqhkvcaqpp

Name: SUPABASE_DB_PASSWORD
Value: <your-actual-db-password>
```

### Step 2: Add to Vercel Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these for all environments (Production, Preview, Development):

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://bnmfhmsidqfqhkvcaqpp.supabase.co` | All |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg` | All |

---

## CLI Commands Reference

### Initialize Local Development

```bash
supabase start
```

Starts local Supabase stack with Docker.

### Stop Local Development

```bash
supabase stop
```

### View Project Status

```bash
supabase status
```

### Pull Latest Migrations

```bash
supabase db pull
```

Pulls the latest schema from the production database.

### Push Local Changes

```bash
supabase db push
```

Pushes local migrations to production.

### Create New Migration

```bash
supabase migration new <migration_name>
```

### View Logs

```bash
supabase logs
```

### View Database

```bash
supabase db url
```

Shows the database connection string.

---

## Common Tasks

### Connect in Your App

Already configured in `src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Add Environment Variables to React

Use `VITE_` prefix for Vite to expose to frontend:

```typescript
const url = import.meta.env.VITE_SUPABASE_URL; // ✅ Works
const key = import.meta.env.VITE_SUPABASE_ANON_KEY; // ✅ Works
const password = import.meta.env.SUPABASE_DB_PASSWORD; // ❌ Won't work
```

### Test Connection

```bash
npm run dev
```

Open browser console. If you see warnings about missing environment variables, the `.env` file isn't loading.

**Solution:**

1. Restart dev server: `npm run dev`
2. Check `.env` file exists in project root
3. Verify values are correct (no extra spaces)

---

## Database Migrations

All migrations are in `supabase/migrations/`:

```
supabase/migrations/
├── 20260322_initial_schema.sql
├── 20260322_agents_migration.sql
├── 20260322_sql_forecast.sql
├── 20260330_add_advanced_filters.sql
├── 20260412_sales_analytics_filters.sql
├── 20260414_analytics_insights_engine.sql
├── 20260414_forecast_engine.sql
├── 20260414_multi_tenancy_functions.sql
├── 20260414_multi_tenancy_rls.sql
├── 20260414_native_ai_insights_engine.sql
├── 20260414160000_fix_harmonized_sales_rls.sql
└── 20260901_date_range_filter.sql
```

To apply migrations:

```bash
supabase db push
```

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:**
1. Check `.env` file exists in project root
2. Verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart dev server: `npm run dev`
4. Hard refresh browser: Ctrl+Shift+Delete

### Issue: "Connection refused" in browser

**Solution:**
1. Check internet connection
2. Verify Supabase project URL is correct
3. Check if Supabase project is paused (vercel.com → Supabase)
4. Try from Supabase dashboard directly

### Issue: "Invalid API key"

**Solution:**
1. Double-check the key matches exactly (copy-paste recommended)
2. Verify no extra spaces or line breaks
3. Check if key was regenerated in Supabase Settings
4. Update in `.env` and Vercel

### Issue: "Migrations failed to apply"

**Solution:**
1. Check database password is correct
2. Verify database connection: `supabase db url`
3. Check for schema conflicts in Supabase dashboard
4. Review migration SQL for syntax errors

### Issue: "CLI login fails"

**Solution:**
1. Delete `~/.supabase/access-token` file
2. Run `supabase login` again
3. Generate new access token from supabase.com → Account → Access Tokens
4. Make sure token is copied completely

---

## Security Best Practices

✅ **Do:**
- Use `.env` for local development
- Add `.env` to `.gitignore` (already done)
- Store passwords in GitHub Secrets, not in code
- Use Vercel environment variables for production
- Rotate database password periodically
- Keep access tokens in `~/.supabase/` (local only)

❌ **Don't:**
- Commit `.env` file to GitHub
- Hardcode secrets in code
- Share passwords in messages/emails
- Use same password for multiple projects
- Leave database accessible without RLS policies

---

## Project Statistics

| Item | Count |
|------|-------|
| Migrations | 12 |
| Tables | 8+ (check dashboard) |
| Functions | Multiple |
| RLS Policies | Enabled |
| Real-time | Enabled |

---

## Next Steps

1. ✅ Create `.env` file locally
2. ✅ Test connection: `npm run dev`
3. ✅ Set up CLI: `supabase login` + `supabase link --project-ref bnmfhmsidqfqhkvcaqpp`
4. ✅ Add secrets to GitHub
5. ✅ Add environment variables to Vercel
6. ✅ Push to GitHub to trigger deployment
7. ✅ Check Vercel logs if needed

---

## Documentation Links

- **Supabase Docs:** https://supabase.com/docs
- **Supabase CLI:** https://supabase.com/docs/reference/cli
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Project Dashboard:** https://app.supabase.com/projects/bnmfhmsidqfqhkvcaqpp

---

**Status:** ✅ Ready for Setup  
**Date:** September 2, 2026  
**Project Ref:** bnmfhmsidqfqhkvcaqpp
