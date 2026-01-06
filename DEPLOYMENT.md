# Deployment Guide

## Current Setup ✅

The ZatannaYC monorepo is now fully configured and deployed:

### Frontend (Vercel)
- **Project**: zatanna-yc
- **URL**: https://zatanna-yc.vercel.app (or your custom domain)
- **Auto-deploys**: On push to `master` branch
- **Location**: `/frontend` directory
- **Environment Variables Set**:
  - `NEXT_PUBLIC_API_BASE_URL=https://sgapi.zatanna.ai`
  - `NEXT_PUBLIC_YC_CASE_SESSION_ID=396f85a7-3e58-4076-9f87-32ddd9f24ee8`

### Backend (Local/Development)
- **Port**: 3001
- **Location**: `/backend` directory
- **Status**: Running locally, ready to deploy

## Vercel Deployment

### Automatic Deployment
Every push to `master` triggers a new deployment:

```bash
git add .
git commit -m "Your changes"
git push origin master
```

Vercel will:
1. Detect changes
2. Run `cd frontend && npm install`
3. Run `cd frontend && npm run build`
4. Deploy the `/frontend/.next` directory

### Manual Deployment (if needed)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from root directory
vercel --prod
```

### Vercel Configuration

The `vercel.json` at root configures the monorepo:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs",
  "devCommand": "cd frontend && npm run dev",
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "https://sgapi.zatanna.ai"
  }
}
```

## Backend Deployment (Optional - for dedicated backend)

Currently, the frontend uses `sgapi.zatanna.ai` (the monorepo backend). If you want to deploy the ZatannaYC backend separately:

### Option 1: Railway
```bash
cd backend
railway init
railway up
```

### Option 2: Fly.io
```bash
cd backend
fly launch
fly deploy
```

### Option 3: Heroku
```bash
cd backend
heroku create zatanna-yc-backend
git subtree push --prefix backend heroku master
```

After deploying backend, update Vercel environment variable:
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
```

## Environment Variables

### Frontend (Vercel Dashboard)
Set these in Vercel project settings:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://sgapi.zatanna.ai` | Yes |
| `NEXT_PUBLIC_YC_CASE_SESSION_ID` | `396f85a7-3e58-4076-9f87-32ddd9f24ee8` | Yes |

### Backend (Railway/Fly.io)
Set these in your hosting platform:

| Variable | Value | Required |
|----------|-------|----------|
| `PORT` | `3001` | No (auto-set) |
| `DB_HOST` | RDS endpoint | Yes |
| `DB_PORT` | `5432` | Yes |
| `DB_USER` | Database user | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `DB_NAME` | `zatanna` | Yes |
| `AWS_ACCESS_KEY_ID` | S3 access key | Optional |
| `AWS_SECRET_ACCESS_KEY` | S3 secret | Optional |
| `YC_ORGANIZATION_ID` | `78e0a525-cc65-44c1-be05-93bb55247fde` | Yes |
| `YC_CASE_SESSION_ID` | `396f85a7-3e58-4076-9f87-32ddd9f24ee8` | Optional |

## Testing Deployment

### Check Frontend
```bash
# Production URL
curl https://zatanna-yc.vercel.app

# Or your custom domain
curl https://your-domain.com
```

### Check Backend (if deployed)
```bash
# Health check
curl https://your-backend.railway.app/health

# Dashboard stats
curl "https://your-backend.railway.app/api/v1/yc-dashboard/stats?limit=5"
```

## Troubleshooting

### Frontend Build Fails
1. Check Vercel build logs
2. Verify `frontend/package.json` is correct
3. Test locally: `cd frontend && npm run build`

### API Calls Failing
1. Check `NEXT_PUBLIC_API_BASE_URL` is set in Vercel
2. Verify backend is running: `curl $API_BASE_URL/health`
3. Check CORS is enabled in backend

### Environment Variables Not Working
1. Ensure variables start with `NEXT_PUBLIC_` for client-side access
2. Redeploy after changing environment variables
3. Check Vercel dashboard for correct values

## Rollback

### Rollback Frontend
In Vercel dashboard:
1. Go to Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

### Rollback Code
```bash
# Revert to previous commit
git revert HEAD
git push origin master

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin master --force
```

## Monitoring

### Vercel Analytics
- View in Vercel dashboard
- Real-time deployment status
- Build logs and errors

### Backend Logs (if deployed)
```bash
# Railway
railway logs

# Fly.io
fly logs

# Heroku
heroku logs --tail
```

## Current Status

✅ **Frontend**: Deployed on Vercel (auto-deploy enabled)
✅ **Backend**: Available at sgapi.zatanna.ai
✅ **Database**: Connected to production PostgreSQL
✅ **S3**: Data cloned to s3://zatanna-yc-data
✅ **Git**: All changes pushed to master

## Next Deploy

Just push your changes:
```bash
git add .
git commit -m "Your feature"
git push origin master
```

Vercel will automatically deploy in ~2 minutes!
