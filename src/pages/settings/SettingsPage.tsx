import React, { useState, useEffect } from "react";
import { 
  User, Bell, Play, Volume2, Waves, Zap, 
  Music, Captions, Cpu, Menu, X, Check, 
  Save, RotateCcw, Plus, LogOut, ChevronRight,
  ExternalLink
} from "lucide-react";

interface PlaybackSettings {
  audioQuality: string;
  crossfade: boolean;
  crossfadeDuration: number;
  autoplay: boolean;
  volumeNormalization: boolean;
  showLyrics: boolean;
  hardwareAcceleration: boolean;
  gaplessPlayback: boolean;
  monoAudio: boolean;
  streamingQuality: string;
}

interface AccountProfile {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("playback");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [originalSettings, setOriginalSettings] = useState<PlaybackSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Account State
  const [accounts] = useState<AccountProfile[]>([
    { id: "1", name: "User Name", email: "user.email@echopanda.com", isActive: true },
    { id: "2", name: "Work Profile", email: "work.account@company.com", isActive: false },
  ]);

  const [playbackSettings, setPlaybackSettings] = useState<PlaybackSettings>({
    audioQuality: "high",
    crossfade: true,
    crossfadeDuration: 5,
    autoplay: true,
    volumeNormalization: true,
    showLyrics: true,
    hardwareAcceleration: true,
    gaplessPlayback: true,
    monoAudio: false,
    streamingQuality: "veryHigh"
  });

