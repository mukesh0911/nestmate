import { AccountFactory } from '../factories/accountFactory';
import { TestUserProfile } from '../data/testTypes';

export interface AdminScenarioFixtures {
  primaryAdmin: TestUserProfile;
}

export function getAdminFixtures(): AdminScenarioFixtures {
  return {
    primaryAdmin: AccountFactory.createAdmin('primary', {
      email: 'admin@nestmate-test.com',
    }),
  };
}
