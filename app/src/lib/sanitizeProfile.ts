/**
 * Strip contact PII from profiles returned to other users / match feeds.
 * Own-profile views should use hydrateOwnProfile instead.
 */
export function sanitizePublicProfile<T extends Record<string, unknown>>(profile: T): T {
  return {
    ...profile,
    phone: '',
    email: '',
    workEmail: '',
    whatsappNumber: '',
  };
}
