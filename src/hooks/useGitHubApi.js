import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { createGitHubApiClient } from '../services/githubApi';

export function useGitHubApi() {
  const token = useAppStore(state => state.token);
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState(null);

  const client = useMemo(() => createGitHubApiClient({ token }), [token]);
  const loading = loadingCount > 0;

  const runTracked = useCallback(async (operation, { failWithNull = false } = {}) => {
    setLoadingCount(count => count + 1);
    setError(null);

    try {
      return await operation();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknownError';
      setError(message);
      if (failWithNull) return null;
      throw err;
    } finally {
      setLoadingCount(count => Math.max(0, count - 1));
    }
  }, []);

  const fetchRepoData = useCallback((ownerRepo) => (
    runTracked(() => client.fetchRepoData(ownerRepo), { failWithNull: true })
  ), [client, runTracked]);

  const searchRepos = useCallback(async (query) => {
    try {
      return await client.searchRepos(query);
    } catch (err) {
      if (err instanceof Error && err.message === 'rateLimit') throw err;
      return [];
    }
  }, [client]);

  const fetchStarHistory = useCallback(async (ownerRepo, totalStars) => {
    try {
      return await client.fetchStarHistory(ownerRepo, totalStars);
    } catch (err) {
      if (err instanceof Error && err.message === 'rateLimit') throw err;
      return [];
    }
  }, [client]);

  const fetchReadmeHtml = useCallback((ownerRepo) => (
    client.fetchReadmeHtml(ownerRepo)
  ), [client]);

  return { fetchRepoData, searchRepos, fetchStarHistory, fetchReadmeHtml, loading, error, setError };
}