  useEffect(() => {
    if (originalSettings && JSON.stringify(playbackSettings) !== JSON.stringify(originalSettings)) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [playbackSettings, originalSettings]);

  useEffect(() => {
    setOriginalSettings(playbackSettings);
  }, []);

  const menuItems = [
    { id: "account", label: "Account", icon: <User size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "playback", label: "Playback", icon: <Play size={18} /> },
  ];

  const handlePlaybackChange = (key: keyof PlaybackSettings, value: string | number | boolean) => {
    setPlaybackSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setOriginalSettings(playbackSettings);
      setHasUnsavedChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleResetSettings = () => {
    setPlaybackSettings({
      audioQuality: "high",
      crossfade: true,
      crossfadeDuration: 5,
      autoplay: true,
      volumeNormalization: true,
      showLyrics: true,
      hardwareAcceleration: true,
      gaplessPlayback: true,
      monoAudio: false,
      streamingQuality: "veryHigh"
    });
  };

  const playbackItems: { id: keyof PlaybackSettings; title: string; desc: string; icon: React.ReactNode; type: 'toggle' | 'toggleWithSlider' }[] = [
    { id: "crossfade", title: "Crossfade", desc: "Smooth transition between songs", icon: <Waves size={16} />, type: "toggleWithSlider" },
    { id: "autoplay", title: "Autoplay", desc: "Keep playing similar music", icon: <Play size={16} />, type: "toggle" },
    { id: "volumeNormalization", title: "Volume Normalization", desc: "Consistent volume across tracks", icon: <Volume2 size={16} />, type: "toggle" },
    { id: "gaplessPlayback", title: "Gapless Playback", desc: "Remove gaps between tracks", icon: <Music size={16} />, type: "toggle" },
    { id: "showLyrics", title: "Show Lyrics", desc: "Display lyrics while playing", icon: <Captions size={16} />, type: "toggle" },
    { id: "hardwareAcceleration", title: "Hardware Acceleration", desc: "Better performance (requires restart)", icon: <Cpu size={16} />, type: "toggle" },
    { id: "monoAudio", title: "Mono Audio", desc: "Combine audio channels", icon: <Volume2 size={16} />, type: "toggle" }
  ];

  return (
    <div className="flex flex-col lg:flex-row bg-[#121212] text-white rounded-xl overflow-hidden min-h-[85vh] border border-white/5 font-sans">
      
      {/* Toast Notification */}
      {saveStatus !== 'idle' && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-8 
          ${saveStatus === 'success' ? 'bg-green-900/40 border-green-500 text-green-200' : 
            saveStatus === 'error' ? 'bg-red-900/40 border-red-500 text-red-200' : 
            'bg-blue-900/40 border-blue-500 text-blue-200'}`}>
          {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
          {saveStatus === 'success' && <Check size={20} />}
          <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Settings saved!' : 'Error saving'}</span>
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#181818]">
        <h2 className="text-xl font-bold">Settings</h2>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-white/5 rounded-lg">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block lg:w-72 w-full bg-[#181818] border-r border-white/5 flex flex-col`}>
        <div className="p-8 hidden lg:block">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-gray-500 text-xs mt-1">Manage Echopanda profile</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all
                ${activeTab === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto bg-linear-to-br from-[#121212] to-[#0a0a0a]">
        <div className="max-w-3xl mx-auto">
          
          {/* Account Section */}
          {activeTab === "account" && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h1 className="text-3xl font-bold mb-2">Account Manager</h1>
              <p className="text-gray-400 mb-8 border-b border-white/5 pb-4">View and switch between your Echopanda accounts.</p>
              
              <div className="space-y-4">
                {accounts.map((acc) => (
                  <div key={acc.id} className={`p-5 rounded-2xl border transition-all flex items-center justify-between 
                    ${acc.isActive ? 'bg-blue-600/10 border-blue-500/50' : 'bg-[#1e1e1e] border-white/5 hover:border-white/20'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold
                        ${acc.isActive ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold flex items-center gap-2">
                          {acc.name}
                          {acc.isActive && <span className="text-[10px] bg-blue-500 px-2 py-0.5 rounded-full">ACTIVE</span>}
                        </h3>
                        <p className="text-sm text-gray-500">{acc.email}</p>
                      </div>
                    </div>
                    {!acc.isActive && (
                      <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition">Switch Profile</button>
                    )}
                  </div>
                ))}

                <button className="w-full mt-4 flex items-center justify-between p-5 bg-[#1e1e1e] border border-white/5 border-dashed rounded-2xl hover:bg-white/5 transition group">
                  <div className="flex items-center gap-4 text-gray-400 group-hover:text-white">
                    <div className="h-10 w-10 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center group-hover:border-blue-500">
                      <Plus size={20} />
                    </div>
                    <span className="font-medium">Add another account</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600" />
                </button>

                <div className="pt-8 border-t border-white/5 space-y-3">
                  <button className="w-full flex items-center gap-3 p-4 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition">
                    <LogOut size={18} />
                    <span className="font-semibold text-sm">Sign out of all accounts</span>
                  </button>
                  <p className="text-[11px] text-gray-500 text-center">
                    To change security settings or delete account, visit the 
                    <a href="#" className="text-blue-500 ml-1 hover:underline">Web Dashboard <ExternalLink size={10} className="inline"/></a>
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Notifications Section */}
          {activeTab === "notifications" && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h1 className="text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-gray-400 mb-8 border-b border-white/5 pb-4">Manage how you hear from us.</p>
              <div className="space-y-3">
                {["General Notifications", "Email Alerts", "Push Notifications"].map((title, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-[#1e1e1e] border border-white/5 rounded-xl">
                    <span className="font-medium">{title}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={idx === 0} />
                      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Playback Section */}
          {activeTab === "playback" && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Playback</h1>
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-2 text-yellow-500 text-xs font-bold animate-pulse">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div> UNSAVED CHANGES
                  </span>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Volume2 size={20} className="text-blue-400"/> Audio Quality</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Streaming Quality</span>
                      <select 
                        value={playbackSettings.streamingQuality}
                        onChange={(e) => handlePlaybackChange('streamingQuality', e.target.value)}
                        className="bg-[#121212] border border-white/10 px-3 py-2 rounded-lg text-sm outline-none">
                        <option value="low">96kbps</option>
                        <option value="high">320kbps</option>
                        <option value="veryHigh">Lossless</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Waves size={20} className="text-purple-400"/> Experience</h3>
                  <div className="space-y-3">
                    {playbackItems.map((item) => (
                      <div key={item.id} className="p-4 bg-[#121212] rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg">{item.icon}</div>
                            <div>
                              <h4 className="text-sm font-medium">{item.title}</h4>
                              <p className="text-[11px] text-gray-500">{item.desc}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={playbackSettings[item.id] as boolean}
                              onChange={(e) => handlePlaybackChange(item.id, e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        {item.type === "toggleWithSlider" && playbackSettings[item.id] && (
                          <div className="mt-4 flex items-center gap-4">
                            <input 
                              type="range" min="1" max="12" 
                              value={playbackSettings.crossfadeDuration}
                              onChange={(e) => handlePlaybackChange('crossfadeDuration', parseInt(e.target.value))}
                              className="flex-1 accent-blue-600 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-gray-400 font-mono w-6">{playbackSettings.crossfadeDuration}s</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 sticky bottom-0 bg-[#121212] py-6 border-t border-white/5">
                  <button 
                    disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                    onClick={handleSaveSettings}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition
                      ${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>
                    <Save size={18} />
                    {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={handleResetSettings} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center gap-2">
                    <RotateCcw size={18} />
                    Reset
                  </button>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
};

export default SettingsPage;