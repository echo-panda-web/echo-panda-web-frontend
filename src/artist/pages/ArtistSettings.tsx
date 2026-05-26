import { useEffect, useState } from "react";
import { FaImage, FaSave, FaUserCircle } from "react-icons/fa";
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
        
        // Fetch signed image URL if artist has an image
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
      // Refetch profile to ensure artist data is properly populated
      const updatedProfile = await getMyProfile();
      setProfile(updatedProfile);
      
      // Fetch and set the signed image URL
      if (updatedProfile.artist?.id && updatedProfile.artist?.image_url) {
        const signedUrl = await getSignedArtistImageUrl(updatedProfile.artist.id);
        setSignedImageUrl(signedUrl || "");
      }
      setMessage("Profile updated successfully.");

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
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    try {
      setProfileImageUploading(true);
      setError("");
      setMessage("");
      const uploaded = await uploadArtistMedia({ file, purpose: "artist_image" });
      await updateMyProfile({ name: profile.name, image_url: uploaded.url });
      // Refetch profile to get the updated artist object with image_url
      const updatedProfile = await getMyProfile();
      setProfile(updatedProfile);
      
      // Fetch and set the signed image URL
      if (updatedProfile.artist?.id) {
        const signedUrl = await getSignedArtistImageUrl(updatedProfile.artist.id);
        setSignedImageUrl(signedUrl || "");
      }

      const artistUserRaw = localStorage.getItem("artistUser");
      if (artistUserRaw) {
        try {
          const artistUser = JSON.parse(artistUserRaw);
          artistUser.image_url = uploaded.url;
          localStorage.setItem("artistUser", JSON.stringify(artistUser));
        } catch {
          localStorage.removeItem("artistUser");
        }
      }

      setMessage("Profile image updated successfully.");
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload profile image");
    } finally {
      setProfileImageUploading(false);
    }
  };

  const profileImageUrl = signedImageUrl || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 md:p-10 text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-black">Artist Profile</h1>
          <p className="text-slate-300 mt-2">Manage your own profile information used in artist studio.</p>
        </div>

        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">{message}</div>}

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-200 overflow-hidden">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <FaUserCircle size={30} />
              )}
            </div>
            <div>
              <p className="text-white font-bold">{loading ? "Loading..." : profile.name}</p>
              <p className="text-sm text-slate-400 capitalize">{profile.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Display Name</label>
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Email</label>
              <input value={profile.email} disabled className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3" />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Role</label>
              <input value={profile.role} disabled className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 capitalize" />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Profile Image</label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 cursor-pointer">
                <FaImage />
                <span>{profileImageUploading ? "Uploading..." : "Choose Image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
              </label>
            </div>

            <button
              disabled={saving || loading}
              onClick={saveProfile}
              className="rounded-xl border border-purple-400/40 bg-purple-500/10 px-5 py-2.5 font-semibold"
            >
              <FaSave className="inline mr-2" /> {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
