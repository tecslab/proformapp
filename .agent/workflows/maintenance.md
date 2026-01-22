---
description: Best practices for maintaining and updating your Vercel deployment
---

# Project Maintenance & Updates

Since you have connected Vercel to your Git repository, you have set up **Continuous Deployment**. Vercel automatically watches your repository for changes.

## 1. How to Update Production
The simplest way to update your live site is to push changes to your default branch (usually `main`).

```bash
# 1. Make changes locally
# 2. Commit your changes
git add .
git commit -m "Description of changes"

# 3. Push to main
git push origin main
```
**Result**: Vercel detects the new commit on `main`, builds the project, and updates the production URL automatically.

## 2. Using Preview Deployments (Best Practice)
To test changes *before* they go live to your customers:

1.  **Create a new branch**:
    ```bash
    git checkout -b feature/new-color-scheme
    ```
2.  **Make changes and push**:
    ```bash
    git add .
    git commit -m "Update colors"
    git push origin feature/new-color-scheme
    ```
3.  **Check Vercel**:
    - Vercel will create a unique **Preview URL** (e.g., `proformapp-git-feature-new-color-scheme.vercel.app`) for this branch.
    - You can share this URL or test it yourself.
4.  **Merge**:
    - If everything looks good, merge the branch into `main` (via GitHub Pull Request or locally).
    - Vercel will then update production.

## 3. When to use Vercel Dashboard
You typically **do not** need to touch the Vercel dashboard for code updates. Use it only for:
-   **Environment Variables**: If you add a new API key or change database credentials, you must update them in Vercel Settings -> Environment Variables and *redeploy*.
-   **Logs**: To view server-side logs (e.g., errors in Server Actions) via the "Logs" tab.
-   **Rollbacks**: If a bad deployment breaks the site, you can instantly "Promote" a previous working deployment from the dashboard.
