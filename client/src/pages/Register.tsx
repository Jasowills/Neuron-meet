import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import BrandLogo from '@/components/ui/BrandLogo';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password, displayName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nm-page flex items-center py-6 sm:py-10">
      <div className="nm-shell grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-stretch">
        <section className="nm-panel px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <Link to="/" className="inline-flex">
            <BrandLogo />
          </Link>

          <div className="mt-10 max-w-xl">
            <div className="nm-kicker">
              <BadgeCheck className="h-4 w-4" />
              Quick setup
            </div>
            <h1 className="mt-6 nm-heading-lg text-[2.8rem]">
              Create your meeting space.
            </h1>
            <p className="nm-note mt-5 text-base sm:text-lg">
              Set up your account to host rooms, invite people, and keep repeat meetings in one place.
            </p>
          </div>

          <div className="mt-10 rounded-[28px] border border-[#d7ddec] bg-white/80 p-5 shadow-[0_18px_40px_rgba(23,32,51,0.06)]">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary-700" />
              <div>
                <h2 className="text-base font-semibold text-dark-900">Built for cleaner joins</h2>
                <p className="mt-2 text-sm leading-6 text-dark-500">
                  Guests can join quickly, hosts stay in control, and repeat calls stay easy to find.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="nm-panel-dark px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <p className="nm-label text-[#d4dae7]">Create account</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Start with a room that makes sense.
          </h2>
          <p className="mt-3 max-w-md text-base leading-7 text-[#d3d9e6]">
            Add your details once, then start creating rooms and joining calls without repeating the same setup every time.
          </p>

          {error && <div className="nm-alert mt-6">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="displayName" className="nm-label text-[#d4dae7]">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="nm-field-dark"
                placeholder="Aisha Thompson"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="nm-label text-[#d4dae7]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="nm-field-dark"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="nm-label text-[#d4dae7]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="nm-field-dark"
                placeholder="Create a secure password"
                minLength={8}
                required
              />
              <p className="mt-2 text-sm text-[#aeb8cd]">Use at least 8 characters.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="nm-btn nm-btn-primary w-full"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#c5cfdf]">
            Already have access?{' '}
            <Link to="/login" className="font-semibold text-white underline decoration-white/30 underline-offset-4">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
