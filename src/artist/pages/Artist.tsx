import React, { useState, useMemo, useEffect } from "react";
import { 
  FaSearch, FaUserShield, FaSpinner
} from "react-icons/fa";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../../routes/firebaseConfig";

const db = getFirestore(app);

interface AdminItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: Date;
}

export default function AdminsManager() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch admins from Firestore
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const adminsCollection = collection(db, "admins");
      const adminsSnapshot = await getDocs(adminsCollection);
      
      const adminsList: AdminItem[] = adminsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unknown",
          email: data.email || "",
          role: data.role || "admin",
          status: data.status || "active",
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      
      setAdmins(adminsList);
    } catch (error) {
      console.error("Error fetching admins:", error);
      alert("Failed to load admins. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return admins.filter((a) => 
      a.name.toLowerCase().includes(query.toLowerCase()) || 
      a.email.toLowerCase().includes(query.toLowerCase())
    );
  }, [admins, query]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
             <h1 className="text-3xl font-black text-white tracking-tight">
              Admin <span className="text-purple-400">Management</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Security & encrypted administrator credentials</p>
          </div>
          
          <div className="relative flex-1 lg:min-w-[300px] max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search admins..." 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-600" 
            />
          </div>
        </div>

        {/* --- MAIN TABLE --- */}
        <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <FaSpinner className="text-purple-400 text-4xl animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
                    <th className="p-6">Administrator</th>
                    <th className="p-6">Role</th>
                    <th className="p-6">Joined Date</th>
                    <th className="p-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((a) => (
                    <tr key={a.id} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold ring-2 ring-white/5 group-hover:ring-purple-500/30 transition-all">
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-bold tracking-tight">{a.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                          <FaUserShield className="opacity-50" /> {a.role}
                        </div>
                      </td>
                      <td className="p-6 text-sm text-slate-400 font-medium">{formatDate(a.createdAt)}</td>
                      <td className="p-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          a.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filtered.length === 0 && !loading && (
                <div className="py-24 text-center">
                  <div className="inline-flex p-8 bg-white/5 rounded-[2rem] mb-6 text-slate-700">
                    <FaSearch size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic">No Admins Found</h3>
                  <p className="text-slate-500 mt-2 font-medium">
                    {query ? `No results for "${query}"` : "No admins in the system"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}