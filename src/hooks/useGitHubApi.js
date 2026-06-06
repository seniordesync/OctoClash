import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

const getCache = (key) => {
  try {
    const item = localStorage.getItem(`octoclash_cache_${key}`);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`octoclash_cache_${key}`);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
};

const setCache = (key, data) => {
  try {
    localStorage.setItem(`octoclash_cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Ignore quota exceeded
  }
};

export function useGitHubApi() {
  const token = useAppStore(state => state.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWithToken = async (url, customAccept = null) => {
    const headers = {
      'Accept': customAccept || 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`https://api.github.com${url}`, { headers });
    
    if (response.status === 403) {
      throw new Error('rateLimit');
    }
    if (response.status === 404) {
      throw new Error('notFound');
    }
    if (!response.ok) {
       if (response.status === 202) throw new Error('retryLater');
       throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  };

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
        fetchWithToken(`/repos/${ownerRepo}/stats/commit_activity`).catch(e => { if (e.message === 'rateLimit' || e.message === 'retryLater') throw e; return []; }),
        fetchWithToken(`/repos/${ownerRepo}/contributors?per_page=5`).catch(e => { if (e.message === 'rateLimit') throw e; return []; }),
        fetchWithToken(`/repos/${ownerRepo}/issues?state=closed&per_page=30`).catch(e => { if (e.message === 'rateLimit') throw e; return []; })
      ]);

      const commitActivity = commitActivityRaw || [];
      const commitsLastYear = commitActivity.reduce((acc, week) => acc + week.total, 0);

      let avgIssueTime = null;
      if (issues && issues.length > 0) {
        const actualIssues = issues.filter(i => !i.pull_request);
        if (actualIssues.length > 0) {
          const totalMs = actualIssues.reduce((acc, issue) => {
            if (!issue.closed_at) return acc;
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
        info: repoInfo,
        languages: languages || {},
        commitActivity: commitActivity,
        commitsLastYear,
        contributors: contributors || [],
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
    try {
      const headers = {
        'Accept': 'application/vnd.github.html',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`https://api.github.com/repos/${ownerRepo}/readme`, { headers });
      if (!response.ok) throw new Error('Failed to load README');
      const text = await response.text();
      return text;
    } catch (err) {
      return "<div class='p-4 text-center text-fg-muted'>Failed to load README or repository has no README.</div>";
    }
  }, [token]);

  return { fetchRepoData, searchRepos, fetchStarHistory, fetchReadmeHtml, loading, error, setError };
}
