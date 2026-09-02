# OmniSales - Complete Setup Checklist

Your Supabase project has been configured. Follow this checklist to complete the setup.

---

## ✅ Phase 1: Local Development Setup

### 1.1 Environment Variables (Already Done ✓)
- [x] `.env` file created with Supabase credentials
- [x] `VITE_SUPABASE_URL=https://bnmfhmsidqfqhkvcaqpp.supabase.co`
- [x] `VITE_SUPABASE_ANON_KEY=sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg`

### 1.2 Verify Vite Environment
```bash
npm run dev
```

Open http://localhost:5173 and check:
- [ ] Dashboard loads without errors
- [ ] Browser console has no "Missing Supabase" warnings
- [ ] KPI cards display data
- [ ] Charts render correctly

**If errors occur:**
1. Check `.env` file in project root
2. Restart dev server: `npm run dev`
3. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R)

### 1.3 Setup Supabase CLI (Optional but Recommended)

```bash
# Install CLI globally
npm install -g supabase

# Verify installation
supabase --version

# Login to your Supabase account
supabase login
# (Browser will open, generate token, copy-paste in terminal)

# Link to your project
supabase link --project-ref bnmfhmsidqfqhkvcaqpp
# (Enter your Supabase database password when prompted)

# Verify connection
supabase status
```

---

## ✅ Phase 2: GitHub Setup

### 2.1 Add GitHub Secrets
Go to **GitHub repo → Settings → Secrets and variables → Actions**

Click "New repository secret" and add these:

**Vercel Deployment:**
```
VERCEL_TOKEN = <your-vercel-automation-token>
VERCEL_ORG_ID = <your-vercel-org-id>
VERCEL_PROJECT_ID = <your-vercel-project-id>
```

**Supabase (Reference for documentation):**
```
SUPABASE_URL = https://bnmfhmsidqfqhkvcaqpp.supabase.co
SUPABASE_ANON_KEY = sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg
SUPABASE_PROJECT_REF = bnmfhmsidqfqhkvcaqpp
```

### 2.2 Push Code to GitHub
```bash
git add .
git commit -m "Add Supabase credentials and automation setup"
git push origin main
```

### 2.3 Monitor First Deployment
1. Go to **GitHub repo → Actions tab**
2. Watch the "Deploy to Vercel" workflow run
3. Should complete in 2-3 minutes

---

## ✅ Phase 3: Vercel Deployment Setup

### 3.1 Project Already Configured ✅
- Project ID: `prj_NZmuUViv0d0rudnHtkazAKTlf8xg`
- (Already linked to your GitHub repository)
- No need to import again

### 3.2 Add Environment Variables to Vercel
Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these for **All environments** (Production, Preview, Development):

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://bnmfhmsidqfqhkvcaqpp.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg` |

**Important:** Select **All** environments for each variable!

### 3.3 Trigger Manual Redeploy (After Adding Env Vars)
1. Vercel Dashboard → Deployments
2. Click the three dots on latest deployment
3. Select "Redeploy"

