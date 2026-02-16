import { useEffect, useRef } from "react";
import { MicOff, Crown, Hand } from "lucide-react";
import { Participant } from "@/store/useMeetingStore";
import { useVoiceActivity } from "@/hooks/useVoiceActivity";

interface VideoTileProps {
  participant: Participant;
  stream?: MediaStream | null;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean;
}

export default function VideoTile({
  participant,
  stream,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  isHandRaised = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect if this participant is speaking
  const isSpeaking = useVoiceActivity(stream, { enabled: !isMuted });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`video-container relative group transition-all duration-200 ${isSpeaking ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-dark-900' : ''}`}>
      {/* Video or Avatar */}
      {!isVideoOff && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? "transform scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl md:text-2xl font-semibold">
            {getInitials(participant.displayName)}
          </div>
        </div>
      )}

      {/* Bottom overlay with name and icons */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {participant.isHost && (
              <Crown className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-white text-sm font-medium truncate">
              {participant.displayName}
              {isLocal && " (You)"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isHandRaised && (
              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center animate-hand-pulse">
                <Hand className="w-3 h-3 text-white" />
              </div>
            )}
            {isMuted && (
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hand raised indicator at top */}
      {isHandRaised && (
        <div className="absolute top-2 right-2">
          <div className="px-2 py-1 bg-yellow-500 rounded-full text-xs text-white font-medium flex items-center gap-1 animate-hand-pulse">
            <Hand className="w-3 h-3" />
            <span>Hand raised</span>
          </div>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-2 left-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs text-white font-medium">Speaking</span>
          </div>
        </div>
      )}
    </div>
  );
}
