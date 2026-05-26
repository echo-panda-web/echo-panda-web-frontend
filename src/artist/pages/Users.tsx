import React, { useMemo, useState, useEffect } from "react";
import { FaSearch, FaCalendarAlt, FaSpinner, FaCopy, FaCheck, FaBan, FaCheckCircle } from "react-icons/fa";
import { useDataCache } from "../../contexts/DataCacheContext";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { app } from "../../routes/firebaseConfig";

const auth = getAuth(app);
const db = getFirestore(app);

interface UserItem {
  id: string;
  photoURL?: string;
  displayName: string;
  email: string;
  registeredAt: string;
  status: "active" | "blocked";
}

export default function UsersManager() {
  const { getCachedData, clearCache } = useDataCache();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('admin_users', async () => {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        
        const usersList: UserItem[] = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            photoURL: data.photoURL || "",
            displayName: data.displayName || data.username || "Unknown User",
            email: data.email || "",
            registeredAt: data.registeredAt || data.createdAt || new Date().toISOString(),
            status: data.status || "active",
          };
        });

        return usersList;
      });
      
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to load users. Make sure you have proper permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      console.log("Copied ID:", id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback method
      const textArea = document.createElement("textarea");
      textArea.value = id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleUserStatus = async (user: UserItem) => {
    const newStatus = user.status === "active" ? "blocked" : "active";
    
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { status: newStatus });
      
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
      
      console.log(`User ${user.displayName} status changed to ${newStatus}`);
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status. Check console for details.");
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const searchStr = query.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(searchStr) || 
        u.email.toLowerCase().includes(searchStr)
      );
    });
  }, [users, query]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              User <span className="text-purple-400">List</span>
            </h1>
            <p className="text-slate-500 font-medium">Manage registered user accounts</p>
          </div>

          <div className="relative group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-12 pr-6 py-4 w-full lg:w-[450px] rounded-2xl bg-slate-900/80 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-2xl"
            />
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <FaSpinner className="text-purple-400 text-4xl animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
                    <th className="px-8 py-6">User</th>
                    <th className="px-6 py-6">Email</th>
                    <th className="px-6 py-6">Joined Date</th>
                    <th className="px-6 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {u.photoURL ? (
                            <img 
                              src={u.photoURL} 
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/5 group-hover:ring-purple-500/50 transition-all" 
                              alt={u.displayName}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 ring-2 ring-white/5 group-hover:ring-purple-500/50 transition-all flex items-center justify-center text-purple-400 font-black text-lg">
                              {u.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-white font-bold tracking-tight">{u.displayName}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyId(u.id);
                              }}
                              className="flex items-center gap-2 text-slate-500 hover:text-purple-400 text-xs font-medium transition-colors cursor-pointer group/id"
                              title="Click to copy full ID"
                            >
                              <span>ID: {u.id.substring(0, 8)}...</span>
                              {copiedId === u.id ? (
                                <FaCheck className="text-green-400 text-[10px]" />
                              ) : (
                                <FaCopy className="text-[10px] opacity-0 group-hover/id:opacity-100 transition-opacity" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-slate-300 text-sm font-medium">{u.email}</span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                          <FaCalendarAlt className="text-purple-500/50 text-[10px]" />
                          {formatDate(u.registeredAt)}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          u.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button
                            onClick={() => toggleUserStatus(u)}
                            className={`p-3.5 rounded-2xl transition-all border border-white/5 shadow-xl ${
                              u.status === 'active'
                              ? 'bg-slate-800/80 text-red-400 hover:bg-red-600 hover:text-white'
                              : 'bg-slate-800/80 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                            }`}
                            title={u.status === 'active' ? 'Block user' : 'Unblock user'}
                          >
                            {u.status === 'active' ? <FaBan /> : <FaCheckCircle />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="py-24 text-center">
                  <div className="inline-flex p-8 bg-white/5 rounded-[2rem] mb-6 text-slate-700">
                    <FaSearch size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic">No Users Found</h3>
                  <p className="text-slate-500 mt-2 font-medium">
                    {query ? `No users matching "${query}"` : "No registered users yet"}
                  </p>
                  {query && (
                    <button 
                      onClick={() => setQuery("")} 
                      className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Reset Search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}