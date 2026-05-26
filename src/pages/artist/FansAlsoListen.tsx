import { useState, useEffect } from 'react';
import ArtistSection from '../home/Artists';
import { getDerivedArtists } from '../../backend/catalogService';
import { useDataCache } from '../../contexts/DataCacheContext';

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface Props {
  artistId?: string;
}

export default function FansAlsoListen({ artistId }: Props) {
  const { getCachedData } = useDataCache();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
  }, [artistId]);

  const fetchArtists = async () => {
    try {
      const data = await getCachedData(`fans_also_listen_${artistId || 'all'}`, async () => {
        console.log('🔄 [Fans Also Listen] Fetching related artists...');

        let artistsData = await getDerivedArtists(20);
        if (artistId) {
          artistsData = artistsData.filter((artist) => artist.id !== artistId && encodeURIComponent(artist.name) !== artistId);
        }
        console.log(`✅ [Fans Also Listen] ${artistsData?.length || 0} artists loaded`);
        return artistsData || [];
      });

      setArtists(data);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-12">
        <div className="text-center py-8">
          <p className="text-zinc-400">Loading artists...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <ArtistSection
        title="Fans Also Listen To"
        isLightMode={false}
        artists={artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url,
        }))}
      />
    </section>
  );
}