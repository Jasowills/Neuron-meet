import { X, Crown, MicOff, VideoOff, MoreVertical, Hand } from "lucide-react";
import { useMemo, useState } from "react";
import { useMeetingStore, Participant } from "@/store/useMeetingStore";
import { socketClient } from "@/lib/socket/SocketClient";

export default function ParticipantsPanel() {
  const {
    participants,
    localParticipant,
    toggleParticipants,
    isHost,
    roomId,
    isMuted,
    isVideoOff,
    isHandRaised,
  } = useMeetingStore();

  const participantList = useMemo(() => {
    return Array.from(participants.values());
  }, [participants]);

  const totalCount = participantList.length + 1;

  return (
    <div className="flex flex-col h-full bg-dark-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700">
        <h3 className="text-white font-semibold">
          Participants ({totalCount})
        </h3>
        <button onClick={toggleParticipants} className="btn btn-ghost btn-icon" title="Close participants panel">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Local participant */}
        {localParticipant && (
          <ParticipantItem
            participant={{
              ...localParticipant,
              isMuted,
              isVideoOff,
              isHandRaised,
            }}
            isLocal
            isHostView={isHost}
            roomId={roomId}
          />
        )}

        {/* Remote participants */}
        {participantList.map((participant) => (
          <ParticipantItem
            key={participant.socketId}
            participant={participant}
            isHostView={isHost}
            roomId={roomId}
          />
        ))}
      </div>
    </div>
  );
}

function ParticipantItem({
  participant,
  isLocal = false,
  isHostView = false,
  roomId,
}: {
  participant: Participant;
  isLocal?: boolean;
  isHostView?: boolean;
  roomId?: string | null;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMuteParticipant = () => {
    if (roomId) {
      socketClient.emit("mute-participant", {
        roomId,
        targetId: participant.socketId,
      });
    }
    setShowMenu(false);
  };

  const handleRemoveParticipant = () => {
    if (roomId) {
      socketClient.emit("remove-participant", {
        roomId,
        targetId: participant.socketId,
      });
    }
    setShowMenu(false);
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700 group relative">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
        {getInitials(participant.displayName)}
      </div>

      {/* Name and status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium truncate">
            {participant.displayName}
          </span>
          {isLocal && <span className="text-dark-400 text-xs">(You)</span>}
          {participant.isHost && (
            <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        {participant.isScreenSharing && (
          <span className="text-primary-400 text-xs">Presenting</span>
        )}
      </div>

      {/* Status icons */}
      <div className="flex items-center gap-1">
        {participant.isHandRaised && (
          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center animate-hand-pulse">
            <Hand className="w-3 h-3 text-white" />
          </div>
        )}
        {participant.isMuted && (
          <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center">
            <MicOff className="w-3 h-3 text-dark-300" />
          </div>
        )}
        {participant.isVideoOff && (
          <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center">
            <VideoOff className="w-3 h-3 text-dark-300" />
          </div>
        )}
      </div>

      {/* Host controls */}
      {isHostView && !isLocal && !participant.isHost && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="btn btn-ghost btn-icon opacity-0 group-hover:opacity-100"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-dark-700 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={handleMuteParticipant}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-dark-600"
                >
                  Mute
                </button>
                <button
                  onClick={handleRemoveParticipant}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-600"
                >
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
