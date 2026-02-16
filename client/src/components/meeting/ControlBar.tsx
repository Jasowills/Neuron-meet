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
  Settings,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { useMeetingStore } from '@/store/useMeetingStore';

interface ControlBarProps {
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  onLeave: () => void;
}

export default function ControlBar({
  onToggleMute,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare,
  onLeave,
}: ControlBarProps) {
  const {
    isMuted,
    isVideoOff,
    isScreenSharing,
    isChatOpen,
    isParticipantsOpen,
    toggleChat,
    toggleParticipants,
    roomCode,
    participants,
    messages,
  } = useMeetingStore();

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!roomCode) {
      console.error('No room code available');
      return;
    }
    
    const link = `${window.location.origin}/join/${roomCode}`;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for non-HTTPS or unsupported browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
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
    <div className="h-20 bg-dark-800 border-t border-dark-700 px-4 flex items-center justify-between">
      {/* Left side - meeting info */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-white text-sm font-medium">Meeting Code</p>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 text-dark-400 hover:text-white text-sm"
            disabled={!roomCode}
          >
            <span className="font-mono">{roomCode || 'Loading...'}</span>
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Center - main controls */}
      <div className="flex items-center gap-3">
        {/* Mic toggle */}
        <button
          onClick={onToggleMute}
          className={`btn btn-icon ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'btn-secondary'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
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
            isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'btn-secondary'
          }`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? (
            <VideoOff className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </button>

        {/* Screen share */}
        <button
          onClick={handleScreenShare}
          className={`btn btn-icon ${
            isScreenSharing ? 'bg-primary-600 hover:bg-primary-700' : 'btn-secondary'
          }`}
          title={isScreenSharing ? 'Stop presenting' : 'Present'}
        >
          {isScreenSharing ? (
            <MonitorOff className="w-5 h-5" />
          ) : (
            <Monitor className="w-5 h-5" />
          )}
        </button>

        {/* Leave button */}
        <button
          onClick={onLeave}
          className="btn btn-icon bg-red-600 hover:bg-red-700 ml-4"
          title="Leave meeting"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Right side - panels */}
      <div className="flex items-center gap-2">
        {/* Chat */}
        <button
          onClick={toggleChat}
          className={`btn btn-icon relative ${
            isChatOpen ? 'bg-primary-600' : 'btn-secondary'
          }`}
          title="Chat"
        >
          <MessageSquare className="w-5 h-5" />
          {messages.length > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
              {messages.length > 99 ? '99+' : messages.length}
            </span>
          )}
        </button>

        {/* Participants */}
        <button
          onClick={toggleParticipants}
          className={`btn btn-icon relative ${
            isParticipantsOpen ? 'bg-primary-600' : 'btn-secondary'
          }`}
          title="Participants"
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
