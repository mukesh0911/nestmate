import { DataFactory } from '../factories/dataFactory';
import { TestListing } from '../data/testTypes';

export interface ListingScenarioFixtures {
  activeListing: TestListing;
  pendingListing: TestListing;
  draftListing: TestListing;
  pausedListing: TestListing;
  filledListing: TestListing;
  closedListing: TestListing;
  expiredListing: TestListing;
}

export function getListingFixtures(ownerId = 'test_user_owner_01'): ListingScenarioFixtures {
  return {
    activeListing: DataFactory.createActiveListing('fx_act', ownerId),
    pendingListing: DataFactory.createPendingListing('fx_pend', ownerId),
    draftListing: DataFactory.createDraftListing('fx_draft', ownerId),
    pausedListing: DataFactory.createPausedListing('fx_pause', ownerId),
    filledListing: DataFactory.createFilledListing('fx_fill', ownerId),
    closedListing: DataFactory.createClosedListing('fx_close', ownerId),
    expiredListing: DataFactory.createExpiredListing('fx_exp', ownerId),
  };
}
