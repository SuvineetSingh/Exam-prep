# Testing Documentation

This document explains the testing setup and how to run tests for the Exam Prep Platform.

## Testing Framework

We use the following testing tools:

- **Jest** - JavaScript testing framework
- **React Testing Library** - Testing utilities for React components
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom Jest matchers for DOM

## Test Structure

Tests are organized in `__tests__` folders next to the components they test:

```
components/
├── auth/
│   ├── __tests__/
│   │   ├── loginForm.test.tsx
│   │   └── registerForm.test.tsx
│   ├── loginForm.tsx
│   └── registerForm.tsx
├── dashboard/
│   ├── __tests__/
│   │   ├── StatCard.test.tsx
│   │   └── QuickActions.test.tsx
│   ├── StatCard.tsx
│   └── QuickActions.tsx
...
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test loginForm
```

### Run Tests Matching Pattern
```bash
npm test auth
```

## Test Coverage

Current test coverage includes:

### ✅ Component Tests

1. **Auth Components**
   - `LoginForm` - 10 test cases
   - `RegisterForm` - 10 test cases

2. **Dashboard Components**
   - `StatCard` - 11 test cases
   - `QuickActions` - 7 test cases

3. **Layout Components**
   - `Header` - 11 test cases
   - `Footer` - 12 test cases

4. **UI Components**
   - `Pagination` - 18 test cases
   - `ProfileModal` - 12 test cases

5. **Question Components**
   - `QuestionRow` - 11 test cases
   - `QuestionRowSkeleton` - 3 test cases

### ✅ Hook Tests

1. **useUserStats** - 8 test cases

### ✅ Utility Tests

1. **helpers.ts** - 30+ test cases
   - cn (className merger)
   - formatDate
   - formatTime
   - calculatePercentage
   - truncate
   - shuffleArray
   - isEmpty

2. **userStats queries** - 10 test cases

## Test Patterns

### Component Testing Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from '../Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const mockHandler = jest.fn();
    render(<Component onClick={mockHandler} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### Hook Testing Pattern

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomHook } from '../useCustomHook';

describe('useCustomHook', () => {
  it('returns expected data', async () => {
    const { result } = renderHook(() => useCustomHook());
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Async Testing Pattern

```typescript
it('handles async operations', async () => {
  render(<AsyncComponent />);
  
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

## Mocking

### Mocking Next.js Router

```typescript
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
}));
```

### Mocking Supabase Client

```typescript
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));
```

## Writing New Tests

### 1. Component Tests

When adding a new component, create a test file:

```typescript
// components/myComponent/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(<MyComponent />);
    expect(screen.getByRole('...'))toBeInTheDocument();
  });

  // Add more specific tests
});
```

### 2. Test Checklist

For each component, test:

- ✅ Renders without errors
- ✅ Displays correct content
- ✅ Handles user interactions
- ✅ Shows loading states
- ✅ Displays error states
- ✅ Calls callbacks correctly
- ✅ Applies correct styling
- ✅ Handles edge cases

### 3. Utility Function Tests

```typescript
describe('utilityFunction', () => {
  it('handles normal input', () => {
    expect(utilityFunction('input')).toBe('output');
  });

  it('handles edge cases', () => {
    expect(utilityFunction(null)).toBe(defaultValue);
    expect(utilityFunction('')).toBe(defaultValue);
  });
});
```

## Debugging Tests

### View Test Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- --testNamePattern="test name"
```

### Debug in VS Code
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Continuous Integration

Tests should be run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Coverage Goals

Target coverage metrics:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Best Practices

1. **Keep tests focused** - One test per behavior
2. **Use descriptive names** - Test names should explain what they test
3. **Avoid testing implementation details** - Test user behavior
4. **Mock external dependencies** - Keep tests isolated
5. **Test edge cases** - Empty states, errors, boundaries
6. **Keep tests fast** - Mock network requests
7. **Follow AAA pattern** - Arrange, Act, Assert

## Common Issues

### Issue: Tests timing out
**Solution**: Increase timeout or ensure async operations complete
```typescript
it('test', async () => {
  // code
}, 10000); // 10 second timeout
```

### Issue: State updates not reflected
**Solution**: Use `waitFor` from React Testing Library
```typescript
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### Issue: Mock not working
**Solution**: Ensure mocks are defined before imports
```typescript
jest.mock('./module');
import { Component } from './Component'; // After mock
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Need Help?** Check existing tests for examples or refer to the documentation links above.
