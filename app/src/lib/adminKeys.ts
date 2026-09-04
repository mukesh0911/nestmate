/**
 * Admin registry key derivation — MUST mirror firestore.rules isAdmin(),
 * which looks up admins/{request.auth.token.email.lower()}.
 *
 * Keeping this in one pure module makes the client/server contract
 * explicit and unit-testable.
 */

/** Firestore document ID for an admin email (lowercased + trimmed). */
export function adminEmailKey(email: string): string {
    return email.trim().toLowerCase();
}

/** True when the given email matches a registered admin key. */
export function isAdminEmail(email: string | null | undefined, adminKeys: string[]): boolean {
    if (!email) return false;
    return adminKeys.includes(adminEmailKey(email));
}