/**
 * NestMate Playwright E2E Configuration
 * Production validation suite — headless Chromium
 */
'use strict';

// Note: Using custom test runner (not @playwright/test) for compatibility
// with existing firebase-admin.cjs infrastructure which uses CommonJS modules.
// Tests are run via the master runner: tests/e2e/master_suite_runner.cjs

module.exports = {
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  TIMEOUT: {
    page: 30000,
    action: 15000,
    assertion: 10000,
    loadingSpinner: 12000,
    navigation: 20000,
    firebase: 8000,
  },
  BROWSER: {
    headless: process.env.HEADED !== '1',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    viewport: { width: 1280, height: 800 },
  },
  REPORTS: {
    dir: require('path').join(__dirname, '../reports'),
    screenshots: require('path').join(__dirname, '../reports/screenshots'),
    traces: require('path').join(__dirname, '../reports/traces'),
    videos: require('path').join(__dirname, '../reports/videos'),
  },
  FIXTURES: {
    profilePhoto: require('path').join(__dirname, '../fixtures/profile-photo.jpg'),
    verificationDoc: require('path').join(__dirname, '../fixtures/verification-document.jpg'),
    listingImage1: require('path').join(__dirname, '../fixtures/listing-image-01.jpg'),
    listingImage2: require('path').join(__dirname, '../fixtures/listing-image-02.jpg'),
  },
  RETRY: {
    // Only retry on genuine transient failures, not deterministic app bugs
    maxRetries: 1,
    retryDelay: 2000,
  },
};
