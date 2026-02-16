import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMeetingStore } from '@/store/useMeetingStore';
import VideoGrid from '@/components/meeting/VideoGrid';
import ControlBar from '@/components/meeting/ControlBar';
import ChatPanel from '@/components/meeting/ChatPanel';
import ParticipantsPanel from '@/components/meeting/ParticipantsPanel';
import { Loader2 } from 'lucide-react';

export default function Meeting() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const displayName = searchParams.get('name') || 'Guest';
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState('');

  const {
    isConnected,
    isChatOpen,
    isParticipantsOpen,
    reset,
  } = useMeetingStore();

  const {
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
  } = useWebRTC({
    roomCode: roomCode || '',
    displayName,
  });

  // Join room on mount
  useEffect(() => {
    const join = async () => {
      try {
        await joinRoom();
        setIsJoining(false);
      } catch (err: any) {
        setError(err.message || 'Failed to join meeting');
        setIsJoining(false);
      }
    };

    if (roomCode) {
      join();
    }

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [roomCode, joinRoom, reset]);

  // Handle leaving
  const handleLeave = () => {
    leaveRoom();
    navigate('/');
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
          <button onClick={() => navigate('/')} className="btn btn-primary btn-md">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-900 flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 p-4 overflow-hidden">
          <VideoGrid />
        </div>

        {/* Side panels */}
        {(isChatOpen || isParticipantsOpen) && (
          <div className="w-80 border-l border-dark-800 flex flex-col">
            {isChatOpen && (
              <ChatPanel
                onSendMessage={sendMessage}
                onTypingStart={sendTypingStart}
                onTypingStop={sendTypingStop}
              />
            )}
            {isParticipantsOpen && <ParticipantsPanel />}
          </div>
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onLeave={handleLeave}
      />
    </div>
  );
}
