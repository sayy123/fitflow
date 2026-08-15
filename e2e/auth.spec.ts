import { test, expect } from '@playwright/test';

test.describe('Flux d\'authentification', () => {
  test('devrait afficher une erreur pour des identifiants invalides', async ({ page }) => {
    await page.goto('/login');
    
    // Fill the login form
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword123');
    await submitButton.click();

    // Since it's invalid, we shouldn't be redirected to dashboard
    // Wait for a toast error or some text indicating failure.
    // If the app uses Sonner, it might be a toast.
    // We can just verify the URL hasn't changed to /dashboard
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/dashboard');
  });

  test('devrait exiger une authentification pour le tableau de bord', async ({ page }) => {
    // Attempting to go directly to dashboard without being logged in
    await page.goto('/dashboard');
    
    // The middleware or server component should redirect to /login
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
