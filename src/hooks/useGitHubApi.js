import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

const cache = new Map();

export function useGitHubApi() {
  const token = useAppStore(state => state.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWithToken = async (url) => {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    const response = await fetch(`https://api.github.com${url}`, { headers });
    
    if (response.status === 403) {
      throw new Error('rateLimit');
    }
    if (response.status === 404) {
      throw new Error('notFound');
    }
    if (!response.ok) {
       // Could be 202 for stats, we will just handle it as empty for now to avoid hanging
       if (response.status === 202) return null; 
       throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  };

  const fetchRepoData = useCallback(async (ownerRepo) => {
    if (cache.has(ownerRepo)) {
      return cache.get(ownerRepo);
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch main repo info
      const repoInfo = await fetchWithToken(`/repos/${ownerRepo}`);
      
      // Fetch languages
      const languages = await fetchWithToken(`/repos/${ownerRepo}/languages`);
      
      // Fetch commit activity (last year, weekly)
      let commitActivity = await fetchWithToken(`/repos/${ownerRepo}/stats/commit_activity`);
      // If 202, it means GitHub is computing it. We return empty array to prevent failure.
      if (!commitActivity) commitActivity = [];

      const result = {
        info: repoInfo,
        languages: languages || {},
        commitActivity: commitActivity,
      };

      cache.set(ownerRepo, result);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [token]);

  return { fetchRepoData, loading, error, setError };
}
