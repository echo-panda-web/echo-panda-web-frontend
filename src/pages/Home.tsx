import React, { useState, useEffect } from "react";
import SongSection from "../components/SongsSection";
import ArtistSection from "../components/ArtistsSection";
import AppFooter from "../components/AppFooter";
import ContactUs from "./ContactUs";
import { useNavigate } from "react-router-dom";
import InterestOnboardingModal from "../components/InterestOnboardingModal";
import { getRecommendationsForInterests, type AlbumRef } from "../backend/recommendationService";
import { getDerivedCategories, getHomeTags } from "../backend/catalogService";
import { useDataCache } from "../contexts/DataCacheContext";

interface Tag {
  id: string;
  name: string;
  description: string;
  display_order: number;
  albums: any[];
}

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleDiscover = () => {
    navigate("/discover");
  };

  const handleCreatePlaylist = () => {
    navigate("/playlist");
  };

  const isLightMode = false;
  const { getCachedData } = useDataCache();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [recommendedAlbums, setRecommendedAlbums] = useState<AlbumRef[] | undefined>(undefined);
  const [tags, setTags] = useState<Tag[]>([]);
  const [genreOptions, setGenreOptions] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('onboarding:interests');
    if (!stored) {
      setIsOnboardingOpen(true);
    } else {
      try {
        const interests = JSON.parse(stored);
        getRecommendationsForInterests(interests).then(setRecommendedAlbums);
      } catch (e) {
        // ignore
      }
    }

    // Fetch dynamic genres and tags
    fetchGenres();
    fetchTags();
  }, []);

  const fetchGenres = async () => {
    try {
      const categoryData = await getDerivedCategories();
      const genreNames = (categoryData || []).map((cat: any) => cat.name);
      setGenreOptions(genreNames);
      console.log('✅ [Home] Genres loaded:', genreNames);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await getCachedData('home_tags', async () => {
        console.log('🔄 [Home] Fetching active tags...');

        const transformedTags = await getHomeTags();

        console.log(`✅ [Home] ${transformedTags.length} active tags loaded`);
        return transformedTags;
      });

      setTags(data);
      console.log('🏷️ [Home] Tags state updated:', data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleOnboardingSave = (interests: string[]) => {
    localStorage.setItem('onboarding:interests', JSON.stringify(interests));
    setIsOnboardingOpen(false);
    getRecommendationsForInterests(interests).then(setRecommendedAlbums);
  };

  return (
    <div className="w-full max-w-full">
      {/* Hero */}
      {/* Hero */}
      <section className="relative mt-4 mb-8 overflow-hidden min-h-75 md:min-h-112.5 lg:min-h-137.5">
        {/* Bg Image */}
        <div className="absolute inset-0">
          <img
            src="/image.webp"
            alt=""
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 md:bg-black/20" />

        {/* Content */}
        <div className="relative z-10 px-6 py-16 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center min-h-75">
            {/* Left Content */}
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                All the <span className="text-blue-500">Best Songs</span>
                <br />
                in One Place
              </h1>

              <p className="text-gray-200 text-sm md:text-base leading-relaxed max-w-xl mx-auto md:mx-0">
                On our website, you can access an amazing collection of popular and
                new songs. Stream high-quality music and enjoy without interruptions —
                whatever your taste, we have it ready for you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button
                  onClick={handleDiscover}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Discover Now
                </button>

                <button
                  onClick={handleCreatePlaylist}
                  className="px-6 py-3 border border-blue-400 text-blue-300 rounded-lg hover:bg-blue-400/20 transition cursor-pointer"
                >
                  Create Playlist
                </button>
              </div>
            </div>

            <div className="hidden md:block" />
          </div>
        </div>
      </section>

      {recommendedAlbums && recommendedAlbums.length > 0 && (
        <SongSection title="Recommended for you" isLightMode={isLightMode} songs={recommendedAlbums} />
      )}

      {/* Trending Songs */}
      <SongSection title="Trending Songs" isLightMode={isLightMode} limit={6} offset={0} />

      {/* Popular Artists */}
      <ArtistSection title="Popular Artists" isLightMode={isLightMode} layout="grid" />

      {/* Dynamic Tag Sections */}
      {tags.map((tag) => (
        <SongSection
          key={tag.id}
          title={tag.name}
          isLightMode={isLightMode}
          songs={tag.albums}
        />
      ))}

      {/* Contact Us */}
      <div className="mb-12">
        <ContactUs isLightMode={isLightMode} />
      </div>

      {/* Onboarding modal */}
      <InterestOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSave={handleOnboardingSave}
        genreOptions={genreOptions}
      />

      {/* Footer */}
      <AppFooter isLightMode={isLightMode} />
    </div>
  );
};

export default Home;
