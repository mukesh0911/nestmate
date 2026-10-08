import { AccountFactory } from '../factories/accountFactory';
import { TestUserProfile } from '../data/testTypes';

export interface SeekerScenarioFixtures {
  activeSeeker: TestUserProfile;
  incompleteSeeker: TestUserProfile;
  quotaExhaustedSeeker: TestUserProfile;
  suspendedSeeker: TestUserProfile;
  bannedSeeker: TestUserProfile;
}

export function getSeekerFixtures(): SeekerScenarioFixtures {
  return {
    activeSeeker: AccountFactory.createSeeker('active_01'),
    incompleteSeeker: AccountFactory.createIncompleteUser('inc_01'),
    quotaExhaustedSeeker: AccountFactory.createQuotaExhaustedSeeker('quota_01'),
    suspendedSeeker: AccountFactory.createSuspendedUser('susp_01'),
    bannedSeeker: AccountFactory.createBannedUser('ban_01'),
  };
}
