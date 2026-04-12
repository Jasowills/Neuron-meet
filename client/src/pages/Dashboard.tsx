import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarPlus, Loader2, LogOut, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api/client';
import BrandLogo from '@/components/ui/BrandLogo';

export default function Dashboard() {
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/join/${roomCode.trim()}`);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await api.post('/rooms', {
        name: roomName.trim() || undefined,
      });
      const room = response.data;
      navigate(`/join/${room.code}`);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="nm-page pb-10">
      <header className="pt-5 sm:pt-7">
        <div className="nm-shell flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/70 px-4 py-4 shadow-[0_20px_50px_rgba(23,32,51,0.06)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <BrandLogo caption="Rooms, codes, and upcoming calls" />
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="rounded-full border border-dark-200 bg-white px-4 py-2 text-sm text-dark-700 shadow-sm">
              <p className="font-semibold text-dark-900">{user?.displayName}</p>
              <p className="text-xs text-dark-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-dark-200 bg-white px-4 py-2 text-sm font-semibold text-dark-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-dark-50"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="nm-shell pt-8 sm:pt-10">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="nm-panel px-6 py-8 sm:px-8 sm:py-9">
            <p className="nm-label">Operations</p>
            <h1 className="nm-heading-lg text-[2.7rem]">Start a room or join one.</h1>
            <p className="nm-note mt-4 max-w-2xl text-base sm:text-lg">
              Create a room for a new call or enter a code for one that is already running. Both paths stay visible on the same screen.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <form onSubmit={handleCreateMeeting} className="rounded-[28px] border border-[#d7ddec] bg-white/78 p-5 shadow-[0_18px_40px_rgba(23,32,51,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <CalendarPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-dark-900">Create a meeting</h2>
                    <p className="text-sm text-dark-500">Give it a name or leave it unnamed.</p>
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="roomName" className="nm-label">Room name</label>
                  <input
                    id="roomName"
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Weekly planning"
                    className="nm-field"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="nm-btn nm-btn-primary mt-5 w-full"
                >
                  {isCreating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Create room
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="rounded-[28px] border border-[#d7ddec] bg-white/78 p-5 shadow-[0_18px_40px_rgba(23,32,51,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <UsersRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-dark-900">Join a live room</h2>
                    <p className="text-sm text-dark-500">Enter the code someone shared with you.</p>
                  </div>
                </div>

                <form onSubmit={handleJoinMeeting} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="joinCode" className="nm-label">Room code</label>
                    <input
                      id="joinCode"
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
                    className="nm-btn nm-btn-secondary w-full"
                  >
                    Continue to device check
                  </button>
                </form>
              </div>
            </div>
          </div>

          <aside className="nm-panel-dark px-6 py-8 sm:px-8 sm:py-9">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c4cfdf]">
              Quick setup
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white">
              Keep the two key actions in view.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#d3d9e6]">
              You should not have to open a modal just to start a room or hunt through menus just to join one.
            </p>

            <div className="mt-8 space-y-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-[#c4a46a]" />
                  <div>
                    <h3 className="text-base font-semibold text-white">Fewer steps to join</h3>
                    <p className="mt-2 text-sm leading-6 text-[#c8cfdd]">
                      People move from code entry to device check without unnecessary branching.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <ArrowRight className="mt-1 h-5 w-5 text-[#c4a46a]" />
                  <div>
                    <h3 className="text-base font-semibold text-white">No modal detour</h3>
                    <p className="mt-2 text-sm leading-6 text-[#c8cfdd]">
                      Room creation stays inline so hosts can act faster and keep context.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
