import { describe, expect, it } from 'vitest';
import { assignSharedPhones } from './phoneShare';

describe('assignSharedPhones', () => {
  it('maps owner requester correctly', () => {
    expect(
      assignSharedPhones({
        requesterPhone: '111',
        accepterPhone: '222',
        requesterRole: 'owner',
      })
    ).toEqual({ ownerPhone: '111', seekerPhone: '222' });
  });

  it('maps seeker requester correctly', () => {
    expect(
      assignSharedPhones({
        requesterPhone: '111',
        accepterPhone: '222',
        requesterRole: 'seeker',
      })
    ).toEqual({ ownerPhone: '222', seekerPhone: '111' });
  });
});