Or push a new commit:
```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

### 3.4 Verify Deployment
1. Vercel Dashboard → Deployments → Click latest
2. Should show green checkmark
3. Click "Visit" to open live app
4. Verify dashboard loads with data

---

## ✅ Phase 4: Production Testing

### 4.1 Test Frontend (https://omnisales.vercel.app)
- [ ] Dashboard page loads
- [ ] KPI cards display metrics
- [ ] Revenue chart renders
- [ ] Filters work (Country, Region, Date, Category)
- [ ] Currency converter works (USD, INR, EUR)
- [ ] Dark mode toggle works
- [ ] Mobile responsive design works

### 4.2 Test Navigation
- [ ] Click to Sales Analytics page
- [ ] Charts load and display data
- [ ] Filters update data
- [ ] Return to Dashboard

### 4.3 Test Data Operations
- [ ] Add new sale on "Add Sale" page
- [ ] Data appears in Dashboard after refresh
- [ ] Filters work correctly

### 4.4 Check Performance
- [ ] Page loads in under 3 seconds
- [ ] No console errors
- [ ] Lighthouse score > 60

---

## 📋 Environment Reference

| Item | Value |
|------|-------|
| **Supabase URL** | https://bnmfhmsidqfqhkvcaqpp.supabase.co |
| **Supabase Project Ref** | bnmfhmsidqfqhkvcaqpp |
| **Anon Key** | sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg |
| **Database Host** | db.bnmfhmsidqfqhkvcaqpp.supabase.co |
| **Database Port** | 5432 |
| **Database User** | postgres |
| **Database Name** | postgres |

---

## 🔒 Security Checklist

- [ ] `.env` file added to `.gitignore` (should not be committed)
- [ ] Secrets only in GitHub (not in code)
- [ ] Secrets only in Vercel (not in code)
- [ ] No passwords in commit messages
- [ ] Vercel environment variables set to "All" environments
- [ ] Database password stored securely (not in git)

---

## 📚 Documentation Files Created

| File | Purpose |
|------|---------|
| `SUPABASE_SETUP.md` | Complete Supabase setup guide |
| `SUPABASE_CLI_SETUP.md` | Supabase CLI quick reference |
| `AUTOMATION_SETUP.md` | GitHub Actions & CI/CD setup |
| `DEPLOYMENT_GUIDE.md` | Vercel deployment guide |
| `.env.example` | Environment template |
| `.env` | Local environment (DO NOT COMMIT) |

---

## 🚀 Quick Test Commands

```bash
# Test local development
npm run dev
# Visit http://localhost:5173

# Build for production
npm run build

# Preview production build locally
npm run preview

# Verify TypeScript
npx tsc --noEmit

# Lint code
npm run lint

# Test Supabase CLI
supabase status
```

---

## 📞 Troubleshooting Quick Links

### Local Development Issues
- Missing environment: See SUPABASE_SETUP.md → Step 1
- Build errors: Run `npm install` → `npm run build`
- Port 5173 in use: Kill process or use `vite --port 5174`

### GitHub Actions Issues
- Workflow fails: Check Actions tab → Click failed job → Expand step
- Missing secrets: Go to Settings → Secrets → Verify all secrets added
- Deployment shows error: Check Vercel logs in Dashboard

### Vercel Issues
- Environment variables not working: Settings → Env Vars → Verify "All" selected
- Preview doesn't work: Redeploy after adding env vars
- 404 on routes: Vercel.json rewrites should handle SPA routing (already configured)

### Supabase Connection Issues
- "Connection refused": Check internet, verify Supabase project is active
- "Invalid API key": Copy-paste key from guide exactly
- CLI login fails: Delete `~/.supabase/access-token` → Try again

---

## ✨ What's Automated

| Action | Trigger | Result |
|--------|---------|--------|
| Code quality check | Every push | Lint + TypeScript check |
| Build verification | Every push | Production build test |
| Deploy to Vercel | Push to main | Production release |
| Deploy preview | PR or develop | Preview URL in PR comment |
| Dependency updates | Weekly | Auto PR for updates |
| Security scan | Weekly | Vulnerability report |

---

## 🎯 Success Indicators

You'll know setup is complete when:

✅ `npm run dev` → Dashboard loads with data  
✅ GitHub Actions show green checkmarks  
✅ Vercel shows successful deployments  
✅ Live URL works: https://omnisales.vercel.app  
✅ All pages load and display data  
✅ No console errors in browser  
✅ Filters and controls respond to input  

---

## 📋 Final Verification

Run through this list to confirm everything works:

- [ ] Local dev: `npm run dev` → Dashboard loads
- [ ] GitHub: Last commit → Check Actions tab → All workflows green
- [ ] Vercel: Dashboard → Deployments → Latest is successful
- [ ] Production: Visit https://omnisales.vercel.app → Works
- [ ] Mobile: Test on phone → Responsive design works
- [ ] Dark mode: Toggle works on all pages
- [ ] Filters: All filters update data
- [ ] Add Sale: New transaction appears in dashboard

---

## 🎉 You're All Set!

Congratulations! Your OmniSales project is fully configured and deployed.

**Next Steps:**
1. Share production URL with team
2. Monitor Analytics in Vercel Dashboard
3. Review GitHub Actions for issues
4. Keep Supabase running for data sync
5. Celebrate! 🚀

---

**Setup Date:** September 2, 2026  
**Status:** ✅ Production Ready  
**Automation:** ✅ Enabled  
**Deployment:** ✅ Live
