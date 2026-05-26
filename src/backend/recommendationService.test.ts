import { describe, it, expect } from 'vitest';
import { getRecommendationsForInterests } from './recommendationService';

describe('recommendationService', () => {
  it('returns songs for Pop interest', async () => {
    const res = await getRecommendationsForInterests(['Pop']);
    expect(res.length).toBeGreaterThan(0);
  });

  it('returns fallback when interests unknown', async () => {
    const res = await getRecommendationsForInterests(['UnknownGenre']);
    expect(res.length).toBeGreaterThan(0);
  });
});
