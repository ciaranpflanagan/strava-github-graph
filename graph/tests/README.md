# End-to-End Tests with Playwright

This directory contains end-to-end tests for the Strava Commits React application using Playwright.

## Test Files

- **`app.spec.js`** - Basic application functionality tests
  - Homepage loading and title verification
  - Strava login button visibility and functionality
  - Options controls (sport type and year selectors)
  - Responsive design elements

- **`graph.spec.js`** - Activity graph visualization tests
  - Empty graph state
  - Graph rendering with mock data
  - Username display when data is loaded
  - Loading states and error handling
  - Graph updates when options change

- **`accessibility.spec.js`** - Accessibility and responsiveness tests
  - Proper accessibility attributes
  - Keyboard navigation
  - Mobile and tablet viewport compatibility
  - Form interactions
  - Color contrast and styling
  - Focus states

## Running the Tests

### Prerequisites

1. Make sure you have installed all dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers (if not already done):
   ```bash
   npx playwright install
   ```

### Test Commands

- **Run all tests (headless):**
  ```bash
  npm run test:e2e
  ```

- **Run tests with UI mode (interactive):**
  ```bash
  npm run test:e2e:ui
  ```

- **Run tests in headed mode (see browser):**
  ```bash
  npm run test:e2e:headed
  ```

- **Debug tests:**
  ```bash
  npm run test:e2e:debug
  ```

- **Run specific test file:**
  ```bash
  npx playwright test app.spec.js
  ```

- **Run tests in specific browser:**
  ```bash
  npx playwright test --project=chromium
  npx playwright test --project=firefox
  npx playwright test --project=webkit
  ```

### Test Configuration

The tests are configured in `playwright.config.js` with the following settings:

- **Base URL:** `http://localhost:3000`
- **Browsers:** Chromium, Firefox, WebKit
- **Auto-start dev server:** The React development server is automatically started before tests run
- **Parallel execution:** Tests run in parallel for faster execution
- **Retry on CI:** Tests retry 2 times on CI environments

### Test Features

#### API Mocking
The tests use Playwright's route mocking to simulate API responses:
- Mock successful Strava API responses
- Test error handling scenarios
- Test loading states with delayed responses

#### Responsive Testing
Tests verify the application works across different viewport sizes:
- Mobile (375x667)
- Tablet (768x1024)
- Desktop (default)

#### Accessibility Testing
Tests ensure the application is accessible:
- Proper ARIA labels and attributes
- Keyboard navigation support
- Focus management
- Alt text for images