# Supabase CLI Setup for OmniSales

Quick reference for setting up Supabase CLI and linking to your production project.

## Prerequisites

- Node.js 18+ installed
- Supabase project created (✅ Already created: `bnmfhmsidqfqhkvcaqpp`)
- Database password from Supabase

## Quick Setup (3 Steps)

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### Step 2: Authenticate

```bash
supabase login
```

This opens a browser to generate an access token. Copy the token and paste into the terminal.

### Step 3: Link Your Project

```bash
supabase link --project-ref bnmfhmsidqfqhkvcaqpp
```

When prompted, enter your Supabase database password (from Supabase dashboard).

## Verify Setup

Check connection status:

```bash
supabase status
```

Expected output:
```
Supabase local development setup is complete.

API URL: https://bnmfhmsidqfqhkvcaqpp.supabase.co
GraphQL URL: https://bnmfhmsidqfqhkvcaqpp.supabase.co/graphql/v1
S3 URL: https://bnmfhmsidqfqhkvcaqpp.supabase.co/storage/v1/s3
Postgres connection string: postgresql://...@...
```

## Local Development (Optional)

To run Supabase locally:

```bash
supabase start
```

Stop local development:

```bash
supabase stop
```

## Common Commands

```bash
# Check project status
supabase status

# View database connection string
supabase db url

# Pull latest schema from production
supabase db pull

# Push local migrations to production
supabase db push

# View logs
supabase logs

# List all migrations
supabase migration list
```

## Environment Setup

### Create Local `.env` File

```bash
cp .env.example .env
```

Add to `.env`:

```
VITE_SUPABASE_URL=https://bnmfhmsidqfqhkvcaqpp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg
```

### Verify Connection

```bash
npm run dev
```

Open browser console. Should NOT see warnings about missing Supabase variables.

Test connection:
- Open Dashboard page
- Should load KPI data from Supabase
- Charts should display data

## Troubleshooting

### "Connection refused"
- Check internet connection
- Verify Supabase project is active
- Check `.env` file has correct URL

### "Invalid API key"
- Copy-paste key from this guide exactly
- No extra spaces or line breaks
- Key matches: `sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg`

### "Database password incorrect"
- Get password from Supabase dashboard: Settings → Database
- Reset password if forgotten
- Try again with new password

### "CLI login not working"
- Delete `~/.supabase/access-token`
- Run `supabase login` again
- Check if access token was revoked

## Next Steps

1. ✅ Install CLI: `supabase --version`
2. ✅ Login: `supabase login`
3. ✅ Link project: `supabase link --project-ref bnmfhmsidqfqhkvcaqpp`
4. ✅ Verify: `supabase status`
5. ✅ Create `.env` file from `.env.example`
6. ✅ Start dev: `npm run dev`
7. ✅ Test dashboard loads data

## Project Reference

- **Project URL:** https://bnmfhmsidqfqhkvcaqpp.supabase.co
- **Project Ref:** bnmfhmsidqfqhkvcaqpp
- **Region:** (default)
- **Database:** PostgreSQL

## Documentation

- **Supabase CLI Docs:** https://supabase.com/docs/reference/cli
- **Supabase Project:** https://app.supabase.com/projects/bnmfhmsidqfqhkvcaqpp
- **OmniSales Setup:** See SUPABASE_SETUP.md for detailed guide

---

**Ready to go!** 🚀
