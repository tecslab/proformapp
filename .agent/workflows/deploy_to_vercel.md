---
description: How to deploy the Proformas App to Vercel
---

# Deploy to Vercel

This guide assumes you have a Vercel account and have the project committed to a Git repository (GitHub, GitLab, or Bitbucket).

## 1. Prerequisites
- [x] Application builds successfully (`npm run build`).
- [ ] Project pushed to a remote repository (e.g., GitHub).

## 2. Push to GitHub (If not already done)
If you haven't pushed your code yet:
1. Create a new repository on GitHub.
2. Run these commands in your terminal:
   ```bash
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```

## 3. Configure Vercel Project
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Import your `proformapp` repository from the list.

## 4. Environment Variables
**Crucial Step:** You must copy your local environment variables to Vercel.
1. Expand the **"Environment Variables"** section in the deployment configuration.
2. Add the following keys from your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (Set this to your Vercel URL, e.g., `https://proformapp.vercel.app`, or waiting after first deploy to update it)

## 5. Deploy
1. Click **"Deploy"**.
2. Wait for the build to complete (usually 1-2 minutes).
3. Once deployed, you will get a live URL.

## 6. Post-Deployment Supabase Config
1. Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. Add your new Vercel URL (e.g., `https://your-project.vercel.app`) to the **Site URL** and **Redirect URLs** to ensure Authentication redirect works properly in production.