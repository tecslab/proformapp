import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should allow user to log in', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('tester@proformapp.com');
        await page.getByLabel('Password').fill('Pruebas2026--');
        await page.getByRole('button', { name: /logging in|login/i }).click();

        // Expect to be redirected to dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);
    });
});
