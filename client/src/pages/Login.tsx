import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import BrandLogo from "@/components/ui/BrandLogo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nm-page flex items-start py-4 sm:py-8 lg:items-center lg:py-10">
      <div className="nm-shell grid gap-5 md:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <section className="nm-panel-dark px-5 py-6 sm:px-7 sm:py-8 lg:px-9 lg:py-10 xl:px-10 xl:py-12">
          <Link to="/" className="inline-flex">
            <BrandLogo caption="Back to your rooms" tone="light" />
          </Link>

          <div className="mt-10 max-w-xl">
            <div className="nm-kicker bg-white/10 text-white border-white/10">
              Quick sign in
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Get back into your next call.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#d3d9e6] sm:text-lg">
              Sign in to open rooms, invite people, and rejoin meetings you
              already have in motion.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <ShieldCheck className="h-5 w-5 text-[#c4a46a]" />
              <h2 className="mt-4 text-base font-semibold text-white">
                Guest access that stays orderly
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#c8cfdd]">
                Let outside guests join the room without turning the join flow
                into a mess.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <Sparkles className="h-5 w-5 text-[#c4a46a]" />
              <h2 className="mt-4 text-base font-semibold text-white">
                A room people can read quickly
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#c8cfdd]">
                The layout keeps the next action obvious instead of hiding it
                behind generic chrome.
              </p>
            </div>
          </div>
        </section>

        <section className="nm-panel px-5 py-6 sm:px-7 sm:py-8 lg:px-9 lg:py-10 xl:px-10 xl:py-12">
          <p className="nm-label">Sign in</p>
          <h2 className="nm-heading-lg text-[2.4rem]">Welcome back</h2>
          <p className="nm-note mt-3 max-w-md">
            Open your rooms, invite people, and move straight into the next
            session.
          </p>

          {error && <div className="nm-alert mt-6">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="nm-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="nm-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="nm-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="nm-field"
                placeholder="Enter your password"
                required
              />
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
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-dark-500">
            New to NeuronMeet?{" "}
            <Link to="/register" className="nm-link">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
