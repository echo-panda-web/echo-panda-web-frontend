import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../routes/authContext";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await requestPasswordReset(email);

      if (!result.success) {
        setError(result.error || "Failed to send reset email.");
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) console.error("Forgot password error", err);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset your password</h1>
          <p className="text-slate-400 text-sm">
            Enter your email and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-100 text-sm text-center">
                Reset link sent to <span className="font-semibold">{email.trim()}</span>.
                Check your inbox and follow the link to choose a new password.
              </div>
              <p className="text-slate-400 text-sm text-center">
                After resetting, you&apos;ll be redirected to sign in.
              </p>
              <Link
                to="/login"
                className="block w-full py-3.5 text-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3.5 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold transition-all ${
                  loading
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-indigo-500 active:scale-[0.99]"
                }`}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          {!success && (
            <div className="text-center mt-6 pt-6 border-t border-white/10">
              <Link
                to="/login"
                className="text-sm text-slate-400 hover:text-indigo-300 transition-colors"
              >
                ← Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
