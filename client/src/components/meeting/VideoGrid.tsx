import { useMemo } from "react";
import { useMeetingStore } from "@/store/useMeetingStore";
import VideoTile from "./VideoTile";

export default function VideoGrid() {
  const {
    participants,
    localParticipant,
    localStream,
    isScreenSharing,
    screenStream,
    isMuted,
    isVideoOff,
    isHandRaised,
  } = useMeetingStore();

  const participantList = useMemo(() => {
    return Array.from(participants.values());
  }, [participants]);

  const totalParticipants = participantList.length + 1; // +1 for local

  // Calculate grid layout - responsive
  const getGridClass = () => {
    if (totalParticipants === 1) return "grid-cols-1";
    if (totalParticipants === 2) return "grid-cols-1 sm:grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-1 sm:grid-cols-2";
    if (totalParticipants <= 6) return "grid-cols-2 sm:grid-cols-3";
    if (totalParticipants <= 9) return "grid-cols-2 sm:grid-cols-3";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Screen share view */}
      {(isScreenSharing || participantList.some((p) => p.isScreenSharing)) && (
        <div className="mb-4 flex-shrink-0">
          <div className="video-container max-h-[60vh]">
            {isScreenSharing && screenStream ? (
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el) el.srcObject = screenStream;
                }}
                className="w-full h-full object-contain"
              />
            ) : (
              participantList
                .filter((p) => p.isScreenSharing)
                .map((p) => (
                  <video
                    key={`screen-${p.socketId}`}
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el && p.stream) el.srcObject = p.stream;
                    }}
                    className="w-full h-full object-contain"
                  />
                ))
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm text-white">
              {isScreenSharing ? "You are presenting" : "Screen share"}
            </div>
          </div>
        </div>
      )}

      {/* Video grid */}
      <div className={`flex-1 grid ${getGridClass()} gap-2 sm:gap-4 auto-rows-fr`}>
        {/* Local video */}
        {localParticipant && (
          <VideoTile
            participant={localParticipant}
            stream={localStream}
            isLocal
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isHandRaised={isHandRaised}
          />
        )}

        {/* Remote videos */}
        {participantList.map((participant) => (
          <VideoTile
            key={participant.socketId}
            participant={participant}
            stream={participant.stream}
            isMuted={participant.isMuted}
            isVideoOff={participant.isVideoOff}
            isHandRaised={participant.isHandRaised}
          />
        ))}
      </div>
    </div>
  );
}
