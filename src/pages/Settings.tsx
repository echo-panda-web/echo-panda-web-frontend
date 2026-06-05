import React, { useState, useEffect } from "react";
import {
  User, Bell, Play, Volume2, Waves,
  Music, Captions, Cpu, Menu, X, Check,
  Save, RotateCcw, Plus, LogOut, ChevronRight,
  ExternalLink
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

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

const Settings: React.FC = () => {
  const { isLightMode } = useTheme();
  const [activeTab, setActiveTab] = useState("playback");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [originalSettings, setOriginalSettings] = useState<PlaybackSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [notifSettings, setNotifSettings] = useState({
    general: true,
    email: false,
    push: false,
  });

  const [accounts, setAccounts] = useState<AccountProfile[]>([
    { id: "1", name: "PA BORASY", email: "user.email@echopanda.com", isActive: true },
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
    { id: "account", label: "Account", icon: <User size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { id: "playback", label: "Playback", icon: <Play size={16} /> },
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

  const handleProfileSwitch = (id: string) => {
    setAccounts(prev => prev.map(acc => ({ ...acc, isActive: acc.id === id })));
  };

  const playbackItems: { id: keyof PlaybackSettings; title: string; desc: string; icon: React.ReactNode; type: 'toggle' | 'toggleWithSlider' }[] = [
    { id: "crossfade", title: "Crossfade", desc: "Smooth transition between songs", icon: <Waves size={15} />, type: "toggleWithSlider" },
    { id: "autoplay", title: "Autoplay", desc: "Keep playing similar music", icon: <Play size={15} />, type: "toggle" },
    { id: "volumeNormalization", title: "Volume Normalization", desc: "Consistent volume across tracks", icon: <Volume2 size={15} />, type: "toggle" },
    { id: "gaplessPlayback", title: "Gapless Playback", desc: "Remove gaps between tracks", icon: <Music size={15} />, type: "toggle" },
    { id: "showLyrics", title: "Show Lyrics", desc: "Display lyrics while playing", icon: <Captions size={15} />, type: "toggle" },
    { id: "hardwareAcceleration", title: "Hardware Acceleration", desc: "Better performance (requires restart)", icon: <Cpu size={15} />, type: "toggle" },
    { id: "monoAudio", title: "Mono Audio", desc: "Combine audio channels", icon: <Volume2 size={15} />, type: "toggle" }
  ];

  return (
    <div className={`w-full max-w-full ${isLightMode ? "bg-white border-gray-200" : "bg-[#0b0f17]/30 border-white/5"} border rounded-3xl overflow-hidden min-h-[78vh] flex flex-col lg:flex-row backdrop-blur-md animate-in fade-in duration-500`}>

      {saveStatus !== 'idle' && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-5 font-semibold text-xs tracking-wide
          ${saveStatus === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            saveStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
          {saveStatus === 'saving' && <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent"></div>}
          {saveStatus === 'success' && <Check size={14} />}
          <span>{saveStatus === 'saving' ? 'SYNCING MATRIX...' : saveStatus === 'success' ? 'SYSTEM SETTINGS UPDATED' : 'CRITICAL UPDATE ERROR'}</span>
        </div>
      )}

      <div className={`lg:hidden flex items-center justify-between p-4 border-b ${isLightMode ? "border-gray-100 bg-gray-50" : "border-white/5 bg-[#0e121a]"}`}>
        <div>
          <h2 className={`text-base font-black uppercase tracking-widest ${isLightMode ? "text-gray-900" : "text-white"}`}>Settings</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Control Center</p>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2.5 ${isLightMode ? "bg-gray-200 hover:bg-gray-300" : "bg-white/5 hover:bg-white/10"} rounded-xl transition-all`}>
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block lg:w-64 w-full ${isLightMode ? "bg-gray-50/60 border-gray-100" : "bg-[#0e121a]/60 border-white/5"} backdrop-blur-2xl border-r flex flex-col shrink-0`}>
        <div className={`p-6 hidden lg:block border-b ${isLightMode ? "border-gray-100" : "border-white/5"}`}>
          <h2 className={`text-lg font-black uppercase tracking-widest ${isLightMode ? "text-gray-900" : "text-white"}`}>Settings</h2>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Control Intelligence</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const isTabActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider
                  ${isTabActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15" : (isLightMode ? "text-gray-600 hover:bg-gray-200 hover:text-gray-900" : "text-gray-400 hover:bg-white/5 hover:text-white")}`}
              >
                <div className={isTabActive ? "text-white" : "text-gray-500 group-hover:text-white"}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className={`flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto ${isLightMode ? "bg-white" : "bg-gradient-to-br from-transparent to-[#070a12]/40"} relative`}>
        <div className="max-w-2xl mx-auto">
          {activeTab === "account" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h1 className={`text-2xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tight uppercase`}>Account Profile</h1>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Switch profiles and authenticate network contexts</p>
              </div>
              <div className={`h-[1px] w-full ${isLightMode ? "bg-gray-100" : "bg-white/5"}`} />

              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between
                    ${acc.isActive ? (isLightMode ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-blue-600/10 border-blue-500/30 shadow-inner') : (isLightMode ? 'bg-gray-50 border-gray-100 hover:border-gray-200' : 'bg-[#111622]/40 border-white/5 hover:border-white/10')}`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-black uppercase
                        ${acc.isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : (isLightMode ? 'bg-gray-200 text-gray-400' : 'bg-white/5 text-gray-400')}`}>
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className={`font-bold text-sm ${isLightMode ? "text-gray-900" : "text-white"} flex items-center gap-2`}>
                          {acc.name}
                          {acc.isActive && <span className="text-[9px] font-black tracking-widest bg-blue-500 text-white px-2 py-0.5 rounded">ACTIVE</span>}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{acc.email}</p>
                      </div>
                    </div>
                    {!acc.isActive && (
                      <button
                        onClick={() => handleProfileSwitch(acc.id)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-blue-500/5"
                      >
                        Switch Context
                      </button>
                    )}
                  </div>
                ))}

                <button className={`w-full mt-2 flex items-center justify-between p-4 ${isLightMode ? "bg-gray-50 border-gray-200" : "bg-white/[0.01] border-white/5"} border-dashed rounded-2xl hover:bg-white/5 hover:border-white/10 transition group`}>
                  <div className="flex items-center gap-3.5 text-gray-400 group-hover:text-white">
                    <div className={`h-9 w-9 border border-dashed ${isLightMode ? "border-gray-300" : "border-gray-600"} rounded-xl flex items-center justify-center group-hover:border-blue-500 transition-colors`}>
                      <Plus size={14} />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? "text-gray-500 group-hover:text-gray-900" : ""}`}>Add Alternative Identity</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </button>

                <div className={`pt-6 mt-6 border-t ${isLightMode ? "border-gray-100" : "border-white/5"} space-y-4`}>
                  <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.99]">
                    <LogOut size={14} />
                    <span>Terminate All Active Sessions</span>
                  </button>
                  <p className="text-[11px] font-semibold text-gray-500 text-center uppercase tracking-wider">
                    To tweak security settings, access the
                    <a href="#" className="text-blue-400 ml-1 hover:underline inline-flex items-center gap-0.5">
                      Cloud Dashboard <ExternalLink size={10} />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h1 className={`text-2xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tight uppercase`}>Alert Dispatch</h1>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Define streaming status alerts and communication loops</p>
              </div>
              <div className={`h-[1px] w-full ${isLightMode ? "bg-gray-100" : "bg-white/5"}`} />

              <div className="space-y-2">
                {[
                  { key: 'general', title: 'System Engine Updates', desc: 'Alert me on releases and dynamic tags' },
                  { key: 'email', title: 'Email Digest Delivery', desc: 'Receive metadata summaries to registered mail' },
                  { key: 'push', title: 'Realtime Push Sync', desc: 'Deploy instant status updates into system player logs' }
                ].map((item) => (
                  <div key={item.key} className={`flex items-center justify-between p-4 ${isLightMode ? "bg-gray-50 border-gray-100" : "bg-[#111622]/40 border-white/5"} border rounded-xl`}>
                    <div>
                      <span className={`text-sm font-bold ${isLightMode ? "text-gray-900" : "text-white"} block`}>{item.title}</span>
                      <span className="text-[11px] font-medium text-gray-500 block mt-0.5">{item.desc}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={(notifSettings as any)[item.key]}
                        onChange={(e) => setNotifSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                      <div className={`w-9 h-5 ${isLightMode ? "bg-gray-200" : "bg-gray-800"} rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full`}></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "playback" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-2xl font-black ${isLightMode ? "text-gray-900" : "text-white"} tracking-tight uppercase`}>Playback Engine</h1>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Fine-tune acoustic signal stream architecture</p>
                </div>
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black tracking-widest animate-pulse">
                    UNSAVED MATRIX MODIFICATIONS
                  </span>
                )}
              </div>
              <div className={`h-[1px] w-full ${isLightMode ? "bg-gray-100" : "bg-white/5"}`} />

              <div className="space-y-5">
                <div className={`${isLightMode ? "bg-gray-50 border-gray-100" : "bg-[#111622]/40 border-white/5"} border rounded-2xl p-5`}>
                  <h3 className={`text-sm font-black ${isLightMode ? "text-gray-900" : "text-white"} uppercase tracking-wider mb-4 flex items-center gap-2`}>
                    <Volume2 size={16} className="text-blue-400" /> Audio Bitrate Matrix
                  </h3>
                  <div className={`flex items-center justify-between p-3.5 ${isLightMode ? "bg-white border-gray-100" : "bg-black/20 border-white/5"} rounded-xl border`}>
                    <div>
                      <span className={`text-xs font-bold ${isLightMode ? "text-gray-700" : "text-gray-200"} block`}>Streaming Sample Output</span>
                      <span className="text-[11px] text-gray-500 font-medium block mt-0.5">High fidelity compression algorithms</span>
                    </div>
                    <select
                      value={playbackSettings.streamingQuality}
                      onChange={(e) => handlePlaybackChange('streamingQuality', e.target.value)}
                      className={`${isLightMode ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0e121a] border-white/10 text-white"} border px-3 py-1.5 rounded-lg text-xs font-bold outline-none focus:border-blue-500`}>
                      <option value="low">Standard (96kbps)</option>
                      <option value="high">Premium (320kbps)</option>
                      <option value="veryHigh">Master (Lossless FLAC)</option>
                    </select>
                  </div>
                </div>

                <div className={`${isLightMode ? "bg-gray-50 border-gray-100" : "bg-[#111622]/40 border-white/5"} border rounded-2xl p-5`}>
                  <h3 className={`text-sm font-black ${isLightMode ? "text-gray-900" : "text-white"} uppercase tracking-wider mb-4 flex items-center gap-2`}>
                    <Waves size={16} className="text-purple-400" /> Sonic Experience
                  </h3>
                  <div className="space-y-2.5">
                    {playbackItems.map((item) => (
                      <div key={item.id} className={`p-4 ${isLightMode ? "bg-white border-gray-100" : "bg-black/20 border-white/5"} border rounded-xl transition-all`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 ${isLightMode ? "bg-gray-100" : "bg-white/5"} text-gray-400 rounded-lg shrink-0`}>{item.icon}</div>
                            <div>
                              <h4 className={`text-xs font-bold ${isLightMode ? "text-gray-900" : "text-white"}`}>{item.title}</h4>
                              <p className="text-[11px] text-gray-500 font-medium mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={playbackSettings[item.id] as boolean}
                              onChange={(e) => handlePlaybackChange(item.id, e.target.checked)}
                            />
                            <div className={`w-9 h-5 ${isLightMode ? "bg-gray-200" : "bg-gray-800"} rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full`}></div>
                          </label>
                        </div>
                        {item.type === "toggleWithSlider" && playbackSettings[item.id] && (
                          <div className={`mt-3 pt-3 border-t ${isLightMode ? "border-gray-100" : "border-white/5"} flex items-center gap-4 animate-in fade-in duration-200`}>
                            <input
                              type="range" min="1" max="12"
                              value={playbackSettings.crossfadeDuration}
                              onChange={(e) => handlePlaybackChange('crossfadeDuration', parseInt(e.target.value))}
                              className="flex-1 accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-[11px] text-blue-400 font-mono font-bold w-6 text-right">{playbackSettings.crossfadeDuration}s</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`flex gap-3 pt-4 border-t ${isLightMode ? "border-gray-100 bg-white" : "border-white/5 bg-[#05070c]"} sticky bottom-0 z-10 pb-2`}>
                  <button
                    disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                    onClick={handleSaveSettings}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]
                      ${hasUnsavedChanges ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/10' : (isLightMode ? 'bg-gray-100 text-gray-400' : 'bg-white/5 text-gray-500') + ' cursor-not-allowed'}`}>
                    <Save size={14} />
                    <span>{saveStatus === 'saving' ? 'Syncing Base...' : 'Commit Changes'}</span>
                  </button>
                  <button
                    onClick={handleResetSettings}
                    className={`px-5 py-3 ${isLightMode ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 text-gray-300 hover:bg-white/10"} font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 active:scale-[0.99]`}
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
