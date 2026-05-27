# Kiosk POS Testing Guide

This project uses a multi-layered testing strategy to ensure reliability and performance.

## Testing Layers

1. **Unit Tests (Vitest)**: Testing business logic, stores, and utility functions.
2. **Component Tests (Vitest + RTL)**: Testing individual UI components in isolation.
3. **Integration Tests (Vitest + RTL)**: Testing interactions between components and stores (e.g., POS Checkout flow).
4. **E2E Tests (Playwright)**: Testing full user journeys in real browsers.

## Running Tests

### Unit, Component, and Integration Tests
```bash
npm run test:unit        # Run all unit/component tests once
npm run test:unit:watch  # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### E2E Tests
```bash
npx playwright install  # First-time setup
npm run test:e2e        # Run all E2E tests
npx playwright show-report # View report
```

## Writing Tests

- Place unit tests in `__tests__/unit`
- Place component tests in `__tests__/components`
- Place integration tests in `__tests__/integration`
- Place E2E tests in `e2e/`
- Use `__tests__/mocks/data.ts` for consistent test data.

## Continuous Integration
GitHub Actions automatically runs type checks, linting, unit tests, and E2E tests on every push to the `main` branch.
