const { test, expect } = require('@playwright/test');

// Optional but recommended: This runs before every single test, 
// saving you from writing page.goto('/') every time!
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('messenger homepage loads successfully', async ({ page }) => {
  await expect(page).toHaveTitle(/Massanger/);
  await expect(page.locator('#hello_text')).toContainText('Welcome to Web Massanger');
});

test('user can register a new account', async ({ page }) => {
  const username = `testuser_${Date.now()}`;
  const password = 'testpassword123';

  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);

  // Playwright naturally waits for the button to be visible and clickable.
  // Using getByRole is the most "human-like" way to find a button.
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Verify we're still on the homepage
  await expect(page).toHaveTitle(/Massanger/);
});

test('user can login with existing credentials', async ({ page }) => {
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('admin');

  // Standard human click. Playwright checks actionability first.
  await page.getByRole('button', { name: 'SignIn' }).click();

  // Wait for the URL to change, proving navigation worked
  await page.waitForURL('/user/**');

  // Verify the user dashboard loaded
  await expect(page.locator('#burger')).toBeVisible();
  await expect(page.locator('#user_chat')).toBeVisible();
  await expect(page.locator('span', { hasText: 'Massages' })).toBeVisible();
});

test('user cannot login with incorrect password', async ({ page }) => {
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('wrongpassword');

  await page.getByRole('button', { name: 'SignIn' }).click();

  // Verify we didn't go anywhere
  await expect(page).toHaveTitle(/Massanger/);
  await expect(page.locator('#hello_text')).toContainText('Welcome to Web Massanger');
  
  // Pro-tip: If your app shows an error message (like "Invalid password"), 
  // you should assert that it appears here!
});

test('user cannot login with non-existent username', async ({ page }) => {
  await page.locator('#username').fill('nonexistentuser');
  await page.locator('#password').fill('somepassword');

  await page.getByRole('button', { name: 'SignIn' }).click();

  await expect(page).toHaveTitle(/Massanger/);
  await expect(page.locator('#hello_text')).toContainText('Welcome to Web Massanger');
});

test('newly registered user can login immediately', async ({ page }) => {
  const newUsername = `user_${Date.now()}`;
  const newPassword = 'securepass123';

  // --- Registration Phase ---
  await page.locator('#username').fill(newUsername);
  await page.locator('#password').fill(newPassword);
  
  // Set up a "listener" to wait for your backend to finish processing the registration.
  // Note: Replace '**/register' with your actual server endpoint for registration if it's different!
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/register') && response.status() === 200
  );
  
  await page.getByRole('button', { name: 'Create Account' }).click();
  
  // Now we wait for the server to reply before moving on
  await responsePromise;

  // --- Login Phase ---
  await page.locator('#username').clear();
  await page.locator('#password').clear();

  await page.locator('#username').fill(newUsername);
  await page.locator('#password').fill(newPassword);
  await page.getByRole('button', { name: 'SignIn' }).click();

  await page.waitForURL('/user/**');
  await expect(page.locator('#burger')).toBeVisible();
});