/**
 * Simple cache service to reduce Supabase bandwidth usage
 * Caches data in localStorage with expiration
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

export class CacheService {
  private static readonly PREFIX = 'echopanda_cache_';
  
  /**
   * Set cache with expiration time
   * @param key Cache key
   * @param data Data to cache
   * @param expiresInMinutes How long to cache (default 30 minutes)
   */
  static set<T>(key: string, data: T, expiresInMinutes: number = 30): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: expiresInMinutes * 60 * 1000,
      };
      localStorage.setItem(
        `${this.PREFIX}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  /**
   * Get cached data if not expired
   * @param key Cache key
   * @returns Cached data or null if expired/not found
   */
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.PREFIX}${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();
      
      // Check if expired
      if (now - entry.timestamp > entry.expiresIn) {
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(`${this.PREFIX}${key}`);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache key for paginated data
   */
  static getPaginationKey(base: string, limit: number, offset: number): string {
    return `${base}_limit${limit}_offset${offset}`;
  }
}
