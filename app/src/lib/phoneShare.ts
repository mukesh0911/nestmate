/**
 * Phone-share role mapping — pure helper used by acceptPhoneShare.
 * Ensures mutual share does not depend on reading the other user's private phone.
 */
export function assignSharedPhones(params: {
  requesterPhone: string;
  accepterPhone: string;
  requesterRole: 'owner' | 'seeker' | null;
}): { ownerPhone: string; seekerPhone: string } {
  const { requesterPhone, accepterPhone, requesterRole } = params;
  const ownerPhone = requesterRole === 'owner' ? requesterPhone : accepterPhone;
  const seekerPhone = requesterRole === 'seeker' ? requesterPhone : accepterPhone;
  return { ownerPhone, seekerPhone };
}
