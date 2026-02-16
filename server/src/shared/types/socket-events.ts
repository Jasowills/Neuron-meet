// Client to Server Events
export interface ClientToServerEvents {
  // Room events
  'join-room': (data: JoinRoomPayload) => void;
  'leave-room': (data: { roomId: string }) => void;

  // WebRTC signaling
  'offer': (data: { targetId: string; sdp: RTCSessionDescriptionInit }) => void;
  'answer': (data: { targetId: string; sdp: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { targetId: string; candidate: RTCIceCandidateInit }) => void;

  // Media events
  'toggle-audio': (data: { roomId: string; enabled: boolean }) => void;
  'toggle-video': (data: { roomId: string; enabled: boolean }) => void;
  'start-screen-share': (data: { roomId: string }) => void;
  'stop-screen-share': (data: { roomId: string }) => void;

  // Chat events
  'chat-message': (data: { roomId: string; content: string }) => void;
  'typing-start': (data: { roomId: string }) => void;
  'typing-stop': (data: { roomId: string }) => void;

  // Host controls
  'mute-participant': (data: { roomId: string; participantId: string }) => void;
  'remove-participant': (data: { roomId: string; participantId: string }) => void;
  'lock-room': (data: { roomId: string; locked: boolean }) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  // Room events
  'room-joined': (data: RoomJoinedResponse) => void;
  'user-joined': (data: { participant: ParticipantInfo }) => void;
  'user-left': (data: { socketId: string }) => void;
  'room-locked': (data: { locked: boolean }) => void;

  // WebRTC signaling
  'offer': (data: { senderId: string; sdp: RTCSessionDescriptionInit }) => void;
  'answer': (data: { senderId: string; sdp: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { senderId: string; candidate: RTCIceCandidateInit }) => void;

  // Media events
  'user-toggle-audio': (data: { socketId: string; enabled: boolean }) => void;
  'user-toggle-video': (data: { socketId: string; enabled: boolean }) => void;
  'screen-share-started': (data: { socketId: string }) => void;
  'screen-share-stopped': (data: { socketId: string }) => void;

  // Chat events
  'chat-message': (data: ChatMessagePayload) => void;
  'user-typing': (data: { socketId: string; displayName: string; isTyping: boolean }) => void;

  // System events
  'error': (data: { code: string; message: string }) => void;
  'force-disconnect': (data: { reason: string }) => void;
}

// Payload types
export interface JoinRoomPayload {
  roomCode: string;
  userId?: string;
  guestName?: string;
}

export interface RoomJoinedResponse {
  roomId: string;
  roomCode: string;
  participants: ParticipantInfo[];
  messages: ChatMessagePayload[];
  isHost: boolean;
  settings: RoomSettingsInfo;
}

export interface ParticipantInfo {
  socketId: string;
  userId?: string;
  displayName: string;
  avatarUrl?: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export interface RoomSettingsInfo {
  allowScreenShare: boolean;
  allowChat: boolean;
  allowParticipantVideo: boolean;
  allowParticipantAudio: boolean;
  waitingRoom: boolean;
}

export interface ChatMessagePayload {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'TEXT' | 'FILE' | 'SYSTEM';
  timestamp: string;
}

// RTCSessionDescriptionInit and RTCIceCandidateInit are browser types
// They are globally available in browser environments
