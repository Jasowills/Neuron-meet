import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api/client';

export default function Dashboard() {
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/join/${roomCode.trim()}`);
    }
  };

  const handleCreateMeeting = async () => {
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
      setShowCreateModal(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Neuron Meet</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-white font-medium">{user?.displayName}</p>
                <p className="text-xs text-dark-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-icon"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Meeting */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">
              Create a new meeting
            </h2>
            <p className="text-dark-400 mb-6">
              Start a new meeting and invite others to join.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-md w-full"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Meeting
            </button>
          </div>

          {/* Join Meeting */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">
              Join a meeting
            </h2>
            <p className="text-dark-400 mb-6">
              Enter a meeting code to join an existing meeting.
            </p>
            <form onSubmit={handleJoinMeeting} className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="xxx-xxx-xxx"
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={!roomCode.trim()}
                className="btn btn-secondary btn-md"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4 animate-fadeIn">
            <h2 className="text-xl font-semibold text-white mb-4">
              Create Meeting
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-dark-300 mb-1">
                  Meeting Name (optional)
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Team standup"
                  className="input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary btn-md flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMeeting}
                  disabled={isCreating}
                  className="btn btn-primary btn-md flex-1"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
