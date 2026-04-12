import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  Loader2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import BrandLogo from "@/components/ui/BrandLogo";
import {
  mediaManager,
  MediaManager,
  MediaDevice,
} from "@/lib/webrtc/MediaManager";
import { api } from "@/lib/api/client";

interface RoomParticipant {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isHost: boolean;
}

export default function PreJoin() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isJoiningRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);

  const [devices, setDevices] = useState<MediaDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMic, setSelectedMic] = useState("");

  // Fetch room info
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/rooms/code/${roomCode}`);
        setRoomInfo(response.data);
        setIsLoading(false);

        // Fetch active participants
        try {
          const participantsRes = await api.get(
            `/rooms/code/${roomCode}/participants`,
          );
          setParticipants(participantsRes.data);
        } catch {
          // Ignore participant fetch errors
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Room not found");
        setIsLoading(false);
      }
    };

    if (roomCode) {
      fetchRoom();
    }
  }, [roomCode]);

  // Get media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await mediaManager.getLocalStream();
        streamRef.current = mediaStream;
        setStream(mediaStream);

        // Get devices
        const deviceList = await MediaManager.getDevices();
        setDevices(deviceList);
      } catch (err) {
        console.error("Error accessing media:", err);
        setError("Could not access camera or microphone");
      }
    };

    initMedia();

    // Cleanup: only stop streams if NOT joining the meeting
    return () => {
      if (!isJoiningRef.current) {
        // User canceled or navigated away - stop the camera
        mediaManager.stopAll();
      }
      // If joining, the Meeting page will take over stream management
    };
  }, []);

  // Attach stream to video element - only when stream changes
  useEffect(() => {
    const video = videoRef.current;
    const currentStream = streamRef.current;

    if (video && currentStream) {
      // Only set srcObject if it's different to avoid reload
      if (video.srcObject !== currentStream) {
        video.srcObject = currentStream;
        video.play().catch(() => {
          // Autoplay may be blocked, that's ok
        });
      }
    }
  }, [stream]);

  // Callback ref to attach stream when video element mounts
  const handleVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && streamRef.current) {
        node.srcObject = streamRef.current;
        node.play().catch(() => {});
      }
    },
    [stream],
  );

  const toggleVideo = () => {
    mediaManager.toggleVideo(!isVideoOn);
    setIsVideoOn(!isVideoOn);
  };

  const toggleAudio = () => {
    mediaManager.toggleAudio(!isAudioOn);
    setIsAudioOn(!isAudioOn);
  };

  const handleJoin = () => {
    if (!user && !guestName.trim()) {
      setError("Please enter your name");
      return;
    }

    // Mark that we're joining - don't stop the stream on cleanup
    isJoiningRef.current = true;

    // Store initial state in URL or session
    const queryParams = new URLSearchParams({
      video: isVideoOn.toString(),
      audio: isAudioOn.toString(),
      name: user?.displayName || guestName,
    });

    navigate(`/meeting/${roomCode}?${queryParams.toString()}`);
  };

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    try {
      await mediaManager.switchCamera(deviceId);
      setStream(mediaManager.getLocalStreamRef());
    } catch (err) {
      console.error("Error switching camera:", err);
    }
  };

  const handleMicChange = async (deviceId: string) => {
    setSelectedMic(deviceId);
    try {
      await mediaManager.switchMicrophone(deviceId);
    } catch (err) {
      console.error("Error switching microphone:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="nm-page flex items-center justify-center">
        <div className="nm-panel px-8 py-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-sm font-medium text-dark-700">
            Preparing your meeting preview...
          </p>
        </div>
      </div>
    );
  }

  if (error && !roomInfo) {
    return (
      <div className="nm-page flex items-center justify-center px-4">
        <div className="nm-panel max-w-md px-8 py-8 text-center">
          <h1 className="nm-heading-lg text-[2.2rem]">Room not found</h1>
          <p className="nm-note mt-3">{error}</p>
          <Link to="/" className="nm-btn nm-btn-primary mt-6">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  const cameras = devices.filter((d) => d.kind === "videoinput");
  const microphones = devices.filter((d) => d.kind === "audioinput");

  return (
    <div className="nm-page pb-10 pt-5 sm:pt-7">
      <div className="nm-shell">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/70 px-4 py-4 shadow-[0_20px_50px_rgba(23,32,51,0.06)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <BrandLogo caption="Pre-join check" />
          <div className="flex flex-wrap items-center gap-3 text-sm text-dark-600">
            <span className="nm-chip">
              <ShieldCheck className="h-4 w-4 text-primary-700" />
              {participants.length} active{" "}
              {participants.length === 1 ? "participant" : "participants"}
            </span>
            <span className="nm-chip">
              Room code{" "}
              <strong className="font-mono text-dark-900">{roomCode}</strong>
            </span>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="nm-panel-dark px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bfc9da]">
                  Preview
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {roomInfo?.name || "Join meeting"}
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#c8cfdd] sm:text-base">
                  Check how you look and sound before you enter the room.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#dce2ed]">
                {isVideoOn ? "Camera ready" : "Camera off"} ·{" "}
                {isAudioOn ? "Mic live" : "Mic muted"}
              </div>
            </div>

            <div className="video-container mt-6 bg-dark-950/70">
              <video
                ref={handleVideoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover rounded-xl transform scale-x-[-1] transition-opacity duration-200 ${
                  isVideoOn ? "opacity-100" : "opacity-0"
                }`}
              />
              {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
                    <VideoOff className="w-8 h-8 text-dark-400" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                onClick={toggleAudio}
                className={`nm-btn ${
                  isAudioOn ? "nm-btn-tertiary" : "bg-red-600 text-white"
                }`}
                title={isAudioOn ? "Mute" : "Unmute"}
              >
                {isAudioOn ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
                <span>{isAudioOn ? "Mute mic" : "Unmute mic"}</span>
              </button>
              <button
                onClick={toggleVideo}
                className={`nm-btn ${
                  isVideoOn ? "nm-btn-tertiary" : "bg-red-600 text-white"
                }`}
                title={isVideoOn ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
                <span>{isVideoOn ? "Turn camera off" : "Turn camera on"}</span>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="nm-btn nm-btn-tertiary"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
                <span>{showSettings ? "Hide devices" : "Choose devices"}</span>
              </button>
            </div>
          </section>

          <section className="nm-panel flex flex-col px-6 py-6 sm:px-7 sm:py-7">
            <div>
              <p className="nm-label">Join details</p>
              <h2 className="nm-heading-lg text-[2.2rem]">
                Join without a last-minute scramble.
              </h2>
              <p className="nm-note mt-3">
                Confirm your name, your devices, and the room before you join.
              </p>
            </div>

            {!user && (
              <div className="mt-6">
                <label htmlFor="guestName" className="nm-label">
                  Display name
                </label>
                <input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Name people will see in the room"
                  className="nm-field"
                />
              </div>
            )}

            {user && (
              <div className="mt-6 rounded-[24px] border border-[#d7ddec] bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dark-500">
                  Joining as
                </p>
                <p className="mt-2 text-lg font-semibold text-dark-900">
                  {user.displayName}
                </p>
              </div>
            )}

            {participants.length > 0 && (
              <div className="mt-5 rounded-[24px] border border-[#d7ddec] bg-white/80 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary-700" />
                  <p className="text-sm font-medium text-dark-700">
                    {participants.length}{" "}
                    {participants.length === 1 ? "person" : "people"} already in
                    the room
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {participants.slice(0, 5).map((p, index) => (
                    <div
                      key={p.id}
                      className="relative group"
                      title={p.displayName}
                    >
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className={`h-8 w-8 rounded-full border-2 border-white ${
                            index > 0 ? "-ml-2" : "ml-0"
                          }`}
                        />
                      ) : (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary-600 text-xs font-medium text-white ${
                            index > 0 ? "-ml-2" : "ml-0"
                          }`}
                        >
                          {p.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                  {participants.length > 5 && (
                    <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-dark-200 text-xs font-medium text-dark-900">
                      +{participants.length - 5}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-dark-500">
                  {participants
                    .slice(0, 3)
                    .map((p) => p.displayName)
                    .join(", ")}
                  {participants.length > 3 &&
                    ` and ${participants.length - 3} more`}
                </div>
              </div>
            )}

            {showSettings && (
              <div className="mt-5 space-y-4 rounded-[24px] border border-[#d7ddec] bg-white/80 p-4">
                <div>
                  <label htmlFor="camera-select" className="nm-label">
                    Camera
                  </label>
                  <select
                    id="camera-select"
                    value={selectedCamera}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="nm-field"
                    aria-label="Select camera"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="mic-select" className="nm-label">
                    Microphone
                  </label>
                  <select
                    id="mic-select"
                    value={selectedMic}
                    onChange={(e) => handleMicChange(e.target.value)}
                    className="nm-field"
                    aria-label="Select microphone"
                  >
                    {microphones.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && <div className="nm-alert mt-5">{error}</div>}

            <div className="mt-auto pt-6 space-y-3">
              <button
                onClick={handleJoin}
                disabled={!user && !guestName.trim()}
                className="nm-btn nm-btn-primary w-full"
              >
                Join room
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/"
                className="nm-btn nm-btn-secondary w-full text-center"
              >
                Back to home
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
