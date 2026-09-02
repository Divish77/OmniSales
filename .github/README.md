# GitHub Actions & Automation

This directory contains all CI/CD and automation configuration for OmniSales.

## Files

### `.github/workflows/`
GitHub Actions workflows that automate testing, building, and deployment.

#### `deploy.yml` - Production Deployment
- **Trigger:** Push to `main` or `develop`, Pull requests
- **Actions:**
  - Install dependencies
  - Run linting
  - Build the project
  - Deploy to Vercel (production on main)
  - Deploy to Vercel (preview on develop/PRs)
  - Post PR comments with preview URLs
  - Archive build artifacts

**Branch behavior:**
- `main` → Production deployment to `omnisales.vercel.app`
- `develop` → Preview deployment
- `feature/*` → Pull request preview deployments

#### `quality.yml` - Code Quality Checks
- **Trigger:** Push to `main`/`develop`, Pull requests
- **Actions:**
  - Test on Node.js 18.x and 20.x
  - ESLint code style checking
  - TypeScript type checking
  - Build verification
  - Bundle size analysis
  - Code coverage upload (optional)

**Purpose:** Ensure code quality before merging to main

#### `security.yml` - Security & Dependencies
- **Trigger:** Weekly schedule (Sunday), package.json changes
- **Actions:**
  - npm audit (moderate security level)
  - Snyk vulnerability scanning (optional)
  - Dependency audit
  - Outdated package detection

**Purpose:** Monitor security vulnerabilities and outdated dependencies

### `.github/dependabot.yml` - Dependency Updates
Automated dependency update management.

**Configuration:**
- npm packages: Weekly updates (Mondays 3 AM)
- GitHub Actions: Weekly updates (Mondays 4 AM)
- Automatic PRs for updates
- Security patches: Immediate

**Features:**
- Creates automatic pull requests for updates
- Groups related updates
- Respects version constraints for critical packages
- Includes commit messages with proper prefixes

## Required Secrets

For automated deployments, add these secrets to GitHub:

```
Settings → Secrets and variables → Actions → New repository secret
```

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `VERCEL_TOKEN` | Vercel automation token | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | vercel.com → Settings → Team Settings |
| `VERCEL_PROJECT_ID` | Vercel project ID | vercel.com → Project → Settings → General |
| `SNYK_TOKEN` | (Optional) Snyk token | snyk.io → Account Settings |

## Deployment Flow

```
Code Push to GitHub
        ↓
GitHub Actions Triggers
        ↓
   ┌────┴────┐
   ↓         ↓
Quality  Deploy
Checks   Workflow
   ↓         ↓
  Pass?   Pass?
   ├─ No → Build Artifacts (stored)
   └─ Yes ↓
      Deploy to Vercel
         ↓
    ✅ Live!
```

## Environment Variables

These should be set in Vercel project settings (not GitHub secrets):

| Variable | Purpose | Value |
|----------|---------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public API key | `eyJhbGc...` |

## Monitoring & Troubleshooting

### View Workflow Status
1. GitHub repo → Actions tab
2. Select workflow from left sidebar
3. Click latest run to see details

### Debug Failed Workflow
1. Click the failed job
2. Expand failed step to see logs
3. Common issues:
   - Missing secrets → Add to GitHub Settings
   - Build errors → Check console output
   - Dependencies → Run `npm ci` locally

### Check Deployment Status
1. Vercel Dashboard → Select project
2. Deployments tab shows all deployments
3. Click deployment to see build logs

### Logs Location
- **GitHub:** GitHub.com/YourOrg/omnisales/actions
- **Vercel:** vercel.com → Select project → Deployments

## Manual Triggers

### Run Workflow Manually
1. Actions tab → Select workflow
2. "Run workflow" button
3. Choose branch
4. Click "Run workflow"

### Check Specific Branch
```bash
git checkout <branch>
git log --oneline -5
```

## Best Practices

✅ Always write meaningful commit messages
✅ Keep pull requests focused and small
✅ Wait for all checks to pass before merging
✅ Review Dependabot PRs for breaking changes
✅ Monitor security alerts regularly
✅ Test locally before pushing

## Configuration

### Build Command
```bash
npm run build
```

### Output Directory
```
dist/
```

### Node Version
```
18.x (tested with 18.x and 20.x)
```

### Package Manager
```
npm (using npm ci for CI/CD)
```

## Customization

### Add New Workflow
1. Create `workflows/name.yml` in this directory
2. Use existing workflows as templates
3. Push to GitHub
4. Workflow runs automatically

### Modify Triggers
Edit the `on:` section in any workflow file:

```yaml
on:
  push:
    branches: [main]  # Change branches here
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Cron schedule
```

### Update Node Version
Edit in all workflows:

```yaml
node-version: '20'  # Change version here
```

## Links

- **GitHub Actions Docs:** https://docs.github.com/actions
- **Vercel Docs:** https://vercel.com/docs
- **Dependabot Docs:** https://docs.github.com/code-security/dependabot

---

**Last Updated:** September 2, 2026
