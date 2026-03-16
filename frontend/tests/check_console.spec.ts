import { test } from '@playwright/test';

test('check console for errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    page.on('pageerror', error => {
        errors.push(error.message);
    });

    await page.goto('http://localhost:5173', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
        console.error("BROWSER_ERRORS_DETECTED:");
        errors.forEach(e => console.error(e));
    } else {
        console.log("NO_BROWSER_ERRORS_DETECTED");
    }
});
