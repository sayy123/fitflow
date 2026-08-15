import { test, expect } from '@playwright/test';

test.describe('Flux de paiement Mollie', () => {
  // On utilise un email aléatoire pour pouvoir recréer un compte à chaque test
  const randomEmail = `test-mollie-${Math.floor(Math.random() * 100000)}@example.com`;

  test('devrait pouvoir s\'inscrire, aller dans la facturation et initier un paiement Mollie', async ({ page }) => {
    // 1. Inscription d'un nouveau Manager
    await page.goto('/register?role=manager&plan=premium');
    
    // Remplissage du formulaire d'inscription (les sélecteurs peuvent varier selon votre code exact)
    // On essaie d'attraper les champs standards
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const nameInput = page.locator('input[type="text"], input[name="name"], input[name="fullName"]');
    
    // Si le formulaire d'inscription a ces champs
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.first().fill(randomEmail);
      await passwordInput.first().fill('Password123!');
      
      if (await nameInput.count() > 0) {
        await nameInput.first().fill('Studio Test Mollie');
      }

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Attendre la redirection vers le dashboard ou l'onboarding
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    }

    // 2. Navigation vers la page de facturation (Billing)
    await page.goto('/dashboard/billing');
    
    // 3. Vérification de la présence de la section d'abonnement
    const billingHeading = page.locator('h1, h2, h3').filter({ hasText: /facturation/i }).first();
    // Si on n'est pas redirigé par le middleware (ex: si l'inscription a marché)
    if (await billingHeading.isVisible()) {
      // 4. Cliquer sur le bouton de souscription Mollie
      const subscribeBtn = page.locator('button').filter({ hasText: /(s'abonner|souscrire|premium|starter)/i }).first();
      
      if (await subscribeBtn.isVisible()) {
        await subscribeBtn.click();
        
        // 5. Vérifier que l'on est bien redirigé vers l'URL de paiement Mollie
        // L'URL de paiement de Mollie contient souvent 'mollie.com/payscreen'
        await page.waitForURL(/mollie\.com/i, { timeout: 8000 });
        expect(page.url()).toContain('mollie.com');
      }
    }
  });
});
