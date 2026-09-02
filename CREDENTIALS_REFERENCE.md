# 🔑 YOUR OMNISALES CREDENTIALS & SETUP REFERENCE

**Keep this handy during setup!**

---

## ✅ Complete Credentials Reference

### Vercel
```
Project ID: prj_NZmuUViv0d0rudnHtkazAKTlf8xg
Organization: (you have it)
Automation Token: (you need to generate - see below)
Live URL: https://omnisales.vercel.app
```

### Supabase
```
Project URL: https://bnmfhmsidqfqhkvcaqpp.supabase.co
Project Ref: bnmfhmsidqfqhkvcaqpp
Anon Key: sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg
Database Host: db.bnmfhmsidqfqhkvcaqpp.supabase.co
Database User: postgres
Database Port: 5432
```

### GitHub (Your Repository)
```
Repository: omnisales
Secrets needed: 3 (see below)
```

---

## 🚀 EXACT GITHUB SECRETS TO CREATE

Copy-paste these into GitHub Settings → Secrets and variables → Actions

### Secret #1
```
Name: VERCEL_TOKEN
Value: <generate from Vercel Settings → Tokens>
```

### Secret #2
```
Name: VERCEL_ORG_ID
Value: <copy from Vercel Settings → Team Settings>
```

### Secret #3
```
Name: VERCEL_PROJECT_ID
Value: prj_NZmuUViv0d0rudnHtkazAKTlf8xg
```

---

## ⚡ EXACT VERCEL ENVIRONMENT VARIABLES TO CREATE

Copy-paste into Vercel Dashboard → Your Project → Settings → Environment Variables

**Important:** Select **All environments** (Production, Preview, Development) for each variable!

### Variable #1
```
Name: VITE_SUPABASE_URL
Value: https://bnmfhmsidqfqhkvcaqpp.supabase.co
Environments: Production, Preview, Development
```

### Variable #2
```
Name: VITE_SUPABASE_ANON_KEY
Value: sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg
Environments: Production, Preview, Development
```

---

## 📋 YOUR LOCAL .env FILE

Already created. Located in project root:

```
VITE_SUPABASE_URL=https://bnmfhmsidqfqhkvcaqpp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg
```

**Important:** This file is in `.gitignore` - never commits to GitHub

---

## 📝 QUICK REFERENCE FOR COPY-PASTE

### GitHub Secrets (3 total)

```yaml
VERCEL_TOKEN: <get from Vercel>
VERCEL_ORG_ID: <get from Vercel>
VERCEL_PROJECT_ID: prj_NZmuUViv0d0rudnHtkazAKTlf8xg
```

### Vercel Environment Variables (2 total, ALL environments)

```yaml
VITE_SUPABASE_URL: https://bnmfhmsidqfqhkvcaqpp.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY
```

---

## ✅ WHAT YOU STILL NEED TO DO

### From Vercel (2 items)

1. **Generate Automation Token**
   - Go to: vercel.com → Settings → Tokens
   - Click "Create"
   - Name: "OmniSales Automation" (or any name)
   - Type: "Automation Token"
   - Copy the token (long string)
   - **Paste into GitHub secret:** VERCEL_TOKEN

2. **Copy Team/Organization ID**
   - Go to: vercel.com → Settings → Team Settings
   - Copy the Team/Org ID (looks like "team_xxxxxx" or org ID)
   - **Paste into GitHub secret:** VERCEL_ORG_ID

### Complete (already have)

✅ Project ID: `prj_NZmuUViv0d0rudnHtkazAKTlf8xg`  
✅ Supabase URL: `https://bnmfhmsidqfqhkvcaqpp.supabase.co`  
✅ Supabase Anon Key: `sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg`  
✅ Local .env file configured  

---

## 🎯 3-STEP ACTIVATION

### Step 1: GitHub Secrets (3 items)
GitHub repo → Settings → Secrets → Add 3 secrets (see above)

### Step 2: Vercel Environment Variables (2 items)
Vercel Dashboard → Your Project → Settings → Env Vars → Add 2 variables (see above)
**⚠️ Remember: Select ALL environments!**

### Step 3: Push to GitHub
```bash
git add .
git commit -m "Add Supabase credentials and Vercel setup"
git push origin main
```

**Result:** Automatic deployment to https://omnisales.vercel.app

---

## 🔒 SECURITY REMINDER

✅ This file can be committed (no secrets in readable form)  
✅ The actual tokens go in GitHub Secrets (encrypted)  
✅ Never share tokens in messages/emails  
✅ Keep your Vercel automation token private  

---

## 📞 NEED HELP?

- **For Supabase issues:** See SUPABASE_SETUP.md
- **For automation issues:** See AUTOMATION_SETUP.md  
- **For step-by-step guide:** See QUICK_START.md
- **For verification:** See SETUP_CHECKLIST.md

---

## ⏱️ TIME TO LIVE

1. Get Vercel credentials: **5 minutes**
2. Add GitHub secrets: **3 minutes**
3. Add Vercel environment variables: **2 minutes**
4. Push to GitHub: **1 minute**
5. Wait for deployment: **2 minutes**

**Total: ~15 minutes** ✅

---

**Created:** September 2, 2026  
**Status:** ✅ Ready for Final Setup  
**Next Step:** Get Vercel credentials → Add GitHub secrets → Push to GitHub
