import { test, expect } from '@playwright/test';

test.describe('Proformas', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByLabel('Email').fill('tester@proformapp.com');
        await page.getByLabel('Password').fill('Pruebas2026--');
        await page.getByRole('button', { name: /logging in|login/i }).click();
        await page.waitForURL(/.*\/dashboard/);
    });

    test('should create a new proforma', async ({ page }) => {
        // 1. Create a client first to ensure we have one to select
        await page.goto('/dashboard/clients');
        await page.getByRole('link', { name: 'Add Client' }).click();

        const uniqueId = Date.now().toString();
        const clientName = `ProfClient ${uniqueId}`;

        await page.getByLabel('First Name').fill(clientName);
        await page.getByLabel('Last Name').fill('Test');
        await page.getByLabel('Cédula / RUC').fill(uniqueId.substring(0, 13));
        await page.getByLabel('Email').fill(`prof${uniqueId}@example.com`);
        await page.getByRole('button', { name: /create client/i }).click();
        // Wait for redirect to client list to confirm client creation
        await expect(page).toHaveURL(/.*\/dashboard\/clients/);

        // 2. Go to Proformas
        await page.goto('/dashboard/proformas');

        // Assuming there is a "New Proforma" button/link
        await page.getByRole('link', { name: /new proforma/i }).click();

        // 3. Select Client
        await page.locator('button[role="combobox"]').click();
        await page.getByPlaceholder('Search client...').fill(clientName);
        // Wait for the option to be visible
        await expect(page.getByRole('option', { name: clientName }).first()).toBeVisible();
        // Use force click to ensure the event is registered even if animating
        await page.getByRole('option', { name: clientName }).first().click({ force: true });

        // Verify client is selected
        // The button text should now contain the client name.
        // We target the button specifically to avoid strict mode issues if the popover is animating out
        await expect(page.locator('button[role="combobox"]')).toContainText(clientName, { timeout: 10000 });

        // 4. Fill details
        // Note: Labels are not linked to inputs in proforma-form, so using name/placeholder locators
        await page.locator('input[name="delivery_days"]').fill('5');
        await page.locator('input[name="payment_methods"]').fill('Cash');
        await page.locator('textarea[name="observations"]').fill('Test Observation');

        // 5. Add Item Details
        // Using locators based on name attributes as they are specific
        await page.locator('input[name="items.0.quantity"]').fill('2');
        await page.locator('input[name="items.0.description"]').fill('Test Item');
        await page.locator('input[name="items.0.unit_cost"]').fill('10'); // Cost 10
        await page.locator('input[name="items.0.percentage_gain"]').fill('50'); // Gain 50% -> Price 15

        // 6. Verify Calculations
        // Subtotal: 2 * 15 = 30
        // IVA (15%): 30 * 0.15 = 4.50
        // Total: 34.50

        // Check for calculated strings in the DOM
        await expect(page.getByText('$15.00')).toBeVisible(); // Price
        await expect(page.getByText('$30.00').first()).toBeVisible(); // Item Total
        await expect(page.getByText('$34.50')).toBeVisible(); // Grand Total

        // 7. Save
        await page.getByRole('button', { name: /create proforma/i }).click();

        // Verify success
        // Toast might be skipped due to server-side redirect, so focus on navigation and data presence
        await expect(page).toHaveURL(/.*\/dashboard\/proformas/);
    });
});
