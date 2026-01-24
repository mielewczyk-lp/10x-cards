# Unit Tests

This directory contains test utilities and mocks for unit testing.

## Structure

```
src/test/
├── setup.ts           # Vitest setup (runs before all tests)
└── mocks/
    ├── handlers.ts    # MSW request handlers
    ├── server.ts      # MSW server instance
    └── setup.ts       # MSW setup (import in tests that need it)
```

## Test Location

Unit tests should be co-located with the code they test:

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx    # ✓ Co-located with component
├── lib/
│   ├── utils.ts
│   └── utils.test.ts          # ✓ Co-located with utility
└── test/                      # ✗ Don't put tests here
```

## Writing Tests

### Basic Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing with User Interactions

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('handles clicks', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Mocking API Calls

If your test needs to mock API calls, import the MSW setup:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import '@/test/mocks/setup'; // Import MSW setup
import { MyComponent } from './MyComponent';

describe('MyComponent with API', () => {
  it('fetches and displays data', async () => {
    // Override default handler for this test
    server.use(
      http.get('/api/data', () => {
        return HttpResponse.json({ message: 'Test data' });
      })
    );

    render(<MyComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test data')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Test user behavior, not implementation**
   - ✓ `screen.getByRole('button', { name: 'Submit' })`
   - ✗ `container.querySelector('.submit-btn')`

2. **Use descriptive test names**
   - ✓ `it('shows error message when email is invalid')`
   - ✗ `it('test 1')`

3. **Follow Arrange-Act-Assert pattern**
   ```typescript
   it('example', () => {
     // Arrange
     const user = userEvent.setup();
     render(<Component />);
     
     // Act
     await user.click(screen.getByRole('button'));
     
     // Assert
     expect(screen.getByText('Success')).toBeVisible();
   });
   ```

4. **Keep tests isolated**
   - Don't rely on test execution order
   - Clean up after each test (handled automatically)
   - Don't share state between tests

5. **Mock external dependencies**
   - Use MSW for API calls
   - Use `vi.fn()` for callbacks
   - Use `vi.mock()` for modules
