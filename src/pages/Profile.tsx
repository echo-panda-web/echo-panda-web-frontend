import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, signOut } from "../routes/authContext";
import { getAdminBackendUrl } from "../routes/backendAuth";
import { useTheme } from "../contexts/ThemeContext";

interface UserData {
  username?: string;
  email: string;
  registeredAt?: string;
  displayName?: string;
  photoURL?: string;
  uid?: string;
  authProvider?: "google" | "email";
  backendRole?: "user" | "artist" | "publicer" | "admin";
}

const Profile: React.FC = () => {
  const { isLightMode } = useTheme();
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getCurrentUser();
    if (!userData) {
      navigate("/login");
      return;
    }

    if (userData.backendRole === "admin") {
      window.location.href = getAdminBackendUrl();
      return;
    }

    if (["artist", "publicer"].includes(userData.backendRole || "")) {
      navigate("/artist/dashboard", { replace: true });
      return;
    }

    setUser(userData);
    setFormData({
      username: userData.username || userData.displayName || "",
      email: userData.email,
    });
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (user) {
      const updatedUser = {
        ...user,
        username: formData.username,
        email: formData.email,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  const displayName = user.displayName || user.username || "User";
  const isGoogleUser = user.authProvider === "google";
  const memberSince = user.registeredAt
    ? new Date(user.registeredAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <div className={`min-h-screen ${isLightMode ? "bg-gray-50 text-gray-900" : "bg-black text-white"} p-8`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${isLightMode ? "text-gray-900" : "text-white"} mb-2`}>
            My <span className="text-blue-500">Profile</span>
          </h1>
          <p className={`${isLightMode ? "text-gray-500" : "text-gray-400"}`}>
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className={`${isLightMode ? "bg-white border-gray-200 shadow-sm" : "bg-[#1a1a1a] border-gray-800"} rounded-lg p-6 border`}>
              <div className="flex flex-col items-center">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-blue-500 mb-4 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-blue-500 border-4 border-blue-600 mb-4 flex items-center justify-center shadow-lg">
                    <span className="text-5xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h2 className={`text-xl font-bold ${isLightMode ? "text-gray-900" : "text-white"} mb-1`}>
                  {displayName}
                </h2>
                <p className={`text-sm ${isLightMode ? "text-gray-500" : "text-gray-400"} mb-2`}>{user.email}</p>

                {user.backendRole && (
                  <div className="mb-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        user.backendRole === "admin"
                          ? "bg-red-600 text-white"
                          : (isLightMode ? "bg-gray-100 text-gray-700" : "bg-gray-700 text-gray-200")
                      }`}
                    >
                      {user.backendRole.charAt(0).toUpperCase() + user.backendRole.slice(1)}
                    </span>
                  </div>
                )}

                {isGoogleUser && (
                  <div className={`flex items-center gap-2 ${isLightMode ? "bg-gray-50" : "bg-white/5"} px-3 py-1.5 rounded-lg`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className={`text-xs ${isLightMode ? "text-gray-600" : "text-gray-300"}`}>
                      Google Account
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className={`${isLightMode ? "bg-white border-gray-200 shadow-sm" : "bg-[#1a1a1a] border-gray-800"} rounded-lg p-6 border`}>
              <h3 className={`text-xl font-bold ${isLightMode ? "text-gray-900" : "text-white"} mb-6`}>
                Account Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isLightMode ? "text-gray-500" : "text-gray-400"} mb-2`}>
                    Display Name
                  </label>
                  {isEditing && !isGoogleUser ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0f0f0f] border-gray-700 text-white"} border rounded-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 transition`}
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <div className={`w-full px-4 py-2.5 ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0f0f0f] border-gray-800 text-white"} border rounded-lg`}>
                      {displayName}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isLightMode ? "text-gray-500" : "text-gray-400"} mb-2`}>
                    Email Address
                  </label>
                  {isEditing && !isGoogleUser ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0f0f0f] border-gray-700 text-white"} border rounded-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 transition`}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className={`w-full px-4 py-2.5 ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0f0f0f] border-gray-800 text-white"} border rounded-lg`}>
                      {user.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isLightMode ? "text-gray-500" : "text-gray-400"} mb-2`}>
                    Member Since
                  </label>
                  <div className={`w-full px-4 py-2.5 ${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0f0f0f] border-gray-800 text-white"} border rounded-lg`}>
                    {memberSince}
                  </div>
                </div>

                {isGoogleUser && (
                  <div className={`mt-4 p-4 ${isLightMode ? "bg-blue-50 border-blue-100 text-blue-800" : "bg-blue-500/10 border-blue-500/20 text-gray-300"} border rounded-lg`}>
                    <p className="text-sm">
                      This is a Google account. To update your information,
                      please visit your Google account settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                {!isGoogleUser && (
                  <>
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="flex-1 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              username: user.username || user.displayName || "",
                              email: user.email,
                            });
                          }}
                          className={`flex-1 px-6 py-2.5 border ${isLightMode ? "border-gray-300 text-gray-700 hover:bg-gray-50" : "border-gray-700 text-white hover:bg-[#0f0f0f]"} rounded-lg transition font-medium`}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex-1 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                        >
                          Edit Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className={`flex-1 px-6 py-2.5 border ${isLightMode ? "border-red-200 text-red-600 hover:bg-red-50" : "border-red-500 text-red-500 hover:bg-red-500/10"} rounded-lg transition font-medium`}
                        >
                          Sign Out
                        </button>
                      </>
                    )}
                  </>
                )}

                {isGoogleUser && (
                  <button
                    onClick={handleLogout}
                    className={`w-full px-6 py-2.5 border ${isLightMode ? "border-red-200 text-red-600 hover:bg-red-50" : "border-red-500 text-red-500 hover:bg-red-500/10"} rounded-lg transition font-medium`}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
