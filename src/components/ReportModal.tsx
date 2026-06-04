import React, { useState } from "react";
import { FaFlag, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import { buildApiUrl } from "../backend/backendUrls";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "song" | "album" | "artist";
    id: string;
    title: string;
}

const REASONS = [
    "Copyright Infringement",
    "Inappropriate Content",
    "Spam / Misleading",
    "Hate Speech / Harassment",
    "Violence / Harmful behavior",
    "Other"
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, type, id, title }) => {
    const [reason, setReason] = useState(REASONS[0]);
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(buildApiUrl("/reports"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    type,
                    id: parseInt(id),
                    reason,
                    details
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to submit report");
            }

            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative bg-[#121212] w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                            <FaFlag size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Report Content</h2>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">Safety & Trust Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {submitted ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-6">
                                <FaExclamationTriangle size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Report Received</h3>
                            <p className="text-slate-400 text-sm leading-relaxed px-4">
                                Thank you for helping keep Echo Panda safe. Our moderation team will review "{title}" shortly.
                            </p>
                            <button onClick={onClose} className="mt-8 w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition">
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Reason for reporting</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {REASONS.map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setReason(r)}
                                            className={`w-full px-5 py-3.5 rounded-2xl text-left text-sm font-semibold transition-all border ${
                                                reason === r
                                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Additional Details (Optional)</label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Please provide any additional context..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-rose-500/30 focus:bg-white/10 transition-all h-32 resize-none"
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                                    {error}
                                </div>
                            ) }

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition disabled:opacity-40 shadow-xl"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
