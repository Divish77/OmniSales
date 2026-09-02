# OmniSales - Automated Deployment Setup

## ✅ Automation Configured

Your project now has **GitHub Actions CI/CD** set up with automatic deployments to Vercel.

---

## Workflows Created

### 1. **Deploy Workflow** (`.github/workflows/deploy.yml`)
**Triggers:** Push to `main` or `develop` branches, Pull requests

**Actions:**
- ✓ Checkout code
- ✓ Setup Node.js 18
- ✓ Install dependencies with npm ci
- ✓ Run ESLint
- ✓ Build project with Vite
- ✓ **Deploy to Vercel (Production on main)**
- ✓ **Deploy to Vercel (Preview on develop/PRs)**
- ✓ Post PR comment with preview URL
- ✓ Upload build artifacts (5-day retention)

### 2. **Code Quality Workflow** (`.github/workflows/quality.yml`)
**Triggers:** Push to `main`/`develop`, Pull requests

**Actions:**
- ✓ Run on Node.js 18.x and 20.x
- ✓ Install dependencies
- ✓ ESLint checks
- ✓ TypeScript type checking
- ✓ Build verification
- ✓ Bundle size analysis
- ✓ Coverage upload (optional)

### 3. **Security Workflow** (`.github/workflows/security.yml`)
**Triggers:** Weekly schedule, package.json changes

**Actions:**
- ✓ npm audit (moderate level)
- ✓ Snyk security scanning (optional)
- ✓ Dependency audit
- ✓ Outdated package detection

---

## Setup Instructions

### Step 1: Get Vercel Credentials

