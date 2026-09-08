/**
 * NestMate E2E Page Objects
 * Maintainable abstractions for all 17 key screen areas.
 * Built on top of Playwright locators with stable selectors.
 */
'use strict';

const { APP_URL, TIMEOUT, gotoApp, waitForStableLoad } = require('../helpers/test-helpers.cjs');

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────
class LandingPage {
  constructor(page) { this.page = page; }

  async goto() { await gotoApp(this.page, '/'); }

  async getHeroHeading() {
    return await this.page.locator('h1').first().textContent({ timeout: TIMEOUT.assertion }).catch(() => null);
  }

  async searchCity(city) {
    // Hero search dropdown or input
    const citySelect = this.page.locator('select[aria-label*="city" i], button[aria-label*="city" i]').first();
    if (await citySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await citySelect.evaluate(el => el.tagName) === 'SELECT') {
        await citySelect.selectOption({ label: city });
      } else {
        await citySelect.click();
        await this.page.locator(`[role="option"]:has-text("${city}")`).first().click();
      }
    }
  }

  async clickSearch() {
    await this.page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await this.page.waitForURL(url => url.toString().includes('/explore'), { timeout: TIMEOUT.navigation }).catch(() => {});
  }

  async isVisible() {
    return await this.page.locator('h1, [data-testid="hero-heading"]').first().isVisible({ timeout: 5000 }).catch(() => false);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PAGE (Login + Signup)
// ─────────────────────────────────────────────────────────────────────────────
class AuthPage {
  constructor(page) { this.page = page; }

  async goto() { await gotoApp(this.page, '/login'); }

  async getEmailInput() { return this.page.locator('input[type="email"]').first(); }
  async getPasswordInput() { return this.page.locator('input[type="password"]').first(); }
  
  async clickContinueWithEmail() {
    const btn = this.page.locator('button:has-text("Continue with Email"), button:has-text("Email")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) await btn.click();
  }

  async fillCredentials(email, password) {
    await this.clickContinueWithEmail();
    await (await this.getEmailInput()).fill(email);
    await (await this.getPasswordInput()).fill(password);
  }

  async submit() {
    await this.page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Continue"), button:has-text("Log In")').first().click();
  }

  async getError() {
    return await this.page.locator('[role="alert"], .text-red-500, [class*="destructive"]').first()
      .textContent({ timeout: 5000 }).catch(() => null);
  }

  async isOnLoginPage() { return this.page.url().includes('/login'); }
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP PAGE
// ─────────────────────────────────────────────────────────────────────────────
class OTPPage {
  constructor(page) { this.page = page; }

  async goto() { await gotoApp(this.page, '/verify-otp'); }

  async isVisible() {
    return await this.page.locator('input[aria-label*="OTP" i], input[aria-label*="code" i], [class*="otp"]').first()
      .isVisible({ timeout: 5000 }).catch(() => false);
  }

  async enterOTP(code) {
    const inputs = this.page.locator('input[inputmode="numeric"], input[type="tel"], input[maxlength="1"]');
    const count = await inputs.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, code.length); i++) {
        await inputs.nth(i).fill(code[i]);
      }
    } else {
      // Single OTP input
      await this.page.locator('input[aria-label*="OTP" i], input[aria-label*="code" i]').first().fill(code);
    }
  }

  async clickResend() {
    await this.page.locator('button:has-text("Resend"), button:has-text("Resend OTP")').first().click();
  }

  // Mark OTP as BLOCKED since live SMS is not testable in CI
  isBlocked() { return true; }
  blockedReason() { return 'Phone OTP requires live SMS carrier — excluded by project owner'; }
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING PAGE
// ─────────────────────────────────────────────────────────────────────────────
class OnboardingPage {
  constructor(page) { this.page = page; }

  async gotoSeeker() { await gotoApp(this.page, '/onboarding/seeker'); }
  async gotoOwner() { await gotoApp(this.page, '/onboarding/owner'); }

  async isOnSeekerOnboarding() { return this.page.url().includes('/onboarding/seeker'); }
  async isOnOwnerOnboarding() { return this.page.url().includes('/onboarding/owner'); }

  async clickNext() {
    const btn = this.page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Save & Continue")').first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await this.page.waitForTimeout(600);
    }
  }

  async clickBack() {
    await this.page.locator('button:has-text("Back"), button:has-text("Previous")').first().click();
    await this.page.waitForTimeout(400);
  }

  async getCurrentStep() {
    // Try to get step indicator text
    const stepText = await this.page.locator('[class*="step"], [aria-label*="step" i], [class*="progress"]')
      .first().textContent({ timeout: 3000 }).catch(() => null);
    return stepText;
  }

  async selectOption(text) {
    // Click a radio or card option containing text
    await this.page.locator(`button:has-text("${text}"), label:has-text("${text}"), [role="radio"]:has-text("${text}")`).first().click();
    await this.page.waitForTimeout(200);
  }

  async fillText(selector, value) {
    const input = this.page.locator(selector).first();
    await input.waitFor({ state: 'visible', timeout: TIMEOUT.action });
    await input.clear();
    await input.fill(value);
  }

  async isOnDashboard() {
    return this.page.url().includes('/dashboard') || this.page.url().includes('/owner-dashboard');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────────
class ProfilePage {
  constructor(page) { this.page = page; }

  async goto() { await gotoApp(this.page, '/profile'); }

  async isVisible() {
    return await this.page.locator('h1, h2').filter({ hasText: /profile/i }).first()
      .isVisible({ timeout: 8000 }).catch(() => false);
  }

  async getUserName() {
    return await this.page.locator('h1, h2, h3').first().textContent({ timeout: 5000 }).catch(() => null);
  }

  async clickEdit() {
    await this.page.locator('button:has-text("Edit"), a:has-text("Edit Profile"), button[aria-label*="edit" i]').first().click();
    await waitForStableLoad(this.page);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION PAGE (within Owner Dashboard)
// ─────────────────────────────────────────────────────────────────────────────
class VerificationPage {
  constructor(page) { this.page = page; }

  async gotoVerification() {
    await gotoApp(this.page, '/owner-dashboard');
    await waitForStableLoad(this.page);
  }

  async getVerificationStatus() {
    return await this.page.locator('[class*="verification-status"], [data-testid="verification-status"], text=/VERIFIED|PENDING|NOT_STARTED|REJECTED/i')
      .first().textContent({ timeout: 5000 }).catch(() => null);
  }

  async openVerificationForm() {
    const startBtn = this.page.locator('button:has-text("Start Verification"), button:has-text("Resubmit Documents")').first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await this.page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  async uploadDocument(filePath) {
    const fileInput = this.page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(filePath);
      await this.page.waitForTimeout(1000);
      return true;
    }
    return false;
  }

  async submitVerification() {
    await this.page.locator('button:has-text("Submit for Verification"), button:has-text("Submit")').first().click();
    await this.page.waitForTimeout(2000);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORE PAGE (Discovery)
// ─────────────────────────────────────────────────────────────────────────────
class ExplorePage {
  constructor(page) { this.page = page; }

  async goto() { await gotoApp(this.page, '/explore?tab=rooms'); }
  async gotoRoommates() { await gotoApp(this.page, '/explore?tab=roommates'); }

  async isVisible() {
    return await this.page.locator('[data-testid="explore-page"], h1, h2').first()
      .isVisible({ timeout: 8000 }).catch(() => false);
  }

  async switchToRooms() {
    await this.page.locator('button:has-text("Rooms"), [role="tab"]:has-text("Rooms"), button:has-text("Find Rooms")').first().click();
    await this.page.waitForURL(url => url.toString().includes('tab=rooms'), { timeout: 5000 }).catch(() => {});
  }

  async switchToRoommates() {
    await this.page.locator('button:has-text("Flatmates"), button:has-text("Roommates"), [role="tab"]:has-text("Flat")').first().click();
    await this.page.waitForURL(url => url.toString().includes('tab=roommates'), { timeout: 5000 }).catch(() => {});
  }

  async openFilters() {
    await this.page.locator('button:has-text("Filter"), button[aria-label*="filter" i]').first().click();
    await this.page.waitForTimeout(500);
  }

  async closeFilters() {
    await this.page.locator('button:has-text("Close"), button[aria-label="Close"], [aria-label="Close dialog"]').first()
      .click().catch(() => {});
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  async getListingCount() {
    return await this.page.locator('[class*="listing-card"], [class*="room-card"], article').count();
  }

  async clickFirstListing() {
    const listing = this.page.locator('[class*="listing-card"], [class*="room-card"], article').first();
    await listing.waitFor({ state: 'visible', timeout: TIMEOUT.action });
    await listing.click();
    await waitForStableLoad(this.page);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTING PAGE (Room Detail)
// ─────────────────────────────────────────────────────────────────────────────
class ListingPage {
  constructor(page) { this.page = page; }

  async goto(listingId) { await gotoApp(this.page, `/room/${listingId}`); }

  async isVisible() {
    return await this.page.locator('h1, h2').first().isVisible({ timeout: 8000 }).catch(() => false);
  }

  async getTitle() {
    return await this.page.locator('h1, h2').first().textContent({ timeout: 5000 }).catch(() => null);
  }

  async getRent() {
    return await this.page.locator('[class*="rent"], [class*="price"]').first()
      .textContent({ timeout: 5000 }).catch(() => null);
  }

  async clickConnect() {
    await this.page.locator('button:has-text("Connect"), button:has-text("Request"), button:has-text("Send Request")').first().click();
    await this.page.waitForTimeout(1500);
  }

  async getCompatibilityScore() {
    return await this.page.locator('[class*="compatibility"], [class*="match"]').first()
      .textContent({ timeout: 5000 }).catch(() => null);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTION PAGE
// ─────────────────────────────────────────────────────────────────────────────
class ConnectionPage {
  constructor(page) { this.page = page; }

  async gotoConnections() {
    // Seeker: /dashboard?tab=connections, Owner: /owner-dashboard (connections tab)
    await gotoApp(this.page, '/dashboard');
    await waitForStableLoad(this.page);
    const connTab = this.page.locator('[role="tab"]:has-text("Connection"), button:has-text("Connection")').first();
    if (await connTab.isVisible({ timeout: 5000 }).catch(() => false)) await connTab.click();
    await this.page.waitForTimeout(500);
  }

  async getPendingConnections() {
    return await this.page.locator('[class*="pending"], [data-status="pending"]').count();
  }

  async acceptFirstConnection() {
    await this.page.locator('button:has-text("Accept"), button:has-text("Approve")').first().click();
    await this.page.waitForTimeout(1500);
  }

  async declineFirstConnection() {
    await this.page.locator('button:has-text("Decline"), button:has-text("Reject")').first().click();
    await this.page.waitForTimeout(1500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT PAGE
// ─────────────────────────────────────────────────────────────────────────────
class ChatPage {
  constructor(page) { this.page = page; }

  async goto() { await gotoApp(this.page, '/chat'); }
  async gotoRoom(roomId) { await gotoApp(this.page, `/chat/${roomId}`); }

  async isVisible() {
    return await this.page.locator('h1, h2, [aria-label*="chat" i]').first()
      .isVisible({ timeout: 8000 }).catch(() => false);
  }

  async sendMessage(text) {
    const input = this.page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
    await input.waitFor({ state: 'visible', timeout: TIMEOUT.action });
    await input.fill(text);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async getLastMessage() {
    const messages = this.page.locator('[class*="message"], [class*="bubble"]');
    const count = await messages.count();
    if (count === 0) return null;
    return await messages.last().textContent({ timeout: 5000 }).catch(() => null);
  }

  async isEmpty() {
    const emptyState = this.page.locator('[class*="empty"], text=/no conversation/i, text=/no message/i').first();
    return await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OWNER PAGE (Owner Dashboard)
// ─────────────────────────────────────────────────────────────────────────────
class OwnerPage {
  constructor(page) { this.page = page; }

  async goto() { await gotoApp(this.page, '/owner-dashboard'); }

  async isVisible() {
    return await this.page.locator('h1, h2').first().isVisible({ timeout: 8000 }).catch(() => false);
  }

  async clickListingsTab() {
    await this.page.locator('[role="tab"]:has-text("Listing"), button:has-text("My Listings"), button:has-text("Listings")').first().click();
    await this.page.waitForTimeout(500);
  }

  async clickApplicantsTab() {
    await this.page.locator('[role="tab"]:has-text("Applicant"), button:has-text("Applicants")').first().click();
    await this.page.waitForTimeout(500);
  }

  async clickCreateListing() {
    await this.page.locator('button:has-text("Create Listing"), button:has-text("Add Listing"), a:has-text("New Listing")').first().click();
    await waitForStableLoad(this.page);
  }

  async getListingCount() {
    return await this.page.locator('[class*="listing-card"], article[class*="listing"]').count();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICANT PAGE
// ─────────────────────────────────────────────────────────────────────────────
class ApplicantPage {
  constructor(page) { this.page = page; }

  async isVisible() {
    return await this.page.locator('h2:has-text("Applicant"), [class*="applicant"]').first()
      .isVisible({ timeout: 8000 }).catch(() => false);
  }

  async getApplicantCount() {
    return await this.page.locator('[class*="applicant-card"], [data-testid*="applicant"]').count();
  }

  async clickFirstApplicant() {
    await this.page.locator('[class*="applicant-card"], [data-testid*="applicant"]').first().click();
    await waitForStableLoad(this.page);
  }

  async clickCompare() {
    await this.page.locator('button:has-text("Compare"), button:has-text("Compare Applicants")').first().click();
    await this.page.waitForTimeout(1000);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFETY PAGE
// ─────────────────────────────────────────────────────────────────────────────
class SafetyPage {
  constructor(page) { this.page = page; }

  async clickReport(targetName) {
    await this.page.locator('button:has-text("Report"), button[aria-label*="report" i]').first().click();
    await this.page.waitForTimeout(500);
  }

  async clickBlock(targetName) {
    await this.page.locator('button:has-text("Block"), button[aria-label*="block" i]').first().click();
    await this.page.waitForTimeout(500);
  }

  async confirmReport() {
    // Select a reason and submit
    await this.page.locator('[role="radio"], label, button').filter({ hasText: /spam|inappropriate|fake/i }).first().click().catch(() => {});
    await this.page.locator('button:has-text("Submit"), button:has-text("Report"), button[type="submit"]').first().click();
    await this.page.waitForTimeout(1500);
  }

  async confirmBlock() {
    await this.page.locator('button:has-text("Confirm"), button:has-text("Block User"), button:has-text("Yes, Block")').first().click();
    await this.page.waitForTimeout(1500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION PAGE
// ─────────────────────────────────────────────────────────────────────────────
class NotificationPage {
  constructor(page) { this.page = page; }

  async goto() { await gotoApp(this.page, '/notifications'); }

  async isVisible() {
    return await this.page.locator('h1:has-text("Notification"), h2:has-text("Notification")').first()
      .isVisible({ timeout: 8000 }).catch(() => false);
  }

  async getNotificationCount() {
    return await this.page.locator('[data-testid="notification-item"], [class*="notification-item"], button[aria-label="Delete notification"]').count();
  }

  async clickFirstNotification() {
    await this.page.locator('[data-testid="notification-item"], button[aria-label="Delete notification"]').first().click();
    await waitForStableLoad(this.page);
  }

  async getUnreadCount() {
    // Badge or count indicator
    const badge = await this.page.locator('[class*="badge"], [class*="unread-count"]').first()
      .textContent({ timeout: 3000 }).catch(() => null);
    return badge ? parseInt(badge) : 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT PAGE (Settings)
// ─────────────────────────────────────────────────────────────────────────────
class AccountPage {
  constructor(page) { this.page = page; }

  async goto() { await gotoApp(this.page, '/settings'); }

  async isVisible() {
    return await this.page.locator('h1, h2').filter({ hasText: /settings|account|privacy/i }).first()
      .isVisible({ timeout: 8000 }).catch(() => false);
  }

  async clickPrivacyTab() {
    await this.page.locator('[role="tab"]:has-text("Privacy"), button:has-text("Privacy")').first().click();
    await this.page.waitForTimeout(500);
  }

  async togglePrivacyMode() {
    await this.page.locator('[role="switch"], input[type="checkbox"]').first().click();
    await this.page.waitForTimeout(800);
  }
}

module.exports = {
  LandingPage,
  AuthPage,
  OTPPage,
  OnboardingPage,
  ProfilePage,
  VerificationPage,
  ExplorePage,
  ListingPage,
  ConnectionPage,
  ChatPage,
  OwnerPage,
  ApplicantPage,
  SafetyPage,
  NotificationPage,
  AccountPage,
};
