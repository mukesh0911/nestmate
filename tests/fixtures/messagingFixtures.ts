import { DataFactory } from '../factories/dataFactory';
import { TestChatRoom, TestChatMessage } from '../data/testTypes';

export interface MessagingScenarioFixtures {
  activeRoom: TestChatRoom;
  messages: TestChatMessage[];
  unreadMessage: TestChatMessage;
}

export function getMessagingFixtures(
  seekerId = 'test_user_seeker_01',
  ownerId = 'test_user_owner_01'
): MessagingScenarioFixtures {
  const activeRoom = DataFactory.createChatRoom('fx_room_01', seekerId, ownerId, 'test_conn_fx_acc');
  const messages = [
    DataFactory.createChatMessage('fx_m1', activeRoom.id, seekerId, 'Hello! I loved the photos of the flat.'),
    DataFactory.createChatMessage('fx_m2', activeRoom.id, ownerId, 'Thanks! It has great sunlight throughout the day.'),
  ];
  const unreadMessage = DataFactory.createChatMessage('fx_m3', activeRoom.id, seekerId, 'Can we do a video call tomorrow?', {
    read: false,
  });

  return {
    activeRoom,
    messages: [...messages, unreadMessage],
    unreadMessage,
  };
}
