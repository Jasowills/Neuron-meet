import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Command,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import BrandLogo from "@/components/ui/BrandLogo";

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
    <div className="nm-page pb-12">
      <header className="pt-5 sm:pt-7">
        <div className="nm-shell flex items-center justify-between rounded-[32px] border border-white/60 bg-white/65 px-4 py-4 shadow-[0_20px_50px_rgba(23,32,51,0.06)] backdrop-blur md:px-6">
          <BrandLogo />
          <nav className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link to="/dashboard" className="nm-btn nm-btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-dark-700 transition hover:bg-white/70"
                >
                  Sign in
                </Link>
                <Link to="/register" className="nm-btn nm-btn-primary px-5 py-2.5 text-sm">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="nm-shell pt-8 sm:pt-10">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:items-stretch">
          <div className="nm-mesh nm-panel px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="relative z-[1] max-w-3xl">
              <div className="nm-kicker mb-6">
                <Briefcase className="h-4 w-4" />
                For standups, client reviews, and weekly team calls
              </div>
              <h1 className="nm-heading-xl max-w-4xl">
                Video calls that start without the scramble.
              </h1>
              <p className="nm-subtitle mt-6 max-w-2xl">
                Join from a code, check your camera and mic, and get into the room
                without hunting through settings or explaining the interface to other people.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="nm-stat">
                  <strong>&lt;10 sec</strong>
                  <span>Typical path from code entry to device check</span>
                </div>
                <div className="nm-stat">
                  <strong>50 seats</strong>
                  <span>Room size for team reviews, classes, and client sessions</span>
                </div>
                <div className="nm-stat">
                  <strong>Zero install</strong>
                  <span>Browser access for invited people and account holders</span>
                </div>
              </div>

              <div className="nm-divider my-8" />

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="nm-chip">
                  <ShieldCheck className="h-4 w-4 text-primary-700" />
                  Waiting room support
                </div>
                <div className="nm-chip">
                  <Waypoints className="h-4 w-4 text-primary-700" />
                  Screen share and chat
                </div>
                <div className="nm-chip">
                  <Command className="h-4 w-4 text-primary-700" />
                  Keyboard shortcuts
                </div>
              </div>
            </div>
          </div>

          <aside className="nm-panel px-6 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="nm-label">Primary action</p>
                <h2 className="nm-heading-lg text-[2rem]">Join with a code</h2>
              </div>
              <BadgeCheck className="mt-1 h-6 w-6 text-[#b89459]" />
            </div>

            <p className="nm-note mt-3">
              Enter your code, check your devices, and join the room.
            </p>

            <form onSubmit={handleJoinMeeting} className="mt-8 space-y-4">
              <div>
                <label htmlFor="roomCode" className="nm-label">
                  Meeting code
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Paste or type the room code"
                  className="nm-field"
                />
              </div>
              <button
                type="submit"
                disabled={!roomCode.trim()}
                className="nm-btn nm-btn-primary w-full"
              >
                Continue to device check
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="nm-divider my-6" />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="nm-btn nm-btn-secondary"
              >
                {user ? "Open dashboard" : "Create account"}
              </Link>
              {!user && (
                <Link to="/login" className="nm-btn nm-btn-secondary">
                  Sign in
                </Link>
              )}
            </div>

            <div className="mt-6 rounded-[24px] bg-[#172033] px-5 py-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c4cddd]">
                Why teams pick it
              </p>
              <div className="mt-4 space-y-3 text-sm text-[#d9dfeb]">
                <p>Purpose-built pre-join checks reduce awkward call starts.</p>
                <p>Hosts can share, manage people, and move through the room without guesswork.</p>
                <p>Guests can join quickly without creating friction for the rest of the call.</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="nm-panel px-6 py-6 sm:px-7 sm:py-7">
            <p className="nm-label">Operational reliability</p>
            <h3 className="text-2xl font-bold tracking-tight text-dark-900">
              Clear meeting flow, not extra ceremony.
            </h3>
            <p className="nm-note mt-3 max-w-2xl">
              The product is built around three jobs: get in fast, check your setup, and stay in control once the call starts.
            </p>
          </div>
          <div className="nm-panel px-6 py-6">
            <ShieldCheck className="h-6 w-6 text-primary-700" />
            <h3 className="mt-5 text-lg font-bold text-dark-900">Room controls</h3>
            <p className="nm-note mt-2">
              Waiting rooms, guest access, and clear host roles for meetings with people outside your team.
            </p>
          </div>
          <div className="nm-panel px-6 py-6">
            <Waypoints className="h-6 w-6 text-primary-700" />
            <h3 className="mt-5 text-lg font-bold text-dark-900">In-call tools</h3>
            <p className="nm-note mt-2">
              Screen sharing, chat, and participant tools that stay available without taking over the room.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
