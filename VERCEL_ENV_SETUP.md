# 🚀 Add Vercel Environment Variables - Step by Step

Your deployment is waiting for these environment variables to be added to Vercel.

---

## 📋 Environment Variables to Add

Copy these exact values:

```
VITE_SUPABASE_URL=https://bnmfhmsidqfqhkvcaqpp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY
```

---

## ✅ STEP-BY-STEP GUIDE

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com
2. Log in to your account
3. Click on your **OmniSales** project

### Step 2: Open Project Settings
1. Click **Settings** (top navigation)
2. Click **Environment Variables** (left sidebar)

### Step 3: Add First Variable (VITE_SUPABASE_URL)
1. Click **"Add New"** button
2. Fill in the form:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://bnmfhmsidqfqhkvcaqpp.supabase.co`
   - **Environments:** Select **All** (Production, Preview, Development)
   - ⚠️ **IMPORTANT:** Make sure "All" is checked, not just Production!
3. Click **Save**

### Step 4: Add Second Variable (VITE_SUPABASE_ANON_KEY)
1. Click **"Add New"** again
2. Fill in the form:
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY`
   - **Environments:** Select **All** (Production, Preview, Development)
   - ⚠️ **IMPORTANT:** Make sure "All" is checked!
3. Click **Save**

### Step 5: Verify Both Variables Are Set
You should now see both in your Environment Variables list:
- ✅ `VITE_SUPABASE_URL` → Production, Preview, Development
- ✅ `VITE_SUPABASE_ANON_KEY` → Production, Preview, Development

---

## 🔄 Redeploy to Vercel

After adding environment variables, you need to redeploy:

### Option A: Manual Redeploy (Fastest)
1. Go to **Deployments** tab
2. Find the most recent deployment (should be from your last push)
3. Click the **...** (three dots)
4. Select **Redeploy**
5. Confirm

### Option B: Push New Commit (Triggers Auto-Deploy)
```bash
git commit --allow-empty -m "Trigger Vercel redeploy with environment variables"
git push origin main
```

---

## ⏳ Wait for Deployment

Once you redeploy:

1. **GitHub Actions:** Shows deploy workflow running
2. **Vercel Dashboard:** Shows "Building..." then "Ready"
3. **Live URL:** https://omnisales.vercel.app comes online

Typically takes 2-3 minutes.

---

## ✅ Verify Deployment Success

Once deployment completes:

1. **Visit:** https://omnisales.vercel.app
2. **Check:** Dashboard page loads
3. **Verify:** KPI cards display data from Supabase
4. **Test:** Filters work correctly
5. **Confirm:** No console errors

---

## 🆘 Troubleshooting

### "Still showing build error"
→ Check that environment variables are set to **All** environments (not just Production)
→ Redeploy after adding variables

### "Page loads but no data"
→ Verify both variables are spelled exactly (case-sensitive)
→ Check Supabase project is active
→ Look at browser console for errors

### "404 on routes"
→ Vercel should handle SPA routing (already configured in vercel.json)
→ Try visiting https://omnisales.vercel.app/dashboard directly

### "Environment variables not showing"
→ Refresh the page
→ Try logging out and back in to Vercel

---

## 📝 Quick Checklist

- [ ] Go to vercel.com
- [ ] Click your OmniSales project
- [ ] Click Settings → Environment Variables
- [ ] Add `VITE_SUPABASE_URL` (select All environments)
- [ ] Add `VITE_SUPABASE_ANON_KEY` (select All environments)
- [ ] Redeploy from Deployments tab
- [ ] Wait 2-3 minutes for build to complete
- [ ] Visit https://omnisales.vercel.app
- [ ] Verify dashboard loads with data

---

## 🎉 You're Done!

Once these variables are set and deployment completes, your OmniSales dashboard will be live at:

**https://omnisales.vercel.app**

---

**Current Status:** Waiting for Vercel environment variables to be added  
**Deployment Status:** Ready once variables are set  
**Estimated Time to Live:** 5 minutes (1 min setup + 2-3 min deploy)
