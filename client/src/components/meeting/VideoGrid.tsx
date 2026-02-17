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
                muted
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

      {/* Video grid with pagination */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Grid container */}
        <div
          className={`flex-1 grid ${gridLayout.className} gap-2 sm:gap-3 content-center items-center p-2 sm:p-4`}
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
