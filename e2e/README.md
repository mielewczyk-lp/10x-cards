# E2E Tests

This directory contains end-to-end tests using Playwright.

## Structure

```
e2e/
├── fixtures/
│   └── test.ts             # Custom test fixtures (accessibility)
├── helpers/
│   └── FlashcardGenerator.ts # Test helpers
├── pages/
│   └── LoginPage.ts        # Page Object Models
├── global-teardown.ts      # Global teardown (database cleanup)
└── *.spec.ts               # Test files
```

## Database Cleanup

The test suite automatically cleans up test data after all tests complete using Playwright's `globalTeardown` configuration.

### How it works

1. After all tests complete, the `global-teardown.ts` script runs automatically
2. The teardown script deletes all flashcards created by the E2E test user
3. This ensures a clean state for subsequent test runs

### Required Environment Variables

Make sure your `.env.test` file includes:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
E2E_USERNAME_ID=your_test_user_id
E2E_USERNAME=your_test_user_email
E2E_PASSWORD=your_test_user_password
```

The teardown uses `E2E_USERNAME_ID` to identify which flashcards to delete from the database.

**Note:** The global teardown runs automatically after all tests. It cannot be viewed in the Playwright UI like regular tests, but you'll see console output confirming the cleanup.

## Page Object Model

All tests use the Page Object Model pattern for maintainability. Create a new page object for each major page or component:

```typescript
// e2e/pages/ExamplePage.ts
import { Page, Locator } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async goto() {
    await this.page.goto('/example');
  }
}
```

## Writing Tests

Use the custom test fixture for accessibility testing:

```typescript
import { test, expect } from './fixtures/test';
import { LoginPage } from './pages/LoginPage';

test('example test', async ({ page, makeAxeBuilder }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  // Test functionality
  await expect(loginPage.heading).toBeVisible();
  
  // Test accessibility
  const accessibilityResults = await makeAxeBuilder().analyze();
  expect(accessibilityResults.violations).toEqual([]);
});
```

## Running Tests

Make sure the dev server is running before running E2E tests:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

## Tips

- Use `test.only()` to run a single test during development
- Use `test.skip()` to skip tests temporarily
- Use `--debug` flag to step through tests
- Use `--ui` flag for interactive test runner
- Use `page.pause()` to pause execution and inspect the page