Go to [vercel.com](https://vercel.com):

1. **Project Already Imported** ✅
   - Project ID: `prj_NZmuUViv0d0rudnHtkazAKTlf8xg`
   - (Already linked to your GitHub repository)

2. **Get Token**
   - Go to Settings → Tokens
   - Create new "Automation Token" (never expires)
   - Copy the token

3. **Get Organization ID**
   - Go to Settings → Team Settings
   - Copy the **Team/Organization ID**

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret" for each:

**Required Vercel Secrets:**
```
Name: VERCEL_TOKEN
Value: <paste your Vercel automation token>

Name: VERCEL_ORG_ID
Value: <paste your Vercel organization ID>

Name: VERCEL_PROJECT_ID
Value: prj_NZmuUViv0d0rudnHtkazAKTlf8xg
```

**Required Supabase Secrets:**
```
Name: VITE_SUPABASE_URL
Value: https://bnmfhmsidqfqhkvcaqpp.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg

Name: SUPABASE_PROJECT_REF
Value: bnmfhmsidqfqhkvcaqpp
```

**Optional Security:**
```
Name: SNYK_TOKEN
Value: <your Snyk token from snyk.io>
```

### Step 3: Add Environment Variables to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Select your OmniSales project
3. Settings → Environment Variables
4. Add the following for **All environments** (Production, Preview, Development):

| Variable | Value | 
|----------|-------|
| `VITE_SUPABASE_URL` | `https://bnmfhmsidqfqhkvcaqpp.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_8WBaxLJ3Uz0r2Q6w7JiuUA_ZsrpqyQg` |

### Step 4: Test the Automation

```bash
# Make a small change to trigger the workflow
echo "# Test" >> README.md
git add README.md
git commit -m "Trigger deployment workflow"
git push origin main
```

Then watch the workflow run:
- Go to your GitHub repo → Actions tab
- Click the latest workflow
- Watch the deployment progress in real-time

---

## Deployment Flow

```
┌─────────────────────────────────────┐
│  Developer pushes code to GitHub    │
└────────────────┬────────────────────┘
                 │
        ┌────────▼─────────┐
        │ GitHub Actions   │
        │ Workflow Starts  │
        └────────┬─────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
 Install    Build & Lint   Type Check
 Deps       Project        (TypeScript)
    │            │            │
    └────────────┼────────────┘
                 │
        ┌────────▼──────────┐
        │  Check Branch     │
        └────────┬──────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼ main                    ▼ develop/PR
 Production             Preview Deployment
 Deployment
    │                         │
    └────────────┬────────────┘
                 │
        ┌────────▼──────────┐
        │   Build Artifacts │
        │  (5-day store)    │
        └───────────────────┘
```

---

## Branch Strategy

| Branch | Behavior | Environment |
|--------|----------|-------------|
| `main` | Auto-deploys to production | `omnisales.vercel.app` |
| `develop` | Auto-deploys to preview | `omnisales-develop.vercel.app` |
| `feature/*` | Preview on PR | `omnisales-pr-123.vercel.app` |

---

## Files Added

- `.github/workflows/deploy.yml` - Main deployment workflow
- `.github/workflows/quality.yml` - Code quality checks
- `.github/workflows/security.yml` - Security scanning
- `.vercelignore` - Files to exclude from Vercel deployment
- `AUTOMATION_SETUP.md` - This file

---

## Common Tasks

### Manually Trigger Deployment

Go to Actions tab → Deploy workflow → Run workflow → Select branch

### Check Deployment Status

1. **GitHub Actions:** Repo → Actions → See workflow status
2. **Vercel Dashboard:** vercel.com → Select project → Deployments tab
3. **Real-time logs:** Click running workflow in Actions

### View Build Artifacts

Actions → Click workflow run → Artifacts section → Download "build-dist"

### Rollback to Previous Deployment

1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click three dots → Promote to Production

### Disable Auto-Deploy

1. GitHub repo → Settings → Branch protection rules
2. Edit main branch protection
3. Uncheck "Require status checks to pass"

---

## Monitoring & Alerts

### GitHub Actions Notifications
- ✓ Enabled by default
- Notify on workflow failure
- Check email for summaries

### Vercel Analytics (Optional)
1. Vercel Dashboard → Analytics
2. Monitor performance metrics
3. Set up alerts for slowdowns

### Bundle Size Monitoring
Check workflow logs → "Check bundle size" step for:
- JavaScript size (gzipped)
- CSS size (gzipped)
- Asset count

Current sizes:
```
JS:  1,581.10 kB (477.30 kB gzipped)
CSS: 130.39 kB (19.70 kB gzipped)
```

---

## Troubleshooting

### Workflow Fails: "Vercel token invalid"
- [ ] Check VERCEL_TOKEN secret is set correctly
- [ ] Generate new token if needed
- [ ] Update GitHub secret

### Workflow Fails: "Project ID not found"
- [ ] Verify VERCEL_PROJECT_ID is correct
- [ ] Check it matches your Vercel project

### Build fails with "Missing dependencies"
- [ ] Delete node_modules locally
- [ ] Run `npm ci` instead of `npm install`
- [ ] Push `package-lock.json` to GitHub

### Environment variables not working
- [ ] Verify variables are set in Vercel Settings
- [ ] Check they're enabled for the right environments
- [ ] Redeploy manually after adding variables

### PR previews not generating
- [ ] Check that VERCEL_ORG_ID is set
- [ ] Verify GitHub Actions is enabled in repo settings
- [ ] Check Vercel account has available preview deployments

---

## Security Best Practices

✅ Use GitHub Secrets (not hardcoded in YAML)
✅ Use Vercel automation tokens (not personal access tokens)
✅ Regularly audit npm dependencies
✅ Enable branch protection on main
✅ Require status checks before merge

---

## Next Steps

1. **Push to GitHub** to trigger first deployment
2. **Monitor Actions tab** during build
3. **Check Vercel Dashboard** for live URL
4. **Share preview URL** with team
5. **Set up alerts** in GitHub + Vercel

---

## Quick Reference

```bash
# View workflow status locally
git log --oneline --graph --all

# View latest 10 commits
git log --oneline -10

# Force push after workflow (careful!)
git push --force-with-lease origin main

# Check if .gitignore is blocking CI
git check-ignore -v .env
```

---

**Status:** ✅ Ready for Automated Deployment  
**Date:** September 2, 2026  
**Framework:** Vite + React  
**Deployment Platform:** Vercel  
**CI/CD Platform:** GitHub Actions
