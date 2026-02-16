export interface Room {
  id: string;
  code: string;
  name?: string;
  hostId: string;
  isActive: boolean;
  isLocked: boolean;
  createdAt: Date;
  scheduledAt?: Date;
  endedAt?: Date;
}

export interface RoomSettings {
  id: string;
  roomId: string;
  allowScreenShare: boolean;
  allowChat: boolean;
  allowParticipantVideo: boolean;
  allowParticipantAudio: boolean;
  waitingRoom: boolean;
  maxParticipants: number;
}

export interface Participant {
  id: string;
  socketId: string;
  userId?: string;
  guestName?: string;
  displayName: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
}

export interface CreateRoomDto {
  name?: string;
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomDto {
  roomCode: string;
  guestName?: string;
}

export interface RoomJoinedPayload {
  room: Room;
  participants: Participant[];
  messages: Message[];
  isHost: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  userId?: string;
  senderName: string;
  content: string;
  type: MessageType;
  createdAt: Date;
}

export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}
