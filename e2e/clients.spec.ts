import { test, expect } from '@playwright/test';

test.describe('Clients', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByLabel('Email').fill('tester@proformapp.com');
        await page.getByLabel('Password').fill('Pruebas2026--');
        await page.getByRole('button', { name: /logging in|login/i }).click();
        await page.waitForURL(/.*\/dashboard/);
    });

    test('should create a new client', async ({ page }) => {
        await page.goto('/dashboard/clients');

        // Navigate to create client page
        // The button text is "Add Client"
        await page.getByRole('link', { name: 'Add Client' }).click();

        const uniqueId = Date.now().toString();
        // Fill form
        await page.getByLabel('First Name').fill('Test');
        await page.getByLabel('Last Name').fill('Client');
        await page.getByLabel('Cédula / RUC').fill(uniqueId.substring(0, 10)); // Use 10 digits
        await page.getByLabel('Email').fill(`test${uniqueId}@example.com`);
        await page.getByLabel('Phone').fill('0991234567');
        await page.getByLabel('Address').fill('123 Test St');

        await page.getByRole('button', { name: /create client/i }).click();

        // Verify success
        // Toast might be skipped due to server-side redirect, so focus on navigation and data presence
        await expect(page).toHaveURL(/.*\/dashboard\/clients/);

        // Verify client in list
        await expect(page.getByText(`test${uniqueId}@example.com`)).toBeVisible();
    });
});
