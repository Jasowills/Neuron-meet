import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Video, Users, Shield, Zap } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const [roomCode, setRoomCode] = useState("");
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/join/${roomCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <Video className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">
                Neuron Meet
              </span>
            </div>
            <nav className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary btn-sm sm:btn-md"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-ghost btn-sm sm:btn-md text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-sm sm:btn-md text-sm whitespace-nowrap"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            Video meetings for
            <span className="text-primary-500 block sm:inline"> everyone</span>
          </h1>
          <p className="text-base sm:text-xl text-dark-300 mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
            Connect, collaborate, and create with secure, high-quality video
            conferencing. No downloads required.
          </p>

          {/* Join/Create Actions */}
          <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 px-2 sm:px-0">
            <form
              onSubmit={handleJoinMeeting}
              className="flex flex-col gap-3 w-full max-w-sm sm:max-w-none sm:w-auto"
            >
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter meeting code"
                className="input w-full sm:w-64 text-center sm:text-left"
              />
              <button
                type="submit"
                disabled={!roomCode.trim()}
                className="btn btn-secondary btn-md w-full sm:w-auto"
              >
                Join
              </button>
            </form>
            <span className="text-dark-500 text-sm">or</span>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="btn btn-primary btn-md sm:btn-lg w-full max-w-sm sm:w-auto"
            >
              Start a meeting
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto px-2 sm:px-0">
            <div className="card text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Easy Collaboration
              </h3>
              <p className="text-dark-400 text-sm">
                Share your screen, chat in real-time, and collaborate with up to
                50 participants.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Secure by Design
              </h3>
              <p className="text-dark-400 text-sm">
                End-to-end encryption and waiting rooms keep your meetings
                private and secure.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Lightning Fast
              </h3>
              <p className="text-dark-400 text-sm">
                Peer-to-peer connections ensure low latency and high-quality
                video for everyone.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-6 sm:py-8 mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-dark-500 text-xs sm:text-sm">
          <p>&copy; 2026 Neuron Meet. Built with WebRTC.</p>
        </div>
      </footer>
    </div>
  );
}
