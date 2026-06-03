import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaCompactDisc, FaImage, FaMusic, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import {
  createArtistAlbum,
  deleteArtistAlbum,
  getArtistIdentity,
  getOwnedAlbums,
  updateArtistAlbum,
  type ArtistIdentity,
  type ArtistAlbum,
} from "../artistStudioApi";
import AlbumModal from "./AlbumModal";

type ReleaseType = "album" | "single" | "ep";

interface ReleaseDraft {
  title: string;
  type: ReleaseType;
  scheduledAt: string;
}

const DRAFT_KEY = "artist_release_draft";

export default function Albums() {
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReleaseType>("album");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const identity = useMemo<ArtistIdentity | null>(() => {
    try {
      return getArtistIdentity();
    } catch {
      return null;
    }
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      setError("");
      if (!identity) {
        throw new Error("Missing artist_id in session. Please sign in again.");
      }
      const data = await getOwnedAlbums(identity);
      setAlbums(data);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load releases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();

    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as ReleaseDraft;
        setTitle(parsed.title || "");
        setType(parsed.type || "album");
        setScheduledAt(parsed.scheduledAt || "");
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const handleCoverFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file for the album cover.");
      return;
    }

    setError("");
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const saveDraftLocal = () => {
    const draft: ReleaseDraft = { title, type, scheduledAt };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  };

  const createRelease = async (publishNow: boolean) => {
    if (!title.trim()) {
      setError("Release title is required.");
      return;
    }

    if (!identity) {
      setError("Missing artist_id in session. Please sign in again.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createArtistAlbum({
        title: title.trim(),
        artist: identity.displayName,
        description: type,
        release_status: publishNow ? "published" : (scheduledAt ? "pending_review" : "draft"),
        scheduled_at: scheduledAt || undefined,
        coverFile,
        release_date: publishNow ? new Date().toISOString().slice(0, 10) : undefined,
      });

      localStorage.removeItem(DRAFT_KEY);
      setTitle("");
      setType("album");
      setCoverFile(null);
      setCoverPreview("");
      setScheduledAt("");
      await loadAlbums();
    } catch (createError) {
      console.error(createError);
      setError(createError instanceof Error ? createError.message : "Failed to create release");
    } finally {
      setCreating(false);
    }
  };

  const publishRelease = async (album: ArtistAlbum) => {
    if (!identity) {
      setError("Missing artist_id in session. Please sign in again.");
      return;
    }

    try {
      await updateArtistAlbum(album.id, {
        title: album.title,
        artist: identity.displayName,
        description: album.type,
        release_status: "published",
        release_date: new Date().toISOString().slice(0, 10),
      });
      await loadAlbums();
    } catch (publishError) {
      console.error(publishError);
      setError(publishError instanceof Error ? publishError.message : "Failed to publish release");
    }
  };

  const deleteRelease = async (album: ArtistAlbum) => {
    const confirmed = window.confirm(`Delete release: ${album.title}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteArtistAlbum(album.id);
      await loadAlbums();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete release");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 md:p-10 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-black">Release Studio</h1>
          <p className="text-slate-300 mt-2">
            Create albums and singles, upload album covers, save draft releases, and publish when ready.
          </p>
          <p className="text-xs text-purple-200 mt-1">Ownership scope: only your artist content is shown.</p>
        </div>

        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black">Your Releases</h2>
            <button onClick={() => setShowAddModal(true)} className="rounded-xl border border-purple-400/40 bg-purple-500/10 px-4 py-2 font-semibold">+ Add Album</button>
          </div>
          <p className="text-slate-400">Create albums and singles, upload album covers, save draft releases, and publish when ready.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black">Your Releases</h2>

          {loading ? (
            <p className="text-slate-300 mt-4">Loading releases...</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-3">Title</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map((album) => {
                    const statusMeta: Record<string, { label: string; className: string }> = {
                      draft: { label: "Draft", className: "bg-amber-500/15 text-amber-200" },
                      pending_review: { label: "Pending Review", className: "bg-blue-500/15 text-blue-200" },
                      published: { label: "Published", className: "bg-emerald-500/15 text-emerald-200" },
                      rejected: { label: "Rejected", className: "bg-red-500/15 text-red-200" },
                    };
                    const status = statusMeta[album.releaseStatus] || statusMeta.draft;
                    return (
                      <tr key={album.id} className="border-b border-white/5">
                        <td className="py-3 font-semibold text-white">{album.title}</td>
                        <td className="py-3 text-slate-300 capitalize">{album.type || "album"}</td>
                        <td className="py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            {album.releaseStatus !== "published" && (
                              <button
                                onClick={() => publishRelease(album)}
                                className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold"
                              >
                                <FaCheckCircle className="inline mr-1" /> Publish
                              </button>
                            )}
                            <button
                              onClick={() => deleteRelease(album)}
                              className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold"
                            >
                              <FaTrash className="inline mr-1" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!loading && albums.length === 0 && (
                <p className="py-6 text-slate-400">No releases yet. Create your first album or single.</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-300">
          <p>
            <FaMusic className="inline mr-2 text-purple-300" />
            Release singles by selecting type <strong>single</strong> while creating a release.
          </p>
        </div>
      </div>
      {showAddModal && (
        <AlbumModal show={showAddModal} onClose={() => setShowAddModal(false)} onCreated={async () => { setShowAddModal(false); await loadAlbums(); }} />
      )}
    </div>
  );
}
