# OmniSales - Vercel Deployment Guide

## Build Status: ✅ SUCCESS

```
✓ 3022 modules transformed
dist/index.html                                    0.50 kB │ gzip:   0.33 kB
dist/assets/index-CmcOW0oK.css                   130.39 kB │ gzip:  19.70 kB
dist/assets/index-CtxUqLgN.js                  1,581.10 kB │ gzip: 477.30 kB
✓ built in 1m 1s
```

---

## Deployment Methods

### Option 1: Deploy via Vercel CLI (Recommended)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy Project
```bash
cd c:\Users\Divish\OmniSales
vercel
```

This will:
- Automatically detect your Vite configuration
- Use the settings from `vercel.json`
- Deploy to Vercel with auto-generated URL
- Set up automatic deployments on git push

#### Step 4: Configure Environment Variables
After deployment, add your Supabase credentials to Vercel:

```bash
vercel env add VITE_SUPABASE_URL
# Paste your Supabase project URL

vercel env add VITE_SUPABASE_ANON_KEY
# Paste your Supabase anon key
```

Or add via Vercel Dashboard:
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add:
   - `VITE_SUPABASE_URL` = your-project-url
   - `VITE_SUPABASE_ANON_KEY` = your-anon-key

#### Step 5: Redeploy
```bash
vercel --prod
```

---

### Option 2: Deploy via GitHub (Recommended for Continuous Deployment)

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

#### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub account
3. Click "Add New..." → "Project"
4. Select your `omnisales` repository
5. Click "Import"

#### Step 3: Configure Project Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `dist` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

#### Step 4: Add Environment Variables
1. Go to Settings → Environment Variables
2. Add the following:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Click "Deploy"

#### Step 5: Enable Auto-Deployments
- Vercel automatically deploys when you push to main
- Pull requests get preview deployments

---

## Current Configuration

### vercel.json
```json
{
  "name": "omnisales-analytics",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Note:** The `rewrites` rule ensures all routes are handled by your React Router (SPA routing).

---

## Environment Variables Required

| Variable | Example | Where to Get |
|----------|---------|--------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase Dashboard → Settings → API |

---

## Post-Deployment Checklist

- [ ] Build completes successfully
- [ ] Environment variables are set
- [ ] Homepage loads without errors
- [ ] Navigation works (Dashboard, Analytics, etc.)
- [ ] Filters load data from Supabase
- [ ] Currency converter works
- [ ] Charts render correctly
- [ ] Mobile responsive design works
- [ ] Dark mode toggle works

---

## Performance Optimization Notes

### Current Bundle Size
- JS: 1,581.10 kB (477.30 kB gzipped)
- CSS: 130.39 kB (19.70 kB gzipped)

### Recommendations for Production
1. **Code Splitting:** Split Recharts and other heavy libraries
2. **Image Optimization:** Use WebP format for charts
3. **Lazy Loading:** Implement route-based code splitting
4. **Caching:** Vercel automatically caches static assets

### Next Steps (Optional)
- Enable Edge Caching in Vercel Settings
- Set up Vercel Analytics for monitoring
- Configure custom domain (if needed)
- Set up preview deployments for pull requests

---

## Troubleshooting

### Issue: Build fails on Vercel
**Solution:**
1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set
3. Run `npm install` locally to check dependencies
4. Check for TypeScript errors: `npx tsc --noEmit`

### Issue: Routes return 404
**Solution:**
- The `rewrites` rule in `vercel.json` should handle this
- Verify `vercel.json` is in root directory

### Issue: Supabase queries fail
**Solution:**
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
2. Check Supabase RLS policies allow anonymous access
3. Verify CORS is configured in Supabase settings

### Issue: Charts don't render
**Solution:**
1. Check browser console for errors
2. Verify data is fetching from Supabase
3. Ensure Recharts components receive correct data structure

---

## Quick Deploy Command (CLI)

```bash
cd c:\Users\Divish\OmniSales
vercel --prod --env VITE_SUPABASE_URL=your-url --env VITE_SUPABASE_ANON_KEY=your-key
```

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vite.dev/
- **React Router:** https://reactrouter.com/
- **Supabase:** https://supabase.com/docs

---

**Status:** Ready for Production Deployment ✅  
**Date:** September 2, 2026
