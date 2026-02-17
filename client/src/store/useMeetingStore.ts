import { create } from "zustand";

export interface Participant {
  socketId: string;
  userId?: string;
  displayName: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  stream?: MediaStream;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "TEXT" | "FILE" | "SYSTEM";
  timestamp: string;
}

interface RoomSettings {
  allowScreenShare: boolean;
  allowChat: boolean;
  allowParticipantVideo: boolean;
  allowParticipantAudio: boolean;
  waitingRoom: boolean;
}

interface MeetingState {
  // Room info
  roomId: string | null;
  roomCode: string | null;
  isHost: boolean;
  isConnected: boolean;
  isLocked: boolean;
  settings: RoomSettings | null;

  // Participants
  participants: Map<string, Participant>;
  localParticipant: Participant | null;

  // Media state
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;

  // UI state
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isSettingsOpen: boolean;
  isReconnecting: boolean;

  // Chat
  messages: ChatMessage[];
  typingUsers: Map<string, string>;
  unreadMessageCount: number;

  // Hand raise
  isHandRaised: boolean;

  // Actions
  setRoomInfo: (
    roomId: string,
    roomCode: string,
    isHost: boolean,
    settings: RoomSettings | null,
  ) => void;
  setConnected: (connected: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setLocalParticipant: (participant: Participant | null) => void;

  addParticipant: (participant: Participant) => void;
  removeParticipant: (socketId: string) => void;
  clearParticipants: () => void;
  updateParticipant: (socketId: string, updates: Partial<Participant>) => void;
  setParticipantStream: (socketId: string, stream: MediaStream) => void;

  toggleMute: () => void;
  toggleVideo: () => void;
  setMuted: (muted: boolean) => void;
  setVideoOff: (videoOff: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;

  toggleChat: () => void;
  toggleParticipants: () => void;
  toggleSettings: () => void;

  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setTypingUser: (
    socketId: string,
    displayName: string,
    isTyping: boolean,
  ) => void;

  toggleHandRaise: () => void;
  setParticipantHandRaise: (socketId: string, isRaised: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  clearUnreadCount: () => void;

  reset: () => void;
}

const initialState = {
  roomId: null,
  roomCode: null,
  isHost: false,
  isConnected: false,
  isLocked: false,
  isReconnecting: false,
  settings: null,
  participants: new Map(),
  localParticipant: null,
  localStream: null,
  screenStream: null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isHandRaised: false,
  isChatOpen: false,
  isParticipantsOpen: false,
  isSettingsOpen: false,
  messages: [],
  typingUsers: new Map(),
  unreadMessageCount: 0,
};

export const useMeetingStore = create<MeetingState>((set, get) => ({
  ...initialState,

  setRoomInfo: (roomId, roomCode, isHost, settings) => {
    set({ roomId, roomCode, isHost, settings });
  },

  setConnected: (connected) => {
    set({ isConnected: connected });
  },

  setLocalStream: (stream) => {
    set({ localStream: stream });
  },

  setScreenStream: (stream) => {
    set({ screenStream: stream, isScreenSharing: !!stream });
  },

  setLocalParticipant: (participant) => {
    set({ localParticipant: participant });
  },

  addParticipant: (participant) => {
    const { participants } = get();
    const newParticipants = new Map(participants);
    // Remove any existing participant with same socketId (shouldn't happen but safety)
    newParticipants.set(participant.socketId, participant);
    set({ participants: newParticipants });
  },

  removeParticipant: (socketId) => {
    const { participants } = get();
    const newParticipants = new Map(participants);
    newParticipants.delete(socketId);
    set({ participants: newParticipants });
  },

  clearParticipants: () => {
    set({ participants: new Map() });
  },

  updateParticipant: (socketId, updates) => {
    const { participants } = get();
    const participant = participants.get(socketId);
    if (participant) {
      const newParticipants = new Map(participants);
      newParticipants.set(socketId, { ...participant, ...updates });
      set({ participants: newParticipants });
    }
  },

  setParticipantStream: (socketId, stream) => {
    const { participants } = get();
    const participant = participants.get(socketId);
    if (participant) {
      const newParticipants = new Map(participants);
      newParticipants.set(socketId, { ...participant, stream });
      set({ participants: newParticipants });
    }
  },

  toggleMute: () => {
    const { isMuted } = get();
    const newMuted = !isMuted;
    // Note: Audio track toggling is handled by useWebRTC/MediaManager
    // This just updates the state
    set({ isMuted: newMuted });
  },

  toggleVideo: () => {
    const { isVideoOff } = get();
    const newVideoOff = !isVideoOff;
    // Note: Video track toggling is handled by useWebRTC/MediaManager
    // This just updates the state
    set({ isVideoOff: newVideoOff });
  },

  setMuted: (muted) => {
    set({ isMuted: muted });
  },

  setVideoOff: (videoOff) => {
    set({ isVideoOff: videoOff });
  },

  setScreenSharing: (sharing) => {
    set({ isScreenSharing: sharing });
  },

  toggleChat: () => {
    const { isChatOpen } = get();
    set({
      isChatOpen: !isChatOpen,
      isParticipantsOpen: false,
      isSettingsOpen: false,
      unreadMessageCount: !isChatOpen ? 0 : get().unreadMessageCount,
    });
  },

  toggleParticipants: () => {
    const { isParticipantsOpen } = get();
    set({
      isParticipantsOpen: !isParticipantsOpen,
      isChatOpen: false,
      isSettingsOpen: false,
    });
  },

  toggleSettings: () => {
    const { isSettingsOpen } = get();
    set({
      isSettingsOpen: !isSettingsOpen,
      isChatOpen: false,
      isParticipantsOpen: false,
    });
  },

  addMessage: (message) => {
    const { messages, isChatOpen, unreadMessageCount } = get();
    set({
      messages: [...messages, message],
      unreadMessageCount: isChatOpen ? 0 : unreadMessageCount + 1,
    });
  },

  setMessages: (messages) => {
    set({ messages });
  },

  setTypingUser: (socketId, displayName, isTyping) => {
    const { typingUsers } = get();
    const newTypingUsers = new Map(typingUsers);

    if (isTyping) {
      newTypingUsers.set(socketId, displayName);
    } else {
      newTypingUsers.delete(socketId);
    }

    set({ typingUsers: newTypingUsers });
  },

  toggleHandRaise: () => {
    const { isHandRaised } = get();
    set({ isHandRaised: !isHandRaised });
  },

  setParticipantHandRaise: (socketId, isRaised) => {
    const { participants } = get();
    const participant = participants.get(socketId);
    if (participant) {
      const newParticipants = new Map(participants);
      newParticipants.set(socketId, { ...participant, isHandRaised: isRaised });
      set({ participants: newParticipants });
    }
  },

  setReconnecting: (reconnecting) => {
    set({ isReconnecting: reconnecting });
  },

  clearUnreadCount: () => {
    set({ unreadMessageCount: 0 });
  },

  reset: () => {
    // Stop all tracks before reset
    const { localStream, screenStream } = get();
    localStream?.getTracks().forEach((track) => track.stop());
    screenStream?.getTracks().forEach((track) => track.stop());

    set(initialState);
  },
}));
