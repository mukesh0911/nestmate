import { DataFactory } from '../factories/dataFactory';
import { TestReport, TestOwnerVerification } from '../data/testTypes';

export interface ModerationScenarioFixtures {
  openReport: TestReport;
  resolvedReport: TestReport;
  submittedVerification: TestOwnerVerification;
  underReviewVerification: TestOwnerVerification;
  approvedVerification: TestOwnerVerification;
  rejectedVerification: TestOwnerVerification;
  resubmissionVerification: TestOwnerVerification;
}

export function getModerationFixtures(
  seekerId = 'test_user_seeker_01',
  ownerId = 'test_user_owner_01'
): ModerationScenarioFixtures {
  return {
    openReport: DataFactory.createReport('fx_rep_open', seekerId, ownerId, 'spam_or_scam', {
      status: 'open',
    }),
    resolvedReport: DataFactory.createReport('fx_rep_res', seekerId, ownerId, 'harassment', {
      status: 'resolved',
    }),
    submittedVerification: DataFactory.createOwnerVerification('owner_sub', 'SUBMITTED'),
    underReviewVerification: DataFactory.createOwnerVerification('owner_rev', 'UNDER_REVIEW'),
    approvedVerification: DataFactory.createOwnerVerification('owner_app', 'APPROVED'),
    rejectedVerification: DataFactory.createOwnerVerification('owner_rej', 'REJECTED'),
    resubmissionVerification: DataFactory.createOwnerVerification('owner_resub', 'RESUBMISSION_REQUIRED'),
  };
}
