/**
 * NestMate API Test Foundation
 * Provides reusable authenticated API contexts, identities, and deterministic IDs
 * for API/backend testing, sharing the exact same test universe as UI tests.
 */
import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { AccountFactory } from '../factories/accountFactory';
import { TEST_UNIVERSE } from '../data/seedDataUniverse';

export interface ApiTestHeaders {
  [key: string]: string;
}

export interface ApiUserIdentity {
  uid: string;
  email: string;
  role: string | null;
  name: string;
  isPremium?: boolean;
  status?: string;
  connectsUsed?: number;
  connectsLimit?: number;
}

export class ApiTestContext {
  static readonly BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  static readonly IDENTITIES: Record<string, ApiUserIdentity> = {
    SEEKER_A: {
      uid: 'test_user_ref',
      email: 'seeker.ref@nestmate-test.com',
      role: 'seeker',
      name: 'Aditi Sharma (Reference)',
      status: 'active',
      connectsUsed: 0,
      connectsLimit: 5,
    },
    SEEKER_B: {
      uid: 'test_user_perfect_match',
      email: 'seeker.perfect@nestmate-test.com',
      role: 'seeker',
      name: 'Pooja Iyer (100% Match)',
      status: 'active',
      connectsUsed: 0,
      connectsLimit: 5,
    },
    OWNER_A: {
      uid: 'test_user_owner_01',
      email: 'owner.verified@nestmate-test.com',
      role: 'owner',
      name: 'Ramesh Gupta (Verified Owner)',
      status: 'active',
    },
    OWNER_B: {
      uid: 'test_user_owner_02',
      email: 'owner.unverified@nestmate-test.com',
      role: 'owner',
      name: 'Siddharth Rao (Unverified Owner)',
      status: 'active',
    },
    ADMIN: {
      uid: 'test_user_admin',
      email: 'admin@nestmate-test.com',
      role: 'seeker',
      name: 'Administrator',
      isPremium: true,
      status: 'active',
    },
    ONBOARDING_PENDING: {
      uid: 'test_user_onboarding_pending',
      email: 'incomplete@nestmate-test.com',
      role: null,
      name: 'Incomplete User',
      status: 'active',
    },
    SUSPENDED_USER: {
      uid: 'test_user_suspended',
      email: 'suspended@nestmate-test.com',
      role: 'seeker',
      name: 'Suspended Seeker',
      status: 'suspended',
    },
    BANNED_USER: {
      uid: 'test_user_banned',
      email: 'banned@nestmate-test.com',
      role: 'seeker',
      name: 'Banned Seeker',
      status: 'banned',
    },
    OWNER_PENDING_VERIF: {
      uid: 'test_user_owner_03',
      email: 'owner.pending@nestmate-test.com',
      role: 'owner',
      name: 'Anjali Deshmukh (Review Pending)',
      status: 'active',
    },
    OWNER_REJECTED: {
      uid: 'test_user_owner_rejected',
      email: 'owner.rejected@nestmate-test.com',
      role: 'owner',
      name: 'Kavita Reddy (Rejected Owner)',
      status: 'active',
    },
    PREMIUM_USER: {
      uid: 'test_user_pro_user',
      email: 'seeker.pro@nestmate-test.com',
      role: 'seeker',
      name: 'Priya Sharma (Pro Seeker)',
      isPremium: true,
      status: 'active',
      connectsUsed: 0,
      connectsLimit: 999,
    },
    UNAUTHENTICATED: {
      uid: '',
      email: '',
      role: null,
      name: 'Anonymous Visitor',
    },
  };

