import React, { useState, useEffect } from "react";

interface StepConfig {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (interests: string[]) => void;
  genreOptions?: string[]; // Dynamic genres from categories table
}

const DEFAULT_STEPS_CONFIG: StepConfig[] = [
  { id: "moods", title: "Your Current Mood", subtitle: "How are you feeling right now?", options: ["Happy", "Sad", "Chill", "Focus"] },
  { id: "languages", title: "Preferred Language", subtitle: "Which language do you prefer for your music?", options: ["Khmer", "English", "Korean", "Chinese", "Indonesian"] },
];


const InterestOnboardingModal: React.FC<Props> = ({ isOpen, onClose, onSave, genreOptions = [] }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({
    genres: [],
    moods: [],
    languages: [],
  });
  const [loading, setLoading] = useState(false);

  // Build STEPS with dynamic genres
  const STEPS: StepConfig[] = [
    {
      id: "genres",
      title: "Choose Your Favorite Genres",
      subtitle: "What kind of music do you enjoy listening to?",
      options: genreOptions.length > 0 ? genreOptions : ["Pop", "K-Pop", "Khmer", "EDM", "Rap"],
    },
    ...DEFAULT_STEPS_CONFIG.slice(1),
  ];

  // Rehydrate draft when modal opens (so users don't lose progress)
  useEffect(() => {
    if (!isOpen) return;
    try {
      const draft = localStorage.getItem('onboardingDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.selections) setSelections(parsed.selections);
        if (typeof parsed.currentStep === 'number') setCurrentStep(parsed.currentStep);
      }
    } catch (e) {
      // ignore
    }
  }, [isOpen]);

  // Persist draft on changes so progress survives closes/reloads
  useEffect(() => {
    try {
      localStorage.setItem('onboardingDraft', JSON.stringify({ selections, currentStep }));
    } catch (e) {}
  }, [selections, currentStep]);

  if (!isOpen) return null;

  const stepData = STEPS[currentStep];

  const toggleOption = (option: string) => {
    const key = stepData.id;
    setSelections((prev) => ({
      ...prev,
      [key]: prev[key].includes(option)
        ? prev[key].filter((i) => i !== option)
        : [...prev[key], option],
    }));

    // Analytics: record option selected/unselected
    try {
      const { trackEvent } = require('../../services/analyticsService');
      trackEvent('onboarding_option_toggled', { step: key, option });
    } catch (e) {}
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submit();
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      // Simulation of your API logic
      console.log("Saving Preferences:", selections);

      // Persist completed preferences, mark completed and clear draft
      try {
        localStorage.setItem('onboardingPreferences', JSON.stringify(selections));
        localStorage.setItem('onboardingCompleted', '1');
        localStorage.removeItem('onboardingDraft');
      } catch (e) {}

      window.dispatchEvent(new CustomEvent("onboarding:completed", { detail: selections }));
      // Inform parent of selected interests
      try {
        const flattened = Object.values(selections).flat();
        onSave?.(flattened);
      } catch (e) {}
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl overflow-hidden bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-2xl">

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 flex">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 transition-all duration-500 ${i <= currentStep ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-zinc-800'}`}
            />
          ))}
        </div>
        <div className="p-8">
          <header className="mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white mb-2">{stepData.title}</h2>
            <p className="text-zinc-400 font-medium">{stepData.subtitle}</p>
          </header>

          {/* Selection Area: Pinterest-style "Pills" */}
          <div className="flex flex-wrap gap-2 mb-10">
              {stepData.options.map((option) => {
                const arr = selections[stepData.id] || [];
                const isSelected = arr.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleOption(option)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border-2 ${
                      isSelected 
                      ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
          </div>

          <footer className="flex items-center justify-between">
            <button 
              onClick={() => {
                try { localStorage.setItem('onboardingDraft', JSON.stringify({ selections, currentStep })); } catch (e) {}
                try { localStorage.setItem('onboardingCompleted', '1'); } catch (e) {}
                window.dispatchEvent(new CustomEvent('onboarding:skipped'));
                onClose();
              }}
              className="text-zinc-500 hover:text-white text-sm font-bold transition"
            >
              Skip for now
            </button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-3 rounded-2xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : (currentStep === STEPS.length - 1 ? 'Finish ✨' : 'Next')}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default InterestOnboardingModal;