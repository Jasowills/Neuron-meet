import { useMemo, useState } from "react";
import { useMeetingStore } from "@/store/useMeetingStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VideoTile from "./VideoTile";

const MAX_TILES_PER_PAGE = 9; // 3x3 max grid

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

  const [currentPage, setCurrentPage] = useState(0);

  const participantList = useMemo(() => {
    return Array.from(participants.values());
  }, [participants]);

  const isPresentationMode =
    isScreenSharing ||
    participantList.some((participant) => participant.isScreenSharing);

  // All participants including local user
  const allParticipants = useMemo(() => {
    const local = localParticipant
      ? [
          {
            ...localParticipant,
            isLocal: true,
            stream: localStream ?? undefined,
          },
        ]
      : [];
    const remote = participantList.map((p) => ({ ...p, isLocal: false }));
    return [...local, ...remote];
  }, [localParticipant, localStream, participantList]);

  const activePresenter = useMemo(() => {
    if (isScreenSharing && localParticipant) {
      return {
        ...localParticipant,
        isLocal: true,
        stream: localStream ?? undefined,
      };
    }

    const remotePresenter = participantList.find(
      (participant) => participant.isScreenSharing,
    );

    if (!remotePresenter) {
      return null;
    }

    return {
      ...remotePresenter,
      isLocal: false,
    };
  }, [isScreenSharing, localParticipant, localStream, participantList]);

  const totalParticipants = allParticipants.length;
  const totalPages = Math.ceil(totalParticipants / MAX_TILES_PER_PAGE);
  // Get participants for current page
  const visibleParticipants = useMemo(() => {
    const start = currentPage * MAX_TILES_PER_PAGE;
    const end = start + MAX_TILES_PER_PAGE;
    return allParticipants.slice(start, end);
  }, [allParticipants, currentPage]);

  // Smart grid layout based on participant count
  const getGridLayout = () => {
    const count = visibleParticipants.length;
    // Returns: { cols, rows, className }
    if (count === 1) {
      // Single participant - center with max width
      return { cols: 1, rows: 1, className: "grid-cols-1 place-items-center" };
    }
    if (count === 2) {
      // 2 participants - stack on mobile, side by side on tablet+
      return { cols: 2, rows: 1, className: "grid-cols-1 sm:grid-cols-2" };
    }
    if (count === 3) {
      return { cols: 3, rows: 1, className: "grid-cols-1 sm:grid-cols-3" };
    }
    if (count === 4) {
      return { cols: 2, rows: 2, className: "grid-cols-2" };
    }
    if (count <= 6) {
      return { cols: 3, rows: 2, className: "grid-cols-2 sm:grid-cols-3" };
    }
    // 7-9 participants: 3x3
    return { cols: 3, rows: 3, className: "grid-cols-2 sm:grid-cols-3" };
  };

  const gridLayout = getGridLayout();

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  if (isPresentationMode) {
    return (
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1320px] flex-col gap-3 sm:gap-4">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[16px] border border-[rgba(23,32,51,0.12)] bg-[linear-gradient(180deg,_rgba(16,21,32,0.98)_0%,_rgba(24,31,45,0.98)_100%)] shadow-[0_28px_70px_rgba(23,32,51,0.16)]">
          <div className="pointer-events-none absolute inset-0 rounded-[16px] border border-white/8" />
          {isScreenSharing && screenStream ? (
            <video
              autoPlay
              playsInline
              muted
              ref={(el) => {
                if (el) el.srcObject = screenStream;
              }}
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            participantList
              .filter((participant) => participant.isScreenSharing)
              .map((participant) => (
                <video
                  key={`screen-${participant.socketId}`}
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && participant.stream)
                      el.srcObject = participant.stream;
                  }}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ))
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(7,12,20,0.84)] via-[rgba(7,12,20,0.28)] to-transparent px-4 py-4 sm:px-6">
            <div>
              <div>
                <p className="text-sm font-medium text-white/85 sm:text-base">
                  {isScreenSharing
                    ? "You are presenting"
                    : `${activePresenter?.displayName || "A participant"} is presenting`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 overflow-x-auto pb-1">
          <div className="mx-auto flex min-w-full max-w-[1320px] justify-start gap-3 rounded-[14px] border border-[rgba(23,32,51,0.12)] bg-[rgba(255,255,255,0.56)] px-3 py-3 shadow-[0_10px_26px_rgba(23,32,51,0.05)]">
            {allParticipants.map((participant) => (
              <div
                key={participant.socketId}
                className="w-[132px] shrink-0 sm:w-[156px] lg:w-[188px]"
              >
                <div className="aspect-video">
                  <VideoTile
                    participant={participant}
                    stream={participant.stream}
                    isLocal={participant.isLocal}
                    isMuted={
                      participant.isLocal ? isMuted : participant.isMuted
                    }
                    isVideoOff={
                      participant.isLocal ? isVideoOff : participant.isVideoOff
                    }
                    isHandRaised={
                      participant.isLocal
                        ? isHandRaised
                        : participant.isHandRaised
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1320px] flex-col">
      {/* Video grid with pagination */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Grid container */}
        <div
          className={`flex-1 grid ${gridLayout.className} content-center items-center gap-2 p-1.5 sm:gap-3 sm:p-3 lg:gap-4 lg:p-4`}
        >
          {visibleParticipants.map((participant) => (
            <div
              key={participant.socketId}
              className={`relative w-full ${
                visibleParticipants.length === 1
                  ? "max-w-4xl w-full aspect-video mx-auto"
                  : "aspect-video"
              }`}
            >
              <VideoTile
                participant={participant}
                stream={participant.stream}
                isLocal={participant.isLocal}
                isMuted={participant.isLocal ? isMuted : participant.isMuted}
                isVideoOff={
                  participant.isLocal ? isVideoOff : participant.isVideoOff
                }
                isHandRaised={
                  participant.isLocal ? isHandRaised : participant.isHandRaised
                }
              />
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-3">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="btn btn-secondary btn-icon disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentPage
                      ? "bg-primary-500"
                      : "bg-dark-600 hover:bg-dark-500"
                  }`}
                  aria-label={`Page ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              className="btn btn-secondary btn-icon disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