  /**
   * Generates authorization headers for a given test identity.
   */
  static getAuthHeaders(identity: ApiUserIdentity): ApiTestHeaders {
    if (!identity.uid) {
      return {
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
      'X-Test-User-Id': identity.uid,
      'X-Test-User-Email': identity.email,
      'X-Test-User-Role': identity.role || 'anonymous',
      'X-Test-User-Status': identity.status || 'active',
      ...(identity.isPremium ? { 'X-Test-User-Premium': 'true' } : {}),
    };
  }

  /**
   * Create an unauthenticated APIRequestContext.
   */
  static async createUnauthenticatedContext(): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create an authenticated APIRequestContext for Seeker A.
   */
  static async createSeekerContext(extraHeaders: ApiTestHeaders = {}): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        ...this.getAuthHeaders(this.IDENTITIES.SEEKER_A),
        ...extraHeaders,
      },
    });
  }

  /**
   * Create an authenticated APIRequestContext for Seeker B.
   */
  static async createSeekerBContext(extraHeaders: ApiTestHeaders = {}): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        ...this.getAuthHeaders(this.IDENTITIES.SEEKER_B),
        ...extraHeaders,
      },
    });
  }

  /**
   * Create an authenticated APIRequestContext for Owner A.
   */
  static async createOwnerContext(extraHeaders: ApiTestHeaders = {}): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        ...this.getAuthHeaders(this.IDENTITIES.OWNER_A),
        ...extraHeaders,
      },
    });
  }

  /**
   * Create an authenticated APIRequestContext for Owner B.
   */
  static async createOwnerBContext(extraHeaders: ApiTestHeaders = {}): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        ...this.getAuthHeaders(this.IDENTITIES.OWNER_B),
        ...extraHeaders,
      },
    });
  }

  /**
   * Create an authenticated APIRequestContext for Platform Admin.
   */
  static async createAdminContext(extraHeaders: ApiTestHeaders = {}): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        ...this.getAuthHeaders(this.IDENTITIES.ADMIN),
        ...extraHeaders,
      },
    });
  }

  /**
   * Create an APIRequestContext for Suspended User.
   */
  static async createSuspendedContext(extraHeaders: ApiTestHeaders = {}): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        ...this.getAuthHeaders(this.IDENTITIES.SUSPENDED_USER),
        ...extraHeaders,
      },
    });
  }

  /**
   * Create an APIRequestContext for Banned User.
   */
  static async createBannedContext(extraHeaders: ApiTestHeaders = {}): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        ...this.getAuthHeaders(this.IDENTITIES.BANNED_USER),
        ...extraHeaders,
      },
    });
  }

  /**
   * Create an APIRequestContext for Premium / Pro User.
   */
  static async createPremiumContext(extraHeaders: ApiTestHeaders = {}): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        ...this.getAuthHeaders(this.IDENTITIES.PREMIUM_USER),
        ...extraHeaders,
      },
    });
  }

  /**
   * Generic context creator for any identity key.
   */
  static async createContextForIdentity(identityKey: keyof typeof ApiTestContext.IDENTITIES, extraHeaders: ApiTestHeaders = {}): Promise<APIRequestContext> {
    const identity = this.IDENTITIES[identityKey];
    if (!identity) throw new Error(`Unknown test identity: ${identityKey}`);
    return playwrightRequest.newContext({
      baseURL: this.BASE_URL,
      extraHTTPHeaders: {
        ...this.getAuthHeaders(identity),
        ...extraHeaders,
      },
    });
  }

  /**
   * Deterministic entity IDs shared across UI and API test domains.
   */
  static getUniverseIds() {
    return {
      seekerA: 'test_user_ref',
      seekerB: 'test_user_perfect_match',
      seekerNightOwl: 'test_user_night_owl',
      seekerChennai: 'test_user_diff_city',
      seekerSmoker: 'test_user_dealbreaker',
      seekerQuotaFull: 'test_user_quota_full',
      seekerPro: 'test_user_pro_user',
      suspendedUser: 'test_user_suspended',
      bannedUser: 'test_user_banned',
      onboardingPending: 'test_user_onboarding_pending',
      ownerA: 'test_user_owner_01',
      ownerB: 'test_user_owner_02',
      ownerPending: 'test_user_owner_03',
      ownerPortfolio: 'test_user_owner_04',
      ownerRejected: 'test_user_owner_rejected',
      admin: 'test_user_admin',
      activeListing: 'test_listing_live_01',
      pendingListing: 'test_listing_pend_01',
      draftListing: 'test_listing_draft_01',
      pausedListing: 'test_listing_pause_01',
      filledListing: 'test_listing_fill_01',
      closedListing: 'test_listing_close_01',
      expiredListing: 'test_listing_exp_01',
      pendingConnection: 'test_conn_p01',
      acceptedConnection: 'test_conn_a01',
      rejectedConnection: 'test_conn_r01',
      blockedConnection: 'test_conn_b01',
      chatRoom: 'test_chat_crm_01',
      message1: 'test_msg_m01',
      message2: 'test_msg_m02',
      message3: 'test_msg_m03',
      notification1: 'test_notif_01',
      notification2: 'test_notif_02',
      notification3: 'test_notif_03',
      report1: 'test_report_rep_01',
      report2: 'test_report_rep_02',
      verification1: 'test_verif_owner_01',
      verification2: 'test_verif_owner_02',
      verification3: 'test_verif_owner_03',
      verification4: 'test_verif_owner_04',
      verification5: 'test_verif_owner_05',
    };
  }
}
