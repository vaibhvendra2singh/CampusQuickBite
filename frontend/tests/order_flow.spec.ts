import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// ─── STUBS ───────────────────────────────────────────────────────────────────
async function stubOrderFlow(page: Page) {
    // 1. Auth Login
    await page.route('**/api/v1/auth/login', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                message: 'Login successful',
                token: 'mock-jwt.header.payload',
                user: {
                    id: 'student-1',
                    name: 'Test Student',
                    email: 'student@campus.edu',
                    role: 'STUDENT'
                }
            }),
        });
    });

    // 2. Outlets
    await page.route('**/api/v1/outlets', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: [
                    { id: 'outlet-1', name: 'Chai Junction', location: 'Block A', is_open: true, rating: 4.5, image_url: null },
                    { id: 'outlet-2', name: 'Pizza Hut Campus', location: 'Block C', is_open: true, rating: 4.2, image_url: null },
                ]
            }),
        });
    });

    // 3. Menu for Outlet
    await page.route('**/api/v1/menu/outlet-1', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: [
                    { id: 'item-1', outlet_id: 'outlet-1', name: 'Masala Chai', price: 20.0, availability: true },
                    { id: 'item-2', outlet_id: 'outlet-1', name: 'Samosa', price: 15.0, availability: true },
                ]
            }),
        });
    });

    // 4. Create Order
    await page.route('**/api/v1/orders', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'Order placed',
                    data: { id: 'order-123', status: 'pending', total_amount: 35.0 }
                })
            });
        }
    });

    // 5. User Profile/State
    await page.route('**/api/v1/auth/me', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: { id: 'student-1', name: 'Test Student', role: 'student' }
            })
        });
    });
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

test.describe('Student Order Flow', () => {
    test.beforeEach(async ({ page }) => {
        await stubOrderFlow(page);
    });

    test('should allow student to login and view outlets', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Fill login
        await page.fill('input[type="email"]', 'student@campus.edu');
        await page.fill('input[type="password"]', 'SecurePass123');
        await page.fill('input[placeholder*="enrollment" i]', 'E2026123456');
        await page.click('button[type="submit"]');

        // Should land on home/outlets
        await expect(page.locator('text=Chai Junction')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Pizza Hut Campus')).toBeVisible();
    });

    test('should allow student to add items to cart and place order', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Login first
        await page.fill('input[type="email"]', 'student@campus.edu');
        await page.fill('input[type="password"]', 'SecurePass123');
        await page.fill('input[placeholder*="enrollment" i]', 'E2026123456');
        await page.click('button[type="submit"]');

        // Click on outlet
        await page.click('text=Chai Junction');

        // Should see menu
        await expect(page.locator('text=Masala Chai')).toBeVisible({ timeout: 10000 });
        
        // Add item (assumes there's an "add" button or [+] icon)
        // Adjusting selector for common UI patterns
        const addButton = page.locator('button:has-text("Add"), button:has-text("+")').first();
        await addButton.click();

        // Click cart / checkout
        const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Cart")').first();
        await checkoutButton.click();

        // Verify we are on checkout
        await expect(page.locator('text=Checkout')).toBeVisible();
        await expect(page.locator('text=Masala Chai')).toBeVisible();

        // Click place order
        const placeOrderButton = page.locator('button:has-text("Place Order"), button:has-text("Confirm Connection")').first();
        await placeOrderButton.click();

        // Should show success or redirect to order list
        await expect(page.locator('text=Order placed')).toBeVisible({ timeout: 10000 });
    });
});
