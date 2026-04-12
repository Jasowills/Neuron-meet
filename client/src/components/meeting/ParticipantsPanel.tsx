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
    <div className="flex h-full flex-col bg-transparent">
      <div className="border-b border-[rgba(23,32,51,0.08)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-300">Participants</p>
            <h3 className="mt-1 text-lg font-semibold text-dark-900">People in room ({totalCount})</h3>
          </div>
          <button
            onClick={toggleParticipants}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[rgba(23,32,51,0.1)] bg-white/78 text-dark-700 transition hover:bg-white hover:text-dark-900"
            title="Close participants panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
    <div className="group relative flex items-center gap-3 rounded-[12px] border border-[rgba(23,32,51,0.1)] bg-white/70 p-3 transition hover:bg-white/86">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary-600 text-sm font-semibold text-white">
        {getInitials(participant.displayName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-dark-900 text-sm font-medium truncate">
            {participant.displayName}
          </span>
          {isLocal && <span className="text-dark-400 text-xs">(You)</span>}
          {participant.isHost && (
            <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        {participant.isScreenSharing && (
          <span className="inline-flex rounded-md border border-primary-400/25 bg-primary-500/12 px-2 py-0.5 text-[11px] font-medium text-primary-200">Presenting</span>
        )}
      </div>

      {/* Status icons */}
      <div className="flex items-center gap-1">
        {participant.isHandRaised && (
          <div className="w-6 h-6 rounded-md bg-yellow-500 flex items-center justify-center animate-hand-pulse">
            <Hand className="w-3 h-3 text-white" />
          </div>
        )}
        {participant.isMuted && (
          <div className="w-6 h-6 rounded-md bg-dark-100 flex items-center justify-center">
            <MicOff className="w-3 h-3 text-dark-300" />
          </div>
        )}
        {participant.isVideoOff && (
          <div className="w-6 h-6 rounded-md bg-dark-100 flex items-center justify-center">
            <VideoOff className="w-3 h-3 text-dark-300" />
          </div>
        )}
      </div>

      {isHostView && !isLocal && !participant.isHost && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[rgba(23,32,51,0.1)] bg-white/84 text-dark-700 opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-dark-900"
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
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-[10px] border border-[rgba(23,32,51,0.1)] bg-white/96 py-1 shadow-[0_18px_34px_rgba(23,32,51,0.12)]">
                <button
                  onClick={handleMuteParticipant}
                  className="w-full px-3 py-2 text-left text-sm text-dark-800 hover:bg-dark-50"
                >
                  Mute
                </button>
                <button
                  onClick={handleRemoveParticipant}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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
