/**
 * Role-Aware Navigation Utilities for NestMate
 * Ensures strict separation of Owner and Seeker experiences across
 * desktop headers, mobile bottom bars, deep-links, and marketplace routing.
 */

export type UserRole = 'owner' | 'seeker' | null | undefined;

/**
 * Returns the appropriate dashboard route depending on authentication and role.
 * Includes optional tab persistence.
 */
export function getDashboardRoute(
  isAuthenticated: boolean,
  role: UserRole,
  tab?: string | null
): string {
  if (!isAuthenticated) return '/login';
  if (role === 'owner') {
    return tab ? `/owner-dashboard?tab=${tab}` : '/owner-dashboard';
  }
  return tab ? `/explore?tab=${tab}` : '/explore?tab=rooms';
}

/**
 * Resolves seeker discovery route by role:
 * - Owners navigate to the Owner Seeker Discovery tab (/owner-dashboard?tab=seekers)
 * - Seekers navigate to the public flatmate explore tab (/explore?tab=roommates)
 */
export function getBrowseSeekersRoute(role: UserRole): string {
  if (role === 'owner') {
    return '/owner-dashboard?tab=seekers';
  }
  return '/explore?tab=roommates';
}

/**
 * Resolves room browsing route by role:
 * - Owners navigate to their property listings management (/owner-dashboard?tab=listings)
 * - Seekers navigate to the public room discovery tab (/explore?tab=rooms)
 */
export function getBrowseRoomsRoute(role: UserRole): string {
  if (role === 'owner') {
    return '/owner-dashboard?tab=listings';
  }
  return '/explore?tab=rooms';
}

/**
 * Checks if an Owner landing on ExplorePage should be redirected to the Owner Dashboard.
 * Specifically prevents Owners from viewing consumer flatmate exploration.
 */
export function resolveOwnerExploreRedirect(
  role: UserRole,
  activeTab: string
): string | null {
  if (role === 'owner' && activeTab === 'roommates') {
    return '/owner-dashboard?tab=seekers';
  }
  return null;
}

/**
 * Returns the logo click destination:
 * - Owners return to /owner-dashboard
 * - Seekers return to /
 */
export function getLogoDestination(role: UserRole): string {
  return role === 'owner' ? '/owner-dashboard' : '/';
}

/**
 * Action resolver when user clicks "+ Post Room":
 * - Unauthenticated: prompts auth with /owner-dashboard redirect
 * - Owner: navigates directly to /edit-listing/new
 * - Seeker: advises that posting is an Owner feature and redirects to settings
 */
export function resolvePostRoomAction(
  isAuthenticated: boolean,
  role: UserRole
): { type: 'auth_prompt' | 'navigate_new_listing' | 'seeker_role_prompt'; path?: string } {
  if (!isAuthenticated) {
    return { type: 'auth_prompt', path: '/owner-dashboard' };
  }
  if (role === 'owner') {
    return { type: 'navigate_new_listing', path: '/edit-listing/new' };
  }
  return { type: 'seeker_role_prompt', path: '/settings' };
}
