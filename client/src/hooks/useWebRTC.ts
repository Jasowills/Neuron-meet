import { useEffect, useRef, useCallback } from "react";
import { useMeetingStore, Participant } from "@/store/useMeetingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { socketClient } from "@/lib/socket/SocketClient";
import { PeerConnectionManager } from "@/lib/webrtc/PeerConnection";
import { mediaManager } from "@/lib/webrtc/MediaManager";
import { toast } from "@/store/useToastStore";
import { soundManager } from "@/lib/sounds/SoundManager";

interface UseWebRTCOptions {
  roomCode: string;
  displayName: string;
}

const MEETING_SOCKET_EVENTS = [
  "room-joined",
  "user-joined",
  "user-left",
  "offer",
  "answer",
  "ice-candidate",
  "user-toggle-audio",
  "user-toggle-video",
  "screen-share-started",
  "screen-share-stopped",
  "user-hand-raised",
  "user-hand-lowered",
  "chat-message",
  "user-typing",
  "force-mute",
  "force-disconnect",
  "join-error",
] as const;

const clearMeetingSocketListeners = (socket: { off: (event: string) => void }) => {
  MEETING_SOCKET_EVENTS.forEach((event) => socket.off(event));
};

export function useWebRTC({ roomCode, displayName }: UseWebRTCOptions) {
  const pcManager = useRef<PeerConnectionManager | null>(null);
  const reconnectJoinHandlerRef = useRef<(() => void) | null>(null);
  const { user } = useAuthStore();

  const {
    setRoomInfo,
    setConnected,
    setLocalStream,
    setLocalParticipant,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setParticipantStream,
    setParticipantHandRaise,
    addMessage,
    setMessages,
    setTypingUser,
    reset,
  } = useMeetingStore();

  // Initialize peer connection manager
  useEffect(() => {
    pcManager.current = new PeerConnectionManager();

    // Set up callbacks
    pcManager.current.onIceCandidate = (peerId, candidate) => {
      socketClient.emit("ice-candidate", {
        targetId: peerId,
        candidate: candidate.toJSON(),
      });
    };

    pcManager.current.onRemoteStream = (peerId, stream) => {
      setParticipantStream(peerId, stream);
    };

    pcManager.current.onConnectionStateChange = (_peerId, _state) => {
      // Connection state changed - can be used for debugging
    };

    return () => {
      pcManager.current?.closeAll();
    };
  }, [setParticipantStream]);

  // Handle creating offer for a peer
  const createOfferForPeer = useCallback(async (peerId: string) => {
    if (!pcManager.current) return;

    const offer = await pcManager.current.createOffer(peerId);
    if (offer) {
      socketClient.emit("offer", {
        targetId: peerId,
        sdp: offer,
      });
    }
  }, []);

  // Join room
  const joinRoom = useCallback(async () => {
    let joinTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
      // Resume audio context for notification sounds (requires user interaction)
      soundManager.resume();

      // Get local media first
      const stream = await mediaManager.getLocalStream();

      setLocalStream(stream);
      pcManager.current?.setLocalStream(stream);

      // Ensure video/audio tracks are enabled based on initial state
      const { isMuted: currentMuted, isVideoOff: currentVideoOff } =
        useMeetingStore.getState();

        
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !currentMuted;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !currentVideoOff;
      });

      // Connect socket
      const socket = socketClient.connect(displayName);
      clearMeetingSocketListeners(socket);
      if (reconnectJoinHandlerRef.current) {
        socket.off("connect", reconnectJoinHandlerRef.current);
      }

      // Set up socket event handlers
      let joinResolve: () => void;
      let joinReject: (err: Error) => void;
      const joinPromise = new Promise<void>((resolve, reject) => {
        joinResolve = resolve;
        joinReject = reject;
      });

      joinTimeout = setTimeout(() => {
        joinReject(new Error("Join room timeout - no response from server"));
      }, 15000);

      socket.on("room-joined", (data) => {
        clearTimeout(joinTimeout);

        // Reset stale peer state before renegotiating.
        pcManager.current?.closeAll();

        // Clear any stale participants from previous sessions
        useMeetingStore.getState().clearParticipants();

        setRoomInfo(data.roomId, roomCode, data.isHost, data.settings);
        setMessages(data.messages || []);
        setConnected(true);

        // Set local participant
        setLocalParticipant({
          socketId: socket.id!,
          userId: user?.id,
          displayName: user?.displayName || displayName,
          isHost: data.isHost,
          isMuted: currentMuted,
          isVideoOff: currentVideoOff,
          isScreenSharing: false,
          isHandRaised: false,
        });

        // Add existing participants and create offers
        data.participants.forEach((p: Participant) => {
          addParticipant(p);
          // Create offer to existing participants
          createOfferForPeer(p.socketId);
        });

        // Sync current local media state to room on every join/rejoin.
        socketClient.emit("toggle-audio", {
          roomId: data.roomId,
          enabled: !useMeetingStore.getState().isMuted,
        });
        socketClient.emit("toggle-video", {
          roomId: data.roomId,
          enabled: !useMeetingStore.getState().isVideoOff,
        });

        joinResolve();
      });

      socket.on("user-joined", (data) => {
        addParticipant(data.participant);
        toast.info(`${data.participant.displayName} joined the meeting`);
        soundManager.play("join");
        // The new user will send us an offer
      });

      socket.on("user-left", (data) => {
        const participant = useMeetingStore
          .getState()
          .participants.get(data.socketId);
        if (participant) {
          toast.info(`${participant.displayName} left the meeting`);
        }
        soundManager.play("leave");
        removeParticipant(data.socketId);
        pcManager.current?.closePeerConnection(data.socketId);
      });

      // WebRTC signaling
      socket.on("offer", async (data) => {
        // Add participant if not exists
        addParticipant({
          socketId: data.senderId,
          userId: data.userId,
          displayName: data.displayName || "Participant",
          isHost: false,
          isMuted: false,
          isVideoOff: false,
          isScreenSharing: false,
          isHandRaised: false,
        });

        const answer = await pcManager.current?.handleOffer(
          data.senderId,
          data.sdp,
        );
        if (answer) {
          socketClient.emit("answer", {
            targetId: data.senderId,
            sdp: answer,
          });
        }
      });

      socket.on("answer", async (data) => {
        await pcManager.current?.handleAnswer(data.senderId, data.sdp);
      });

      socket.on("ice-candidate", async (data) => {
        await pcManager.current?.addIceCandidate(data.senderId, data.candidate);
      });

      // Media events
      socket.on("user-toggle-audio", (data) => {
        updateParticipant(data.socketId, { isMuted: !data.enabled });
      });

      socket.on("user-toggle-video", (data) => {
        updateParticipant(data.socketId, { isVideoOff: !data.enabled });
      });

      socket.on("screen-share-started", async (data) => {
        updateParticipant(data.socketId, { isScreenSharing: true });

        // Stop local screen share if someone else started (screen share takeover)
        const { screenStream, localParticipant, localStream } =
          useMeetingStore.getState();
        if (screenStream && localParticipant?.socketId !== data.socketId) {
          mediaManager.stopScreenShare();
          useMeetingStore.getState().setScreenStream(null);

          // Restore camera video track in peer connections
          if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack && pcManager.current) {
              await pcManager.current.replaceVideoTrack(videoTrack);
            }
          }

          const currentRoomId = useMeetingStore.getState().roomId;
          if (currentRoomId) {
            socketClient.emit("stop-screen-share", { roomId: currentRoomId });
          }
          toast.info(
            "Your screen share was stopped because someone else started sharing",
          );
        }
      });

      socket.on("screen-share-stopped", (data) => {
        updateParticipant(data.socketId, { isScreenSharing: false });
      });

      // Hand raise events
      socket.on("user-hand-raised", (data) => {
        setParticipantHandRaise(data.socketId, true);
        toast.info(`${data.displayName} raised their hand`);
        soundManager.play("handRaise");
      });

      socket.on("user-hand-lowered", (data) => {
        setParticipantHandRaise(data.socketId, false);
      });

      // Chat events
      socket.on("chat-message", (message) => {
        addMessage(message);
        // Play sound only if chat is closed (user hasn't seen it)
        if (!useMeetingStore.getState().isChatOpen) {
          soundManager.play("message");
        }
      });

      socket.on("user-typing", (data) => {
        setTypingUser(data.socketId, data.displayName, data.isTyping);
      });

      // Host controls
      socket.on("force-mute", () => {
        mediaManager.toggleAudio(false);
        useMeetingStore.getState().setMuted(true);
      });

      socket.on("force-disconnect", (_data) => {
        leaveRoom();
      });

      socket.on("join-error", (data) => {
        console.error("Socket error:", data);
        clearTimeout(joinTimeout);
        joinReject(new Error(data.message || "Failed to join room"));
      });

      reconnectJoinHandlerRef.current = () => {
        const { isConnected } = useMeetingStore.getState();
        if (!isConnected) return;

        socketClient.emit("join-room", {
          roomCode,
          userId: user?.id,
          displayName: user?.displayName || displayName,
        });
      };
      socket.on("connect", reconnectJoinHandlerRef.current);

      // Wait for socket to connect before joining
      if (!socket.connected) {
        await new Promise<void>((resolve, reject) => {
          socket.once("connect", () => {
            resolve();
          });
          socket.once("connect_error", (err) => {
            console.error("Socket connect error:", err);
            reject(new Error("Failed to connect to server"));
          });
          setTimeout(() => reject(new Error("Connection timeout")), 10000);
        });
      }

      // Join the room and wait for confirmation
      socket.emit("join-room", {
        roomCode,
        userId: user?.id,
        displayName: user?.displayName || displayName,
      });

      // Wait for room-joined event
      await joinPromise;
    } catch (error) {
      console.error("Error joining room:", error);
      throw error;
    } finally {
      if (joinTimeout) {
        clearTimeout(joinTimeout);
      }
    }
  }, [
    roomCode,
    displayName,
    user,
    setLocalStream,
    setRoomInfo,
    setConnected,
    setLocalParticipant,
    addParticipant,
    removeParticipant,
    updateParticipant,
    addMessage,
    setMessages,
    setTypingUser,
    createOfferForPeer,
  ]);

  // Leave room
  const leaveRoom = useCallback((options?: { silent?: boolean }) => {
    const { roomId, localStream, screenStream } = useMeetingStore.getState();

    // Play end meeting sound
    if (!options?.silent) {
      soundManager.play("meetingEnd");
    }

    if (roomId) {
      socketClient.emit("leave-room", { roomId });
    }

    // Close all peer connections
    pcManager.current?.closeAll();

    // Stop all media tracks from store references
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    // Stop MediaManager's streams
    mediaManager.stopAll();

    // Disconnect socket
    const socket = socketClient.getSocket();
    if (socket) {
      clearMeetingSocketListeners(socket);
      if (reconnectJoinHandlerRef.current) {
        socket.off("connect", reconnectJoinHandlerRef.current);
      }
    }
    reconnectJoinHandlerRef.current = null;
    socketClient.disconnect();

    // Reset store state (also stops any remaining tracks)
    reset();
  }, [reset]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const {
      isMuted,
      roomId,
      toggleMute: storeToggleMute,
    } = useMeetingStore.getState();
    const newMuted = !isMuted;

    // Toggle audio tracks - pass false to disable audio when muting
    mediaManager.toggleAudio(!newMuted);

    // Update store state
    storeToggleMute();

    // Emit to server
    if (roomId) {
      socketClient.emit("toggle-audio", {
        roomId,
        enabled: !newMuted,
      });
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    const {
      isVideoOff,
      roomId,
      toggleVideo: storeToggleVideo,
    } = useMeetingStore.getState();
    const newVideoOff = !isVideoOff;

    if (newVideoOff) {
      mediaManager.toggleVideo(false);
    } else {
      const recoveredVideoTrack = await mediaManager.ensureVideoTrack();
      mediaManager.toggleVideo(true);
      if (recoveredVideoTrack) {
        await pcManager.current?.replaceVideoTrack(recoveredVideoTrack);
      }
    }

    storeToggleVideo();

    if (roomId) {
      socketClient.emit("toggle-video", {
        roomId,
        enabled: !newVideoOff,
      });
    }
  }, []);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    const { roomId, setScreenStream } = useMeetingStore.getState();

    try {
      const stream = await mediaManager.startScreenShare();
      setScreenStream(stream);

      // Replace video track in peer connections
      const videoTrack = stream.getVideoTracks()[0];
      await pcManager.current?.replaceVideoTrack(videoTrack);

      if (roomId) {
        socketClient.emit("start-screen-share", { roomId });
      }

      // Handle when screen share ends
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }, []);

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    const { roomId, localStream, setScreenStream } = useMeetingStore.getState();

    mediaManager.stopScreenShare();
    setScreenStream(null);

    // Restore camera video track
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        await pcManager.current?.replaceVideoTrack(videoTrack);
      }
    }

    if (roomId) {
      socketClient.emit("stop-screen-share", { roomId });
    }
  }, []);

  // Send chat message
  const sendMessage = useCallback((content: string) => {
    const { roomId } = useMeetingStore.getState();

    if (roomId && content.trim()) {
      socketClient.emit("chat-message", {
        roomId,
        content: content.trim(),
      });
    }
  }, []);

  // Typing indicators
  const sendTypingStart = useCallback(() => {
    const { roomId } = useMeetingStore.getState();
    if (roomId) {
      socketClient.emit("typing-start", { roomId });
    }
  }, []);

  const sendTypingStop = useCallback(() => {
    const { roomId } = useMeetingStore.getState();
    if (roomId) {
      socketClient.emit("typing-stop", { roomId });
    }
  }, []);

  // Toggle hand raise
  const toggleHandRaise = useCallback(() => {
    const {
      roomId,
      isHandRaised,
      toggleHandRaise: storeToggleHandRaise,
    } = useMeetingStore.getState();
    storeToggleHandRaise();

    if (roomId) {
      socketClient.emit("toggle-hand-raise", { roomId, raised: !isHandRaised });
    }

    toast.info(!isHandRaised ? "Hand raised" : "Hand lowered");
  }, []);

  return {
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
    toggleHandRaise,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
  };
}
