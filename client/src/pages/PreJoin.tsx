import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Video, VideoOff, Mic, MicOff, Settings, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  mediaManager,
  MediaManager,
  MediaDevice,
} from "@/lib/webrtc/MediaManager";
import { api } from "@/lib/api/client";

export default function PreJoin() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
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
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Get devices
        const deviceList = await MediaManager.getDevices();
        setDevices(deviceList);
      } catch (err) {
        console.error("Error accessing media:", err);
        setError("Could not access camera or microphone");
      }
    };

    initMedia();

    return () => {
      mediaManager.stopAll();
    };
  }, []);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
      });
    }
  }, [stream]);

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
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error && !roomInfo) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="card text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Room not found</h1>
          <p className="text-dark-400 mb-6">{error}</p>
          <Link to="/" className="btn btn-primary btn-md">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const cameras = devices.filter((d) => d.kind === "videoinput");
  const microphones = devices.filter((d) => d.kind === "audioinput");

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {roomInfo?.name || "Join Meeting"}
          </h1>
          <p className="text-dark-400">
            Meeting code:{" "}
            <span className="text-white font-mono">{roomCode}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="card">
            <div className="video-container bg-dark-800 mb-4">
              {isVideoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-xl transform scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-dark-700 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-dark-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleAudio}
                className={`btn btn-icon ${
                  isAudioOn ? "btn-secondary" : "btn-danger"
                }`}
                title={isAudioOn ? "Mute" : "Unmute"}
              >
                {isAudioOn ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={toggleVideo}
                className={`btn btn-icon ${
                  isVideoOn ? "btn-secondary" : "btn-danger"
                }`}
                title={isVideoOn ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn btn-secondary btn-icon"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Join Form */}
          <div className="card flex flex-col">
            {!user && (
              <div className="mb-4">
                <label
                  htmlFor="guestName"
                  className="block text-sm font-medium text-dark-300 mb-1"
                >
                  Your Name
                </label>
                <input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  className="input"
                />
              </div>
            )}

            {user && (
              <div className="mb-4 p-3 bg-dark-700 rounded-lg">
                <p className="text-sm text-dark-400">Joining as</p>
                <p className="text-white font-medium">{user.displayName}</p>
              </div>
            )}

            {/* Device Settings */}
            {showSettings && (
              <div className="mb-4 space-y-3">
                <div>
                  <label
                    htmlFor="camera-select"
                    className="block text-sm font-medium text-dark-300 mb-1"
                  >
                    Camera
                  </label>
                  <select
                    id="camera-select"
                    value={selectedCamera}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="input"
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
                  <label
                    htmlFor="mic-select"
                    className="block text-sm font-medium text-dark-300 mb-1"
                  >
                    Microphone
                  </label>
                  <select
                    id="mic-select"
                    value={selectedMic}
                    onChange={(e) => handleMicChange(e.target.value)}
                    className="input"
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

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mt-auto space-y-3">
              <button
                onClick={handleJoin}
                disabled={!user && !guestName.trim()}
                className="btn btn-primary btn-lg w-full"
              >
                Join Meeting
              </button>
              <Link to="/" className="btn btn-ghost btn-md w-full text-center">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
