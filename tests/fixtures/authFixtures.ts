import { test as base, Page, expect } from '@playwright/test';
import { AccountFactory } from '../factories/accountFactory';
import { TestUserProfile } from '../data/testTypes';

export interface AuthContextOptions {
  profile: TestUserProfile;
}

export class AuthHelpers {
  /**
   * Fast-path UI login with credentials
   */
  static async loginWithEmail(page: Page, email: string, password = 'password123') {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const emailToggle = page.locator('button:visible').filter({ hasText: /Email/i }).first();
    await expect(emailToggle).toBeVisible({ timeout: 10000 });
    await emailToggle.click();

    const emailInput = page.locator('input[type="email"]:visible');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(email);

    const passwordInput = page.locator('input[type="password"]:visible');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(password);

    const submitBtn = page.getByRole('button', { name: /Continue with Email|Sign In/i }).locator('visible=true').first();
    await submitBtn.click();
  }

  /**
   * Set up mock authenticated state in page context
   */
  static async setupMockSession(page: Page, profile: TestUserProfile) {
    await page.addInitScript((mockUser) => {
      window.localStorage.setItem('nestmate_auth_session', JSON.stringify(mockUser));
      window.localStorage.setItem('nestmate_test_user', JSON.stringify(mockUser));
      (window as any).__MOCK_AUTH_USER__ = mockUser;
    }, profile);
  }

  /**
   * Alias for setupMockSession to support injectAuthenticatedSession calls
   */
  static async injectAuthenticatedSession(page: Page, profile: TestUserProfile) {
    return this.setupMockSession(page, profile);
  }

  static async loginAsSeekerA(page: Page) {
    const seekerA = AccountFactory.createSeeker('ref', {
      name: 'Aditi Sharma (Reference)',
      email: 'seeker.ref@nestmate-test.com',
    });
    await this.setupMockSession(page, seekerA);
    return seekerA;
  }

  static async loginAsSeekerB(page: Page) {
    const seekerB = AccountFactory.createSeeker('perfect_match', {
      name: 'Pooja Iyer (100% Match)',
      email: 'seeker.perfect@nestmate-test.com',
    });
    await this.setupMockSession(page, seekerB);
    return seekerB;
  }

  static async loginAsOwnerA(page: Page) {
    const ownerA = AccountFactory.createOwner('owner_01', {
      name: 'Ramesh Gupta (Verified Owner)',
      email: 'owner.verified@nestmate-test.com',
      isVerified: true,
      verificationLevel: 3,
    });
    await this.setupMockSession(page, ownerA);
    return ownerA;
  }

  static async loginAsOwnerB(page: Page) {
    const ownerB = AccountFactory.createOwner('owner_02', {
      name: 'Siddharth Rao (Unverified Owner)',
      email: 'owner.unverified@nestmate-test.com',
      isVerified: false,
      verificationLevel: 0,
    });
    await this.setupMockSession(page, ownerB);
    return ownerB;
  }

  static async loginAsAdmin(page: Page) {
    const admin = AccountFactory.createAdmin('admin', {
      name: 'Administrator',
      email: 'admin@nestmate-test.com',
    });
    await this.setupMockSession(page, admin);
    return admin;
  }

  static async clearAuthSession(page: Page) {
    await page.evaluate(() => {
      window.localStorage.removeItem('nestmate_auth_session');
      window.localStorage.removeItem('nestmate_test_user');
      delete (window as any).__MOCK_AUTH_USER__;
    });
  }
}

export interface TestFixtures {
  seekerUser: TestUserProfile;
  seekerBUser: TestUserProfile;
  ownerUser: TestUserProfile;
  ownerBUser: TestUserProfile;
  adminUser: TestUserProfile;
  authenticatedSeekerPage: Page;
  authenticatedOwnerPage: Page;
  authenticatedAdminPage: Page;
}

export const test = base.extend<TestFixtures>({
  seekerUser: async ({}, use) => {
    await use(AccountFactory.createSeeker('ref', {
      name: 'Aditi Sharma (Reference)',
      email: 'seeker.ref@nestmate-test.com',
    }));
  },

  seekerBUser: async ({}, use) => {
    await use(AccountFactory.createSeeker('perfect_match', {
      name: 'Pooja Iyer (100% Match)',
      email: 'seeker.perfect@nestmate-test.com',
    }));
  },

  ownerUser: async ({}, use) => {
    await use(AccountFactory.createOwner('owner_01', {
      name: 'Ramesh Gupta (Verified Owner)',
      email: 'owner.verified@nestmate-test.com',
      isVerified: true,
      verificationLevel: 3,
    }));
  },

  ownerBUser: async ({}, use) => {
    await use(AccountFactory.createOwner('owner_02', {
      name: 'Siddharth Rao (Unverified Owner)',
      email: 'owner.unverified@nestmate-test.com',
      isVerified: false,
      verificationLevel: 0,
    }));
  },

  adminUser: async ({}, use) => {
    await use(AccountFactory.createAdmin('admin', {
      name: 'Administrator',
      email: 'admin@nestmate-test.com',
    }));
  },


  authenticatedSeekerPage: async ({ page, seekerUser }, use) => {
    await AuthHelpers.setupMockSession(page, seekerUser);
    await use(page);
  },

  authenticatedOwnerPage: async ({ page, ownerUser }, use) => {
    await AuthHelpers.setupMockSession(page, ownerUser);
    await use(page);
  },

  authenticatedAdminPage: async ({ page, adminUser }, use) => {
    await AuthHelpers.setupMockSession(page, adminUser);
    await use(page);
  },
});

export { expect };
