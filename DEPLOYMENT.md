# Deployment Guide - Render + Supabase

This guide will help you deploy EduTrack to Render with a Supabase PostgreSQL database.

## Prerequisites

- GitHub account with your code pushed to a repository
- Render account (free tier available)
- Supabase account (free tier available)

## Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: edutrack
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose a region close to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)
6. Go to Project Settings → Database
7. Copy the **Connection String** (it will look like:`postgresql://postgres:[password]@[host]:5432/postgres`)

## Step 2: Push Code to GitHub

1. Initialize git if not already done:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub
3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/edutrack.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to [render.com](https://render.com) and sign up/log in
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Review the configuration and click "Apply"

### Option B: Manual Setup

#### Backend Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: edutrack-api
   - **Environment**: Docker
   - **Docker Context**: `.`
   - **Dockerfile Path**: `./Dockerfile`
   - **Branch**: `main`
4. Add Environment Variables:
   - `DATABASE_URL`: (from Supabase connection string)
   - `PORT`: `3001`
   - `AUTH_SECRET`: (generate a random string)
   - `NODE_ENV`: `production`
5. Click "Create Web Service"

#### Database

1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: edutrack-db
   - **Database**: edutrack
   - **User**: edutrack_user
3. Click "Create Database"
4. Copy the internal connection string from Render
5. Update your backend service's `DATABASE_URL` environment variable

#### Frontend Service

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: edutrack-frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://edutrack-backend-0tfo.onrender.com`
   - `VITE_TELEGRAM_LINK`: `https://t.me/ysngr33`
5. Click "Create Static Site"

## Step 4: Run Database Migrations

After the backend is deployed:

1. Go to your backend service on Render
2. Click "Shell" (if available) or use Render CLI
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

Alternatively, add a health check endpoint that runs migrations on startup.

## Step 5: Verify Deployment

1. Check your backend service logs on Render
2. Visit your frontend URL
3. Test the application by:
   - Signing up a new user
   - Creating a class
   - Adding students

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | Secret for JWT token signing | `random-secret-string` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `VITE_API_BASE_URL` | Backend host (no `/api` suffix — code appends it) | `https://edutrack-backend-0tfo.onrender.com` |
| `VITE_TELEGRAM_LINK` | Telegram contact link | `https://t.me/ysngr33` |

## Troubleshooting

### Backend fails to start
- Check Render logs for errors
- Verify `DATABASE_URL` is correct
- Ensure Prisma client is generated

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` is correct
- Check CORS configuration in backend
- Ensure backend is running

### Database connection issues
- Verify Supabase project is active
- Check connection string format
- Ensure database allows external connections

## Local Development with Supabase

To use Supabase locally:

1. Update your local `.env`:
   ```
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   ```

2. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Cost Summary (Free Tier)

- **Render**: Free tier includes:
  - 1 web service (with spin-up time)
  - 1 static site
  - 1 PostgreSQL database (90 days free, then $7/month)

- **Supabase**: Free tier includes:
  - 500MB database storage
  - 1GB bandwidth
  - 2 API requests per second

## Next Steps

- Set up custom domain (optional)
- Configure email service for receipts (optional)
- Set up monitoring and alerts
- Enable SSL certificates (automatic on Render)
