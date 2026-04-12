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
import { useState, useEffect, type ReactNode } from "react";
import { useMeetingStore } from "@/store/useMeetingStore";

interface ControlButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  title: string;
  active?: boolean;
  alert?: boolean;
  badge?: ReactNode;
  compact?: boolean;
}

function ControlButton({
  icon,
  label,
  onClick,
  title,
  active = false,
  alert = false,
  badge,
  compact = false,
}: ControlButtonProps) {
  const stateClass = alert
    ? "border-red-500/20 bg-red-600 text-white hover:bg-red-500"
    : active
      ? "border-primary-400/40 bg-primary-600 text-white shadow-[0_12px_22px_rgba(49,83,189,0.28)] hover:bg-primary-500"
      : "border-[rgba(23,32,51,0.12)] bg-white/82 text-dark-800 hover:bg-white";

  const sizeClass = compact
    ? "min-w-[3rem] px-3 py-2.5"
    : "min-w-[5.25rem] px-3.5 py-3";

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition ${sizeClass} ${stateClass}`}
      title={title}
    >
      {icon}
      <span className={compact ? "hidden lg:inline" : "hidden sm:inline"}>
        {label}
      </span>
      {badge}
    </button>
  );
}

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
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (!confirmLeave) {
      return;
    }

    const timer = window.setTimeout(() => setConfirmLeave(false), 2500);
    return () => window.clearTimeout(timer);
  }, [confirmLeave]);

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

  const handleLeaveClick = () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }

    setConfirmLeave(false);
    onLeave();
  };

  const participantCount = participants.size + 1;

  return (
    <div className="border-t border-[rgba(23,32,51,0.08)] bg-white/70 px-3 py-3 backdrop-blur-xl sm:px-4">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 xl:grid xl:grid-cols-[auto_auto_auto] xl:items-center xl:justify-between xl:gap-4">
        <div className="flex items-center justify-between gap-3 xl:justify-start">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-md border border-[rgba(23,32,51,0.12)] bg-white/84 px-3.5 py-2.5 text-sm text-dark-700 transition hover:bg-white hover:text-dark-900"
            disabled={!roomCode}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-dark-300">
              Room
            </span>
            <span className="font-mono text-dark-900">
              {roomCode || "Loading..."}
            </span>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex justify-center xl:justify-self-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(23,32,51,0.12)] bg-white/82 px-2 py-2 shadow-[0_18px_40px_rgba(23,32,51,0.08)] backdrop-blur">
            <ControlButton
              onClick={onToggleMute}
              active={!isMuted}
              alert={isMuted}
              title={isMuted ? "Unmute (M)" : "Mute (M)"}
              label="Mic"
              icon={
                isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )
              }
            />
            <ControlButton
              onClick={onToggleVideo}
              active={!isVideoOff}
              alert={isVideoOff}
              title={isVideoOff ? "Turn on camera (V)" : "Turn off camera (V)"}
              label="Camera"
              icon={
                isVideoOff ? (
                  <VideoOff className="h-5 w-5" />
                ) : (
                  <Video className="h-5 w-5" />
                )
              }
            />
            <div className="hidden h-8 w-px bg-white/10 sm:block" />
            <ControlButton
              onClick={handleScreenShare}
              active={isScreenSharing}
              title={isScreenSharing ? "Stop presenting" : "Present screen"}
              label="Present"
              icon={
                isScreenSharing ? (
                  <MonitorOff className="h-5 w-5" />
                ) : (
                  <Monitor className="h-5 w-5" />
                )
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 overflow-x-auto pb-1 xl:justify-self-end xl:pb-0">
          <ControlButton
            onClick={onToggleHandRaise}
            active={isHandRaised}
            title={isHandRaised ? "Lower hand (H)" : "Raise hand (H)"}
            label="Hand"
            icon={<Hand className="h-5 w-5" />}
            compact
          />
          <ControlButton
            onClick={toggleChat}
            active={isChatOpen}
            title="Chat (C)"
            label="Chat"
            icon={<MessageSquare className="h-5 w-5" />}
            compact
            badge={
              unreadMessageCount > 0 && !isChatOpen ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </span>
              ) : undefined
            }
          />
          <ControlButton
            onClick={toggleParticipants}
            active={isParticipantsOpen}
            title="Participants (P)"
            label="People"
            icon={<Users className="h-5 w-5" />}
            compact
            badge={
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-dark-600 px-1 text-[10px] text-white">
                {participantCount}
              </span>
            }
          />
          <ControlButton
            onClick={handleLeaveClick}
            alert
            title={confirmLeave ? "Click again to leave" : "Leave meeting"}
            label={confirmLeave ? "Confirm leave" : "Leave"}
            icon={<PhoneOff className="h-5 w-5" />}
          />
        </div>
      </div>
    </div>
  );
}
