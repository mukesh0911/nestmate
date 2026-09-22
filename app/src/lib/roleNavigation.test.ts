import { describe, it, expect } from 'vitest';
import {
  getDashboardRoute,
  getBrowseSeekersRoute,
  getBrowseRoomsRoute,
  resolveOwnerExploreRedirect,
  getLogoDestination,
  resolvePostRoomAction,
} from './roleNavigation';

describe('roleNavigation utilities', () => {
  describe('getDashboardRoute', () => {
    it('redirects unauthenticated users to /login', () => {
      expect(getDashboardRoute(false, null)).toBe('/login');
      expect(getDashboardRoute(false, 'owner')).toBe('/login');
      expect(getDashboardRoute(false, 'seeker')).toBe('/login');
    });

    it('routes Owner to /owner-dashboard with or without tab', () => {
      expect(getDashboardRoute(true, 'owner')).toBe('/owner-dashboard');
      expect(getDashboardRoute(true, 'owner', 'listings')).toBe('/owner-dashboard?tab=listings');
      expect(getDashboardRoute(true, 'owner', 'seekers')).toBe('/owner-dashboard?tab=seekers');
      expect(getDashboardRoute(true, 'owner', 'applicants')).toBe('/owner-dashboard?tab=applicants');
    });

    it('routes Seeker to /explore with or without tab', () => {
      expect(getDashboardRoute(true, 'seeker')).toBe('/explore?tab=rooms');
      expect(getDashboardRoute(true, 'seeker', 'roommates')).toBe('/explore?tab=roommates');
      expect(getDashboardRoute(true, 'seeker', 'saved')).toBe('/explore?tab=saved');
    });
  });

  describe('getBrowseSeekersRoute (OWNER vs SEEKER discovery)', () => {
    it('routes Owner to Owner Seeker Discovery (/owner-dashboard?tab=seekers)', () => {
      expect(getBrowseSeekersRoute('owner')).toBe('/owner-dashboard?tab=seekers');
    });

    it('routes Seeker to Consumer Flatmate Explore (/explore?tab=roommates)', () => {
      expect(getBrowseSeekersRoute('seeker')).toBe('/explore?tab=roommates');
      expect(getBrowseSeekersRoute(null)).toBe('/explore?tab=roommates');
    });
  });

  describe('getBrowseRoomsRoute', () => {
    it('routes Owner to Owner Listings tab (/owner-dashboard?tab=listings)', () => {
      expect(getBrowseRoomsRoute('owner')).toBe('/owner-dashboard?tab=listings');
    });

    it('routes Seeker to Rooms Explore tab (/explore?tab=rooms)', () => {
      expect(getBrowseRoomsRoute('seeker')).toBe('/explore?tab=rooms');
      expect(getBrowseRoomsRoute(null)).toBe('/explore?tab=rooms');
    });
  });

  describe('resolveOwnerExploreRedirect', () => {
    it('redirects Owner attempting to access consumer roommates tab to Owner Seeker Discovery', () => {
      const redirect = resolveOwnerExploreRedirect('owner', 'roommates');
      expect(redirect).toBe('/owner-dashboard?tab=seekers');
    });

    it('does not redirect Owner on public rooms tab', () => {
      const redirect = resolveOwnerExploreRedirect('owner', 'rooms');
      expect(redirect).toBeNull();
    });

    it('does not redirect Seeker on roommates tab', () => {
      const redirect = resolveOwnerExploreRedirect('seeker', 'roommates');
      expect(redirect).toBeNull();
    });
  });

  describe('getLogoDestination', () => {
    it('returns /owner-dashboard for Owner', () => {
      expect(getLogoDestination('owner')).toBe('/owner-dashboard');
    });

    it('returns / for Seeker and unauthenticated visitors', () => {
      expect(getLogoDestination('seeker')).toBe('/');
      expect(getLogoDestination(null)).toBe('/');
    });
  });

  describe('resolvePostRoomAction', () => {
    it('prompts auth when unauthenticated', () => {
      const action = resolvePostRoomAction(false, null);
      expect(action.type).toBe('auth_prompt');
      expect(action.path).toBe('/owner-dashboard');
    });

    it('navigates to /edit-listing/new for Owners', () => {
      const action = resolvePostRoomAction(true, 'owner');
      expect(action.type).toBe('navigate_new_listing');
      expect(action.path).toBe('/edit-listing/new');
    });

    it('prompts role switch for Seekers without silently bouncing to owner-dashboard', () => {
      const action = resolvePostRoomAction(true, 'seeker');
      expect(action.type).toBe('seeker_role_prompt');
      expect(action.path).toBe('/settings');
    });
  });
});
