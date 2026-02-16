import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useMeetingStore } from "@/store/useMeetingStore";
import { mediaManager } from "@/lib/webrtc/MediaManager";
import VideoGrid from "@/components/meeting/VideoGrid";
import ControlBar from "@/components/meeting/ControlBar";
import ChatPanel from "@/components/meeting/ChatPanel";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";
import { Loader2, WifiOff } from "lucide-react";

export default function Meeting() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const displayName = searchParams.get("name") || "Guest";
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState("");

  const { isChatOpen, isParticipantsOpen, isReconnecting, reset } =
    useMeetingStore();

  const hasLeft = useRef(false);

  const {
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
  } = useWebRTC({
    roomCode: roomCode || "",
    displayName,
  });

  // Join room on mount
  useEffect(() => {
    const join = async () => {
      try {
        await joinRoom();
        setIsJoining(false);
      } catch (err: any) {
        setError(err.message || "Failed to join meeting");
        setIsJoining(false);
      }
    };

    if (roomCode) {
      join();
    }

    // Cleanup on unmount - ensure camera/mic are released
    return () => {
      if (!hasLeft.current) {
        mediaManager.stopAll();
        reset();
      }
    };
  }, [roomCode, joinRoom, reset]);

  // Handle leaving
  const handleLeave = () => {
    hasLeft.current = true;
    leaveRoom();
    navigate("/");
  };

  if (isJoining) {
    return (
      <div className="h-screen bg-dark-900 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-white">Joining meeting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-dark-900 flex flex-col items-center justify-center">
        <div className="card text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Failed to join</h1>
          <p className="text-dark-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="btn btn-primary btn-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-900 flex flex-col overflow-hidden">
      {/* Reconnection overlay */}
      {isReconnecting && (
        <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center">
          <WifiOff className="w-12 h-12 text-yellow-500 mb-4" />
          <p className="text-white text-lg font-medium mb-2">Connection lost</p>
          <p className="text-dark-400">Attempting to reconnect...</p>
          <Loader2 className="w-6 h-6 animate-spin text-primary-500 mt-4" />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Video area */}
        <div className="flex-1 p-1 sm:p-4 overflow-hidden">
          <VideoGrid />
        </div>

        {/* Side panels - full screen on mobile, sidebar on desktop */}
        {(isChatOpen || isParticipantsOpen) && (
          <>
            {/* Backdrop on mobile */}
            <div
              className="absolute inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => {
                if (isChatOpen) useMeetingStore.getState().toggleChat();
                if (isParticipantsOpen)
                  useMeetingStore.getState().toggleParticipants();
              }}
            />
            <div className="absolute inset-x-0 bottom-0 top-0 md:relative md:inset-auto w-full md:w-80 border-l border-dark-800 flex flex-col bg-dark-900 z-40 max-h-full">
              {isChatOpen && (
                <ChatPanel
                  onSendMessage={sendMessage}
                  onTypingStart={sendTypingStart}
                  onTypingStop={sendTypingStop}
                />
              )}
              {isParticipantsOpen && <ParticipantsPanel />}
            </div>
          </>
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onToggleHandRaise={toggleHandRaise}
        onLeave={handleLeave}
      />
    </div>
  );
}
