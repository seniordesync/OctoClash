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
      // Use Promise.all to fetch everything concurrently for better performance
      const [repoInfo, languages, commitActivityRaw, contributors, issues] = await Promise.all([
        fetchWithToken(`/repos/${ownerRepo}`),
        fetchWithToken(`/repos/${ownerRepo}/languages`).catch(() => ({})),
        fetchWithToken(`/repos/${ownerRepo}/stats/commit_activity`).catch(() => []),
        fetchWithToken(`/repos/${ownerRepo}/contributors?per_page=5`).catch(() => []),
        fetchWithToken(`/repos/${ownerRepo}/issues?state=closed&per_page=30`).catch(() => [])
      ]);

      const commitActivity = commitActivityRaw || [];

      // Calculate avg issue resolution time
      let avgIssueTime = null;
      if (issues && issues.length > 0) {
        // Filter out PRs, since /issues returns PRs too
        const actualIssues = issues.filter(i => !i.pull_request);
        if (actualIssues.length > 0) {
          const totalMs = actualIssues.reduce((acc, issue) => {
            const created = new Date(issue.created_at).getTime();
            const closed = new Date(issue.closed_at).getTime();
            return acc + (closed - created);
          }, 0);
          const avgMs = totalMs / actualIssues.length;
          // convert to days
          const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
          avgIssueTime = avgDays === 0 ? '< 1 day' : `${avgDays} days`;
        }
      }

      const result = {
        info: repoInfo,
        languages: languages || {},
        commitActivity: commitActivity,
        contributors: contributors || [],
        avgIssueTime
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

  const fetchReadmeHtml = useCallback(async (ownerRepo) => {
    try {
      const headers = {
        'Accept': 'application/vnd.github.html',
      };
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }
      const response = await fetch(`https://api.github.com/repos/${ownerRepo}/readme`, { headers });
      if (!response.ok) throw new Error('Failed to load README');
      return await response.text();
    } catch (err) {
      return "<div class='p-4 text-center text-fg-muted'>Failed to load README or repository has no README.</div>";
    }
  }, [token]);

  return { fetchRepoData, fetchReadmeHtml, loading, error, setError };
}
