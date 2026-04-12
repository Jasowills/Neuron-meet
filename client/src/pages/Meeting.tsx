import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useMeetingStore } from "@/store/useMeetingStore";
import VideoGrid from "@/components/meeting/VideoGrid";
import ControlBar from "@/components/meeting/ControlBar";
import ChatPanel from "@/components/meeting/ChatPanel";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";
import { Loader2, WifiOff } from "lucide-react";

export default function Meeting() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const displayName = searchParams.get("name") || "Participant";
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState("");

  const {
    isChatOpen,
    isParticipantsOpen,
    isReconnecting,
    isScreenSharing,
    participants,
  } = useMeetingStore();

  const hasLeft = useRef(false);
  const hasJoined = useRef(false);

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

  const joinRoomRef = useRef(joinRoom);
  const leaveRoomRef = useRef(leaveRoom);

  useEffect(() => {
    joinRoomRef.current = joinRoom;
    leaveRoomRef.current = leaveRoom;
  }, [joinRoom, leaveRoom]);

  // Join room on mount
  useEffect(() => {
    if (!roomCode || hasJoined.current) {
      return;
    }
    hasJoined.current = true;

    const join = async () => {
      try {
        await joinRoomRef.current();
        setIsJoining(false);
      } catch (err: any) {
        setError(err.message || "We couldn't join the room");
        setIsJoining(false);
      }
    };

    join();

    // Cleanup on unmount - ensure socket and media are released
    return () => {
      if (!hasLeft.current) {
        leaveRoomRef.current({ silent: true });
      }
      hasJoined.current = false;
    };
  }, [roomCode]);

  // Handle leaving
  const handleLeave = () => {
    hasLeft.current = true;
    leaveRoom();
    navigate("/");
  };

  const participantCount = participants.size + 1;

  if (isJoining) {
    return (
      <div className="h-screen bg-dark-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-white text-lg font-medium">Joining room...</p>
        <p className="mt-2 text-sm text-dark-300">
          Checking your connection and pulling the room state.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-dark-900 flex flex-col items-center justify-center">
        <div className="card text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">
            Couldn't join the room
          </h1>
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
    <div className="flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(32,55,138,0.12),_transparent_28%),linear-gradient(180deg,_#fbfaf7_0%,_#f3efe7_56%,_#ece6da_100%)] text-dark-900">
      {/* Reconnection overlay */}
      {isReconnecting && (
        <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center">
          <WifiOff className="w-12 h-12 text-yellow-500 mb-4" />
          <p className="text-white text-lg font-medium mb-2">
            Connection dropped
          </p>
          <p className="text-dark-300">Trying to reconnect you to the room.</p>
          <Loader2 className="w-6 h-6 animate-spin text-primary-500 mt-4" />
        </div>
      )}

      <div className="border-b border-[rgba(23,32,51,0.08)] bg-white/72 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3 lg:px-5">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-dark-300">
                Neuronmeet room
              </p>
              <p className="mt-1 truncate text-base font-semibold text-dark-900 sm:text-lg">
                Meeting room
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-dark-500">
            <span className="inline-flex items-center rounded-md border border-[rgba(23,32,51,0.1)] bg-white/78 px-3 py-1.5 text-xs font-medium text-dark-700 shadow-[0_8px_24px_rgba(23,32,51,0.05)]">
              {participantCount}{" "}
              {participantCount === 1 ? "participant" : "participants"}
            </span>
            {isScreenSharing && (
              <span className="inline-flex items-center rounded-md border border-primary-400/20 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700">
                {displayName} is presenting
              </span>
            )}
            <span className="text-xs text-dark-400">
              Signed in as {displayName}
            </span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative mx-auto flex w-full max-w-[1500px] min-h-0 flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 overflow-hidden p-2 sm:p-3 lg:p-4 xl:p-5">
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
            <div className="absolute inset-x-0 bottom-0 top-0 z-40 flex max-h-full w-full flex-col border-l border-[rgba(23,32,51,0.08)] bg-[rgba(255,255,255,0.82)] backdrop-blur-xl md:relative md:inset-auto md:w-[22rem] md:rounded-l-[14px] md:border md:border-[rgba(23,32,51,0.08)] md:shadow-[0_18px_40px_rgba(23,32,51,0.08)] lg:w-96">
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
