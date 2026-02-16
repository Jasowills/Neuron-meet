import { useEffect, useRef, useCallback } from "react";
import { useMeetingStore, Participant } from "@/store/useMeetingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { socketClient } from "@/lib/socket/SocketClient";
import { PeerConnectionManager } from "@/lib/webrtc/PeerConnection";
import { mediaManager } from "@/lib/webrtc/MediaManager";

interface UseWebRTCOptions {
  roomCode: string;
  displayName: string;
}

export function useWebRTC({ roomCode, displayName }: UseWebRTCOptions) {
  const pcManager = useRef<PeerConnectionManager | null>(null);
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
    addMessage,
    setMessages,
    setTypingUser,
    isMuted,
    isVideoOff,
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
      console.log("Received remote stream from:", peerId);
      setParticipantStream(peerId, stream);
    };

    pcManager.current.onConnectionStateChange = (peerId, state) => {
      console.log(`Connection state for ${peerId}: ${state}`);
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
    try {
      // Get local media first
      const stream = await mediaManager.getLocalStream();
      console.log('Local stream acquired:', stream);
      console.log('Video tracks:', stream.getVideoTracks().length);
      console.log('Audio tracks:', stream.getAudioTracks().length);
      
      setLocalStream(stream);
      pcManager.current?.setLocalStream(stream);

      // Ensure video/audio tracks are enabled based on initial state
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });

      // Connect socket
      const socket = socketClient.connect(displayName);

      // Set up socket event handlers
      let joinResolve: () => void;
      let joinReject: (err: Error) => void;
      const joinPromise = new Promise<void>((resolve, reject) => {
        joinResolve = resolve;
        joinReject = reject;
      });

      const joinTimeout = setTimeout(() => {
        joinReject(new Error('Join room timeout - no response from server'));
      }, 15000);

      socket.on("room-joined", (data) => {
        console.log("Room joined:", data);
        clearTimeout(joinTimeout);
        setRoomInfo(data.roomId, roomCode, data.isHost, data.settings);
        setMessages(data.messages || []);
        setConnected(true);

        // Set local participant
        setLocalParticipant({
          socketId: socket.id!,
          userId: user?.id,
          displayName: user?.displayName || displayName,
          isHost: data.isHost,
          isMuted,
          isVideoOff,
          isScreenSharing: false,
        });

        // Add existing participants and create offers
        data.participants.forEach((p: Participant) => {
          addParticipant(p);
          // Create offer to existing participants
          createOfferForPeer(p.socketId);
        });

        joinResolve();
      });

      socket.on("user-joined", (data) => {
        console.log("User joined:", data);
        addParticipant(data.participant);
        // The new user will send us an offer
      });

      socket.on("user-left", (data) => {
        console.log("User left:", data);
        removeParticipant(data.socketId);
        pcManager.current?.closePeerConnection(data.socketId);
      });

      // WebRTC signaling
      socket.on("offer", async (data) => {
        console.log("Received offer from:", data.senderId);

        // Add participant if not exists
        addParticipant({
          socketId: data.senderId,
          userId: data.userId,
          displayName: data.displayName || "Participant",
          isHost: false,
          isMuted: false,
          isVideoOff: false,
          isScreenSharing: false,
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
        console.log("Received answer from:", data.senderId);
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

      socket.on("screen-share-started", (data) => {
        updateParticipant(data.socketId, { isScreenSharing: true });
      });

      socket.on("screen-share-stopped", (data) => {
        updateParticipant(data.socketId, { isScreenSharing: false });
      });

      // Chat events
      socket.on("chat-message", (message) => {
        addMessage(message);
      });

      socket.on("user-typing", (data) => {
        setTypingUser(data.socketId, data.displayName, data.isTyping);
      });

      // Host controls
      socket.on("force-mute", () => {
        useMeetingStore.getState().toggleMute();
        // Ensure actually muted
        if (!useMeetingStore.getState().isMuted) {
          useMeetingStore.getState().toggleMute();
        }
      });

      socket.on("force-disconnect", (data) => {
        console.log("Disconnected by host:", data.reason);
        leaveRoom();
      });

      socket.on("error", (data) => {
        console.error("Socket error:", data);
        clearTimeout(joinTimeout);
        joinReject(new Error(data.message || 'Failed to join room'));
      });

      // Wait for socket to connect before joining
      if (!socket.connected) {
        await new Promise<void>((resolve, reject) => {
          socket.once('connect', () => {
            console.log('Socket connected, now joining room');
            resolve();
          });
          socket.once('connect_error', (err) => {
            console.error('Socket connect error:', err);
            reject(new Error('Failed to connect to server'));
          });
          setTimeout(() => reject(new Error('Connection timeout')), 10000);
        });
      }

      // Join the room and wait for confirmation
      console.log('Emitting join-room:', { roomCode, userId: user?.id, displayName: user?.displayName || displayName });
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
    }
  }, [
    roomCode,
    displayName,
    user,
    isMuted,
    isVideoOff,
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
  const leaveRoom = useCallback(() => {
    const { roomId } = useMeetingStore.getState();

    if (roomId) {
      socketClient.emit("leave-room", { roomId });
    }

    pcManager.current?.closeAll();
    mediaManager.stopAll();
    socketClient.disconnect();
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

    mediaManager.toggleAudio(!newMuted);
    storeToggleMute();

    if (roomId) {
      socketClient.emit("toggle-audio", {
        roomId,
        enabled: !newMuted,
      });
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const {
      isVideoOff,
      roomId,
      toggleVideo: storeToggleVideo,
    } = useMeetingStore.getState();
    const newVideoOff = !isVideoOff;

    mediaManager.toggleVideo(!newVideoOff);
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

  return {
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
  };
}
