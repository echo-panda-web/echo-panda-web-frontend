import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCloudUploadAlt } from "react-icons/fa";
import { uploadArtistMedia, getMyProfile } from "../artistStudioApi";

export default function ArtistOnboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return setError('Image must be <= 5MB');
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const getToken = () => localStorage.getItem('userToken') || localStorage.getItem('authToken');

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) return setError('Please enter an artist name');
    setBusy(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const res = await uploadArtistMedia({ file: imageFile, purpose: 'artist_image' });
        imageUrl = res.url;
      }

      const token = getToken();
      if (!token) throw new Error('Missing auth token');

      const resp = await fetch(`${(import.meta as any).env.VITE_BACKEND_API_URL || 'http://localhost:8082/api'}/artist/create`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), image_url: imageUrl }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.message || 'Failed to create artist');

      // Refresh profile in localStorage if available
      try {
        const profile = await getMyProfile();
        localStorage.setItem('artistUser', JSON.stringify({ artist_id: profile.artist?.id, user_id: profile.id, role: profile.role, displayName: profile.artist?.name || profile.name }));
      } catch (e) {
        // ignore
      }

      // Show success and keep user on onboarding so they can proceed
      alert('Artist profile created successfully');
      navigate('/artist/onboarding', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create artist');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 text-white flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white/3 border border-white/10 rounded-3xl p-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">Create your Artist profile</h1>
        <p className="text-slate-300 mb-6">This is the only screen artists need to set up. Enter your artist name and upload a profile image.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-400">Artist name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900 border border-white/5 text-white outline-none" placeholder="Artist or band name" />

            <div className="mt-4">
              <label className="text-xs text-slate-400">Profile image</label>
              <div className="mt-2 flex items-center gap-3">
                <label className="cursor-pointer inline-block">
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                    <FaCloudUploadAlt />
                    <span className="text-slate-300">Upload image</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                </label>
                {preview && <img src={preview} alt="preview" className="h-20 w-20 rounded-lg object-cover border border-white/10" />}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <button disabled={busy} onClick={handleCreate} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold">
              {busy ? 'Creating...' : 'Create Artist'}
            </button>
          </div>
        </div>

        {error && <div className="mt-4 text-red-400">{error}</div>}
      </div>
    </div>
  );
}
