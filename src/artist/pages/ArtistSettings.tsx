import { useEffect, useState } from "react";
import { FaImage, FaSave, FaUserCircle, FaSpinner, FaCircleNotch } from "react-icons/fa";
import { getMyProfile, updateMyProfile, uploadArtistMedia, type ArtistProfilePayload } from "../artistStudioApi";
import { getSignedArtistImageUrl } from "../../backend/songMediaApi";

const DEFAULT_PROFILE: ArtistProfilePayload = {
  id: 0,
  user_id: 0,
  artist_id: null,
  name: "",
  email: "",
  role: "artist",
  artist: null,
};

// ─── SENIOR FRONTEND DESIGN DICTIONARY ──────────────────────────────
const STYLES = {
  container: "min-h-screen bg-[#0a0c16] bg-radial-gradient from-[#131833] via-[#0a0c16] to-[#05060b] p-6 md:p-10 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white",
  cardWrapper: "rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-xl shadow-black/40 p-8 space-y-6",
  inputField: "w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all duration-200 focus:border-indigo-500/50 focus:bg-white/[0.04] placeholder-slate-600 disabled:opacity-40 disabled:bg-black/20 disabled:border-white/[0.02] disabled:text-slate-400",
  labelTitle: "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1",
};

export default function ArtistSettings() {
  const [profile, setProfile] = useState<ArtistProfilePayload>(DEFAULT_PROFILE);
  const [nameInput, setNameInput] = useState("");
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMyProfile();
        setProfile(data);
        setNameInput(data.name);

        if (data.artist?.id && data.artist?.image_url) {
          const signedUrl = await getSignedArtistImageUrl(data.artist.id);
          setSignedImageUrl(signedUrl || "");
        }
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveProfile = async () => {
    if (!nameInput.trim()) {
      setError("Display name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await updateMyProfile({ name: nameInput.trim() });
      const updatedProfile = await getMyProfile();
      setProfile(updatedProfile);

      if (updatedProfile.artist?.id && updatedProfile.artist?.image_url) {
        const signedUrl = await getSignedArtistImageUrl(updatedProfile.artist.id);
        setSignedImageUrl(signedUrl || "");
      }
      setMessage("Profile metadata saved successfully.");

      const artistUserRaw = localStorage.getItem("artistUser");
      if (artistUserRaw) {
        try {
          const artistUser = JSON.parse(artistUserRaw);
          artistUser.name = updatedProfile.name;
          artistUser.displayName = updatedProfile.name;
          if (updatedProfile.artist?.image_url) {
            artistUser.image_url = updatedProfile.artist.image_url;
          }
          localStorage.setItem("artistUser", JSON.stringify(artistUser));
        } catch {
          localStorage.removeItem("artistUser");
        }
      }
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    try {
      setProfileImageUploading(true);
      setError("");
      setMessage("");
      const uploaded = await uploadArtistMedia({ file, purpose: "artist_image" });
      await updateMyProfile({ name: profile.name, image_url: uploaded.key });
      const updatedProfile = await getMyProfile();
      setProfile(updatedProfile);

      if (updatedProfile.artist?.id) {
        const signedUrl = await getSignedArtistImageUrl(updatedProfile.artist.id);
        setSignedImageUrl(signedUrl || "");
      }

      const artistUserRaw = localStorage.getItem("artistUser");
      if (artistUserRaw) {
        try {
          const artistUser = JSON.parse(artistUserRaw);
          artistUser.image_url = uploaded.key;
          localStorage.setItem("artistUser", JSON.stringify(artistUser));
        } catch {
          localStorage.removeItem("artistUser");
        }
      }

      setMessage("Profile artwork synchronized.");
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload profile image");
    } finally {
      setProfileImageUploading(false);
    }
  };

  const profileImageUrl = signedImageUrl || "";

  return (
    <div className={STYLES.container}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header Block */}
        <div className="border-b border-white/5 pb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Identity Dashboard
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Artist Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your public presentation and verified production credentials across EchoPanda Network.
          </p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/20 backdrop-blur-md p-4 text-xs font-semibold text-red-300 flex items-center gap-2 animate-in fade-in duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-md p-4 text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            {message}
          </div>
        )}

        {/* Studio Canvas Form Card */}
        <div className={STYLES.cardWrapper}>

          {/* Avatar / Brand Canvas Unit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
            <div className="flex items-center gap-5">
              <div className="relative group h-20 w-20 rounded-2xl border border-white/[0.08] bg-black/40 flex items-center justify-center text-slate-500 overflow-hidden shadow-lg shadow-black/40 shrink-0">
                {loading ? (
                  <FaCircleNotch className="animate-spin text-indigo-400 text-lg" />
                ) : profileImageUrl ? (
                  <img src={profileImageUrl} alt="Verified Profile avatar" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <FaUserCircle size={40} className="text-slate-700" />
                )}

                {/* Micro Action Overlay Link for Instant Upload */}
                {!loading && (
                  <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                    <FaImage size={14} className="text-white mb-1" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-white">Edit</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                  </label>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  {loading ? "Synchronizing..." : profile.name || "Unnamed Studio Entity"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-400">
                    {profile.role}
                  </span>
                  <span className="text-xs font-medium text-slate-500">ID: #{loading ? "•••" : profile.id}</span>
                </div>
              </div>
            </div>

            {/* Separate Button for Image Import */}
            <label className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:scale-98 transition text-xs font-semibold text-slate-300 cursor-pointer">
              {profileImageUploading ? <FaSpinner className="animate-spin text-indigo-400" /> : <FaImage className="text-indigo-400" />}
              <span>{profileImageUploading ? "Uploading Media..." : "Replace Avatar"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} disabled={loading || profileImageUploading} />
            </label>
          </div>

          {/* Form Matrix Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={STYLES.labelTitle}>Public Display Name</label>
              <input
                disabled={loading || saving}
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                className={STYLES.inputField}
                placeholder="e.g., Panda Echo"
              />
            </div>

            <div>
              <label className={STYLES.labelTitle}>System Email</label>
              <input value={loading ? "Loading..." : profile.email} disabled className={STYLES.inputField} />
            </div>

            <div>
              <label className={STYLES.labelTitle}>Account Security Access Tier</label>
              <input value={loading ? "Loading..." : profile.role} disabled className={`${STYLES.inputField} capitalize`} />
            </div>
          </div>

          {/* Submit Segment Footer */}
          <div className="pt-4 flex justify-end border-t border-white/[0.04]">
            <button
              disabled={saving || loading || profileImageUploading}
              onClick={saveProfile}
              className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-98 transition-all text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 disabled:opacity-40 disabled:pointer-events-none"
            >
              {saving ? <FaSpinner className="animate-spin text-xs" /> : <FaSave className="text-xs" />}
              <span>{saving ? "Saving Verification..." : "Commit Profile Changes"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}