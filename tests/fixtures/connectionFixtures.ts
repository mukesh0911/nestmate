import { DataFactory } from '../factories/dataFactory';
import { TestConnection } from '../data/testTypes';

export interface ConnectionScenarioFixtures {
  pendingConnection: TestConnection;
  acceptedConnection: TestConnection;
  rejectedConnection: TestConnection;
  blockedConnection: TestConnection;
}

export function getConnectionFixtures(
  fromUserId = 'test_user_seeker_01',
  toUserId = 'test_user_owner_01'
): ConnectionScenarioFixtures {
  return {
    pendingConnection: DataFactory.createPendingConnection('fx_pend', fromUserId, toUserId),
    acceptedConnection: DataFactory.createAcceptedConnection('fx_acc', fromUserId, toUserId),
    rejectedConnection: DataFactory.createRejectedConnection('fx_rej', fromUserId, toUserId),
    blockedConnection: DataFactory.createBlockedConnection('fx_blk', fromUserId, toUserId),
  };
}
