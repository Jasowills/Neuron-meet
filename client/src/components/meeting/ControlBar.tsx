import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  PhoneOff,
  Hand,
  Copy,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useMeetingStore } from "@/store/useMeetingStore";

interface ControlBarProps {
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  onToggleHandRaise: () => void;
  onLeave: () => void;
}

export default function ControlBar({
  onToggleMute,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare,
  onToggleHandRaise,
  onLeave,
}: ControlBarProps) {
  const {
    isMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    isChatOpen,
    isParticipantsOpen,
    toggleChat,
    toggleParticipants,
    roomCode,
    participants,
    unreadMessageCount,
  } = useMeetingStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "m":
          onToggleMute();
          break;
        case "v":
          onToggleVideo();
          break;
        case "h":
          onToggleHandRaise();
          break;
        case "c":
          toggleChat();
          break;
        case "p":
          toggleParticipants();
          break;
        case "escape":
          // Show leave confirmation or close panels
          if (isChatOpen) toggleChat();
          else if (isParticipantsOpen) toggleParticipants();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onToggleMute,
    onToggleVideo,
    onToggleHandRaise,
    toggleChat,
    toggleParticipants,
    isChatOpen,
    isParticipantsOpen,
  ]);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!roomCode) {
      console.error("No room code available");
      return;
    }

    const link = `${window.location.origin}/join/${roomCode}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for non-HTTPS or unsupported browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error("Failed to copy:", e);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleScreenShare = () => {
    if (isScreenSharing) {
      onStopScreenShare();
    } else {
      onStartScreenShare();
    }
  };

  const participantCount = participants.size + 1;

  return (
    <div className="h-16 sm:h-20 bg-dark-800 border-t border-dark-700 px-3 sm:px-4 flex items-center justify-center sm:justify-between">
      {/* Left side - meeting info (hidden on mobile) */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
        <div>
          <p className="text-white text-sm font-medium">Meeting Code</p>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 text-dark-400 hover:text-white text-sm"
            disabled={!roomCode}
          >
            <span className="font-mono">{roomCode || "Loading..."}</span>
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Center - main controls */}
      <div className="flex items-center gap-3 sm:gap-3">
        {/* Mic toggle */}
        <button
          onClick={onToggleMute}
          className={`btn btn-icon ${
            isMuted ? "bg-red-500 hover:bg-red-600" : "btn-secondary"
          }`}
          title={isMuted ? "Unmute (M)" : "Mute (M)"}
        >
          {isMuted ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Camera toggle */}
        <button
          onClick={onToggleVideo}
          className={`btn btn-icon ${
            isVideoOff ? "bg-red-500 hover:bg-red-600" : "btn-secondary"
          }`}
          title={isVideoOff ? "Turn on camera (V)" : "Turn off camera (V)"}
        >
          {isVideoOff ? (
            <VideoOff className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </button>

        {/* Screen share - hidden on mobile */}
        <button
          onClick={handleScreenShare}
          className={`btn btn-icon hidden sm:flex ${
            isScreenSharing
              ? "bg-primary-600 hover:bg-primary-700"
              : "btn-secondary"
          }`}
          title={isScreenSharing ? "Stop presenting (S)" : "Present (S)"}
        >
          {isScreenSharing ? (
            <MonitorOff className="w-5 h-5" />
          ) : (
            <Monitor className="w-5 h-5" />
          )}
        </button>

        {/* Hand raise - hidden on small mobile */}
        <button
          onClick={onToggleHandRaise}
          className={`btn btn-icon hidden xs:flex ${
            isHandRaised
              ? "bg-yellow-500 hover:bg-yellow-600 animate-hand-pulse"
              : "btn-secondary"
          }`}
          title={isHandRaised ? "Lower hand (H)" : "Raise hand (H)"}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Divider on mobile */}
        <div className="w-px h-6 bg-dark-600 sm:hidden" />

        {/* Chat - shown inline on mobile */}
        <button
          onClick={toggleChat}
          className={`btn btn-icon relative sm:hidden ${
            isChatOpen ? "bg-primary-600" : "btn-secondary"
          }`}
          title="Chat (C)"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessageCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 bg-red-500 rounded-full text-xs flex items-center justify-center px-1">
              {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
            </span>
          )}
        </button>

        {/* Participants - shown inline on mobile */}
        <button
          onClick={toggleParticipants}
          className={`btn btn-icon relative sm:hidden ${
            isParticipantsOpen ? "bg-primary-600" : "btn-secondary"
          }`}
          title="Participants (P)"
        >
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 bg-dark-600 rounded-full text-xs flex items-center justify-center px-1">
            {participantCount}
          </span>
        </button>

        {/* Leave button */}
        <button
          onClick={onLeave}
          className="btn btn-icon bg-red-600 hover:bg-red-700"
          title="Leave meeting"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Right side - panels */}
      <div className="hidden sm:flex items-center gap-2">
        {/* Chat */}
        <button
          onClick={toggleChat}
          className={`btn btn-icon relative ${
            isChatOpen ? "bg-primary-600" : "btn-secondary"
          }`}
          title="Chat (C)"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessageCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 bg-red-500 rounded-full text-xs flex items-center justify-center px-1">
              {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
            </span>
          )}
        </button>

        {/* Participants */}
        <button
          onClick={toggleParticipants}
          className={`btn btn-icon relative ${
            isParticipantsOpen ? "bg-primary-600" : "btn-secondary"
          }`}
          title="Participants (P)"
        >
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 bg-dark-600 rounded-full text-xs flex items-center justify-center px-1">
            {participantCount}
          </span>
        </button>
      </div>
    </div>
  );
}
