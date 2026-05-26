import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BgImage from "../assets/registerBG.png";
import {
  SignInWithGoogle,
  completeGoogleRedirectSignIn,
  registerWithEmail,
} from "../routes/authContext";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const redirectHandledRef = useRef(false);

  useEffect(() => {
    if (redirectHandledRef.current) {
      return;
    }
    redirectHandledRef.current = true;

    const finishGoogleRegister = async (): Promise<void> => {
      try {
        const user = await completeGoogleRedirectSignIn();
        if (user) {
          console.log("Google registration success:", user);
          void navigate("/");
        }
      } catch (err) {
        console.error("Failed to complete Google redirect registration", err);
        setError("Failed to register with Google. Please try again.");
      }
    };

    void finishGoogleRegister();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await registerWithEmail(
        formData.username,
        formData.email,
        formData.password,
        formData.confirmPassword
      );

      if (!result.success) {
        setError(result.error || "Failed to register");
        setLoading(false);
        return;
      }

      console.log("Registration success", result.user);
      void navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) console.error("Registration error", err);
      setError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = await SignInWithGoogle();
      if (!user) {
        return;
      }

      console.log("Google registration success:", user);
      void navigate("/");
    } catch (err: any) {
      console.error("Failed to register with Google", err);

      // Handle popup closed by user
      if (err?.code === "auth/popup-closed-by-user") {
        setError(null); // Don't show error, user intentionally closed popup
      } else if (err?.code === "auth/cancelled-popup-request") {
        setError(null); // Another popup was opened, ignore
      } else {
        setError("Failed to register with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden"
      style={{
        backgroundImage: `url(${BgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Glassmorphism Card */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl p-10 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Create Account
          </h1>
          <p className="text-white/80 text-sm">Join Echo Panda today</p>
        </div>

        {/* Google Sign Up */}
        <div className="mb-6 max-w-xl mx-auto">
          <button
            onClick={() => void handleGoogleRegister()}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white/95 backdrop-blur-sm rounded-xl text-base font-semibold text-gray-800 transition-all duration-300 shadow-lg border border-white/40 ${
              loading
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {!loading && (
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{loading ? "Signing up..." : "Sign up with Google"}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6 max-w-xl mx-auto">
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-white/70 font-medium">
              Or sign up with email
            </span>
          </div>
        </div>

        {/* Email Registration Form - Two Column Layout */}
        <form onSubmit={handleEmailRegister} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-white/90 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/25 outline-none transition-all duration-200"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-white/90 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/25 outline-none transition-all duration-200"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-white/90 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/25 outline-none transition-all duration-200"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-white/90 mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/25 outline-none transition-all duration-200"
                placeholder="Re-enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/20 backdrop-blur-sm border border-red-400/40 rounded-xl text-red-100 text-sm text-center font-medium shadow-lg mt-4">
              {error}
            </div>
          )}

          <div className="flex w-full justify-center">
            <button
              type="submit"
              disabled={loading}
              className={` p-6 mt-6  py-4 bg-white text-gray-800 rounded-xl font-bold text-base shadow-xl transition-all duration-300 border border-white/90 ${
                loading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center pt-6 border-t border-white/20 mt-6 max-w-xl mx-auto">
          <p className="text-sm text-white/70">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-white font-bold hover:text-purple-200 transition-colors duration-200 underline underline-offset-2"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Register;
