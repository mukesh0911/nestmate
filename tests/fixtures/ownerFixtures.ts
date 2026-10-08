import { AccountFactory } from '../factories/accountFactory';
import { TestUserProfile } from '../data/testTypes';

export interface OwnerScenarioFixtures {
  verifiedOwner: TestUserProfile;
  unverifiedOwner: TestUserProfile;
  pendingReviewOwner: TestUserProfile;
  suspendedOwner: TestUserProfile;
}

export function getOwnerFixtures(): OwnerScenarioFixtures {
  return {
    verifiedOwner: AccountFactory.createOwner('verif_01', { isVerified: true, verificationLevel: 3 }),
    unverifiedOwner: AccountFactory.createOwner('unverif_01', { isVerified: false, verificationLevel: 0 }),
    pendingReviewOwner: AccountFactory.createOwner('review_01', { isVerified: false, verificationLevel: 1 }),
    suspendedOwner: AccountFactory.createOwner('susp_01', { status: 'suspended' }),
  };
}
