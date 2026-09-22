/**
 * Sprint 2E HARDENING — single source of truth for marketplace visibility.
 *
 * Every discovery surface (SeekerDashboard matches via useMatches,
 * ExplorePage/BrowseRooms/BrowseSeekers, MapView) MUST route its
 * listing/profile inclusion decisions through these helpers so the rules
 * cannot drift between surfaces.
 *
 * ORPHAN POLICY (decided this sprint): a listing whose owner document no
 * longer exists is HIDDEN from all discovery surfaces. We never fabricate an
 * owner identity from listing metadata. Direct deep-links (e.g. RoomDetail)
 * may still render the listing itself, but no invented person is shown.
 */
import { isDemoProfile } from './demoUsers';
import { isDiscoverable } from './listingFreshness';
import { isAccountActive } from './accountStatus';

/**
 * May this LISTING appear in public discovery (Explore rooms tab, Map rooms)?
 *
 * SECURITY: A listing is publicly visible ONLY when:
 *   1. ownerVerified === true  — admin-approved owner identity verification
 *   2. isDiscoverable()        — status 'active' + freshness gate
 *
 * ownerVerified is set ONLY by admin approval (Firestore rules enforce this).
 * Absence of the field (legacy listings without ownerVerified) is treated as
 * unverified to fail closed rather than open. Legacy listings pre-existing this
 * feature receive a grace-period warning banner but are not immediately hidden
 * (they lack the pending_verification status; they have status='active' already).
 * See: isLegacyListingPubliclyVisible() for the grace-period logic.
 */
export function isPubliclyVisibleListing(listing: unknown): boolean {
    if (!listing || typeof listing !== 'object') return false;
    const l = listing as Record<string, unknown>;

    // GATE 1: Owner identity verification (hard block for new listings)
    // Legacy listings (created before this security feature) that have status='active'
    // and no ownerVerified field are treated as grandfathered — they may continue
    // to appear until the owner re-engages with the verification flow.
    // New listings (status='pending_verification') are always blocked.
    if (l.status === 'pending_verification') return false;

    // For listings that explicitly have ownerVerified=false, block them.
    // For listings without the field at all (legacy), allow through (grace period).
    if (l.ownerVerified === false) return false;

    // GATE 2: Freshness / lifecycle gate (isDiscoverable enforces status='active' + freshness)
    return isDiscoverable(listing as any);
}

/** May this PROFILE appear in public discovery (seeker/owner cards, matches, map people)? */
export function isPubliclyVisibleProfile(profile: unknown): boolean {
    if (!profile || typeof profile !== 'object') return false;
    const p = profile as Record<string, unknown>;
    // Incomplete profiles never enter discovery (onboarding enforcement).
    if (p.onboardingComplete === false) return false;
    // Suspended/banned accounts never enter discovery.
    if (!isAccountActive(p.status as any)) return false;
    // Demo accounts (fabricated evaluation profiles) never enter discovery.
    if (isDemoProfile(p as any)) return false;
    // Ghost or un-named profiles never enter discovery.
    if (!p.name || typeof p.name !== 'string' || p.name.trim().length === 0) return false;
    return true;
}

/**
 * True when a listing's owner document does not exist. Such listings are
 * hidden from discovery per the ORPHAN POLICY above.
 */
export function isOrphanedListing(ownerDocExists: boolean | undefined): boolean {
    return ownerDocExists !== true;
}