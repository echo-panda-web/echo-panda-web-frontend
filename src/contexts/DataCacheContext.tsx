import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

interface DataCacheContextType {
  // Getters with automatic fetch
  getCachedData: <T>(key: string, fetchFn: () => Promise<T>) => Promise<T>;
  // Clear specific cache
  clearCache: (key: string) => void;
  // Check if data is loading
  isLoading: (key: string) => boolean;
}

interface CacheEntry<T = any> {
  data: T;
  loading: boolean;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const pendingRef = useRef<Map<string, Promise<any>>>(new Map());

  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  const getCachedData = async <T,>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
    // If data exists in cache, return it
    const cached = cacheRef.current.get(key);
    if (cached && !cached.loading) {
      console.log(`✅ Cache HIT for: ${key}`);
      return cached.data as T;
    }

    // Return the in-flight promise when a request for this key is already running.
    const pending = pendingRef.current.get(key);
    if (pending) {
      console.log(`⏳ Already loading: ${key}`);
      return pending as Promise<T>;
    }

    console.log(`❌ Cache MISS for: ${key} - Fetching...`);
    // Mark as loading
    setCache(prev => {
      const next = new Map(prev).set(key, { data: null, loading: true });
      cacheRef.current = next;
      return next;
    });

    const requestPromise = (async () => {
      try {
        // Fetch fresh data
        const data = await fetchFn();

        // Store in cache
        setCache(prev => {
          const next = new Map(prev).set(key, { data, loading: false });
          cacheRef.current = next;
          return next;
        });
        console.log(`💾 Cached: ${key}`);

        return data;
      } catch (error) {
        // Remove loading state on error
        setCache(prev => {
          const next = new Map(prev);
          next.delete(key);
          cacheRef.current = next;
          return next;
        });
        throw error;
      } finally {
        pendingRef.current.delete(key);
      }
    })();

    pendingRef.current.set(key, requestPromise);
    return requestPromise;
  };

  const clearCache = (key: string) => {
    setCache(prev => {
      const next = new Map(prev);
      next.delete(key);
      cacheRef.current = next;
      return next;
    });
    pendingRef.current.delete(key);
  };

  const isLoading = (key: string): boolean => {
    return cacheRef.current.get(key)?.loading || false;
  };

  return (
    <DataCacheContext.Provider value={{ getCachedData, clearCache, isLoading }}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within DataCacheProvider');
  }
  return context;
};
