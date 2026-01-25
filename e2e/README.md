# E2E Tests

This directory contains end-to-end tests using Playwright.

## Structure

```
e2e/
├── fixtures/
│   └── test.ts          # Custom test fixtures (accessibility)
├── pages/
│   └── LoginPage.ts     # Page Object Models
└── *.spec.ts            # Test files
```

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
