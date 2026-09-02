#!/bin/bash

# OmniSales - Automated Deployment Quick Setup
# Run this script to help with initial configuration

echo "🚀 OmniSales Automated Deployment Setup"
echo "========================================"
echo ""

# Check if git is initialized
if [ -d .git ]; then
    echo "✅ Git repository found"
else
    echo "❌ No git repository. Run: git init"
    exit 1
fi

# Check if .github/workflows exists
if [ -d .github/workflows ]; then
    echo "✅ GitHub Actions workflows configured"
    echo "   - deploy.yml (auto-deploy to Vercel)"
    echo "   - quality.yml (code quality checks)"
    echo "   - security.yml (security scanning)"
else
    echo "❌ GitHub Actions workflows not found"
    exit 1
fi

# Check .vercelignore
if [ -f .vercelignore ]; then
    echo "✅ .vercelignore configured"
else
    echo "❌ .vercelignore not found"
    exit 1
fi

echo ""
echo "📋 NEXT STEPS:"
echo "============="
echo ""
echo "1. GET VERCEL CREDENTIALS:"
echo "   - Go to https://vercel.com"
echo "   - Import this GitHub repository"
echo "   - Copy Project ID from Settings → General"
echo "   - Create Automation Token in Settings → Tokens"
echo "   - Get Team/Org ID from Settings → Team Settings"
echo ""
echo "2. ADD GITHUB SECRETS:"
echo "   - Go to GitHub repo Settings → Secrets and variables → Actions"
echo "   - Add VERCEL_TOKEN"
echo "   - Add VERCEL_ORG_ID"
echo "   - Add VERCEL_PROJECT_ID"
echo ""
echo "3. ADD ENVIRONMENT VARIABLES TO VERCEL:"
echo "   - Go to Vercel project Settings → Environment Variables"
echo "   - Add VITE_SUPABASE_URL"
echo "   - Add VITE_SUPABASE_ANON_KEY"
echo ""
echo "4. PUSH TO GITHUB:"
echo "   - git add ."
echo "   - git commit -m 'Setup automated deployment'"
echo "   - git push origin main"
echo ""
echo "5. MONITOR DEPLOYMENT:"
echo "   - GitHub repo → Actions tab"
echo "   - Watch the 'Deploy to Vercel' workflow"
echo "   - Check Vercel Dashboard for live URL"
echo ""
echo "📚 Documentation:"
echo "   - See AUTOMATION_SETUP.md for detailed setup"
echo "   - See DEPLOYMENT_GUIDE.md for manual deployment"
echo ""
echo "✅ Automation Ready!"
