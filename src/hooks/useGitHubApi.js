import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

// In-memory fallback cache
const memoryCache = new Map();

const getCache = (key) => {
  const fullKey = `octoclash_cache_v2_${key}`;
  
  // 1. Check in-memory cache first
  if (memoryCache.has(fullKey)) {
    const { data, timestamp } = memoryCache.get(fullKey);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      memoryCache.delete(fullKey);
    } else {
      return data;
    }
  }

  // 2. Check localStorage
  try {
    const item = localStorage.getItem(fullKey);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(fullKey);
      return null;
    }
    
    // Populate memory cache for faster subsequent access
    memoryCache.set(fullKey, { data, timestamp });
    return data;
  } catch (e) {
    return null;
  }
};

const setCache = (key, data) => {
  const fullKey = `octoclash_cache_v2_${key}`;
  const cacheItem = { data, timestamp: Date.now() };

  // 1. Always write to in-memory cache
  memoryCache.set(fullKey, cacheItem);

  // 2. Attempt to write to localStorage
  try {
    localStorage.setItem(fullKey, JSON.stringify(cacheItem));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('localStorage quota exceeded. Relying on in-memory cache.');
    } else {
      console.warn('localStorage is unavailable. Relying on in-memory cache.', e);
    }
  }
};

export function useGitHubApi() {
  const token = useAppStore(state => state.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWithToken = useCallback(async (url, customAccept = null, retryCount = 0) => {
    const headers = {
      'Accept': customAccept || 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`https://api.github.com${url}`, { headers });
    
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining === '0' || response.status === 403) {
      throw new Error('rateLimit');
    }
    if (response.status === 404) {
      throw new Error('notFound');
    }
    if (response.status === 202) {
      if (retryCount >= 3) throw new Error('retryLater');
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1))); // Backoff
      return fetchWithToken(url, customAccept, retryCount + 1);
    }
    if (!response.ok) {
       throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  }, [token]);

  const fetchRepoData = useCallback(async (ownerRepo) => {
    const cacheKey = `repo_${ownerRepo}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    setLoading(true);
    setError(null);
    try {
      const [repoInfo, languages, commitActivityRaw, contributors, issues] = await Promise.all([
        fetchWithToken(`/repos/${ownerRepo}`),
        fetchWithToken(`/repos/${ownerRepo}/languages`).catch(e => { if (e.message === 'rateLimit') throw e; return {}; }),
        fetchWithToken(`/repos/${ownerRepo}/stats/commit_activity`).catch(e => { if (e.message === 'rateLimit') throw e; return []; }),
        fetchWithToken(`/repos/${ownerRepo}/contributors?per_page=5`).catch(e => { if (e.message === 'rateLimit') throw e; return []; }),
        fetchWithToken(`/repos/${ownerRepo}/issues?state=closed&per_page=30`).catch(e => { if (e.message === 'rateLimit') throw e; return []; })
      ]);

      const commitActivity = Array.isArray(commitActivityRaw) ? commitActivityRaw : [];
      const commitsLastYear = commitActivity.reduce((acc, week) => acc + (week.total || 0), 0);

      let avgIssueTime = null;
      if (Array.isArray(issues) && issues.length > 0) {
        const actualIssues = issues.filter(i => !i.pull_request && i.closed_at);
        if (actualIssues.length > 0) {
          const totalMs = actualIssues.reduce((acc, issue) => {
            const created = new Date(issue.created_at).getTime();
            const closed = new Date(issue.closed_at).getTime();
            return acc + (closed - created);
          }, 0);
          const avgMs = totalMs / actualIssues.length;
          const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
          avgIssueTime = avgDays === 0 ? '< 1 day' : `${avgDays} days`;
        }
      }

      const result = {
        info: repoInfo, // API returns KB. Do not multiply here.
        languages: languages || {},
        commitActivity: commitActivity,
        commitsLastYear,
        contributors: Array.isArray(contributors) ? contributors : [],
        avgIssueTime
      };

      setCache(cacheKey, result);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [token]);

  const searchRepos = useCallback(async (query) => {
    if (!query || query.length < 3) return [];
    const cacheKey = `search_${query}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchWithToken(`/search/repositories?q=${encodeURIComponent(query)}&per_page=5`);
      setCache(cacheKey, data.items || []);
      return data.items || [];
    } catch (err) {
      return [];
    }
  }, [token]);

  const fetchStarHistory = useCallback(async (ownerRepo, totalStars) => {
    const cacheKey = `stars_${ownerRepo}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const MAX_SAMPLES = 4;
      const totalPages = Math.ceil(totalStars / 100);
      const pagesToFetch = [];
      
      for (let i = 1; i <= MAX_SAMPLES; i++) {
        let page = Math.max(1, Math.floor((totalPages / MAX_SAMPLES) * i));
        if (i === 1) page = 1;
        if (!pagesToFetch.includes(page)) {
          pagesToFetch.push(page);
        }
      }

      const requests = pagesToFetch.map(page => 
        fetchWithToken(`/repos/${ownerRepo}/stargazers?page=${page}&per_page=100`, 'application/vnd.github.v3.star+json')
      );
      
      const responses = await Promise.all(requests.map(p => p.catch(e => [])));
      
      const historyPoints = [];
      responses.forEach((pageData, index) => {
        if (!pageData || pageData.length === 0) return;
        // Take the last stargazer on this page to represent the cumulative stars up to this page
        const lastStargazer = pageData[pageData.length - 1];
        const starsSoFar = (pagesToFetch[index] - 1) * 100 + pageData.length;
        if (lastStargazer && lastStargazer.starred_at) {
          historyPoints.push({
            date: lastStargazer.starred_at,
            stars: starsSoFar
          });
        }
      });

      // Add point 0
      historyPoints.unshift({ date: null, stars: 0 });

      setCache(cacheKey, historyPoints);
      return historyPoints;
    } catch (err) {
      return [];
    }
  }, [token]);

  const fetchReadmeHtml = useCallback(async (ownerRepo) => {
    const headers = {
      'Accept': 'application/vnd.github.html',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`https://api.github.com/repos/${ownerRepo}/readme`, { headers });
    
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining === '0' || response.status === 403) throw new Error('rateLimit');
    
    if (!response.ok) throw new Error('Failed to load README');
    return response.text();
  }, [token]);

  return { fetchRepoData, searchRepos, fetchStarHistory, fetchReadmeHtml, loading, error, setError };
}
