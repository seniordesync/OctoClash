const API_BASE_URL = 'https://api.github.com';
const CACHE_PREFIX = 'octoclash_cache_v3_';
const CACHE_TTL_MS = 1000 * 60 * 60;
const MEMORY_CACHE_LIMIT = 50;
const DEFAULT_MAX_RETRIES = 3;

const sharedMemoryCache = new Map();

const defaultSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function getFetch() {
  if (typeof fetch === 'undefined') {
    throw new Error('fetchUnavailable');
  }
  return fetch;
}

function hashToken(token) {
  let hash = 5381;
  for (let i = 0; i < token.length; i += 1) {
    hash = ((hash << 5) + hash) ^ token.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function normalizeForCache(value) {
  return String(value).trim().toLowerCase();
}

export function normalizeRepoFullName(value) {
  const raw = String(value || '').trim();
  const withoutGithubUrl = raw
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/^git@github\.com:/i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '');

  const parts = withoutGithubUrl.split('/');
  if (parts.length !== 2) {
    throw new Error('invalidRepo');
  }

  const [owner, repo] = parts;
  const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
  const repoPattern = /^[A-Za-z0-9._-]{1,100}$/;
  if (!ownerPattern.test(owner) || !repoPattern.test(repo) || repo === '.' || repo === '..') {
    throw new Error('invalidRepo');
  }

  return `${owner}/${repo}`;
}

function repoApiPath(ownerRepo, suffix = '') {
  const normalized = normalizeRepoFullName(ownerRepo);
  const [owner, repo] = normalized.split('/');
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${suffix}`;
}

function normalizeCacheItem(item, now) {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.timestamp !== 'number' || now - item.timestamp > CACHE_TTL_MS) {
    return null;
  }
  return item;
}

function touchMemoryCache(memoryCache, fullKey, item) {
  if (memoryCache.has(fullKey)) {
    memoryCache.delete(fullKey);
  }
  memoryCache.set(fullKey, item);

  while (memoryCache.size > MEMORY_CACHE_LIMIT) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
}

function getCache(key, { storage, memoryCache, now }) {
  const fullKey = `${CACHE_PREFIX}${key}`;

  if (memoryCache.has(fullKey)) {
    const item = normalizeCacheItem(memoryCache.get(fullKey), now);
    if (item) {
      touchMemoryCache(memoryCache, fullKey, item);
      return item.data;
    }
    memoryCache.delete(fullKey);
  }

  if (!storage) return null;

  try {
    const raw = storage.getItem(fullKey);
    if (!raw) return null;

    const item = normalizeCacheItem(JSON.parse(raw), now);
    if (!item) {
      storage.removeItem(fullKey);
      return null;
    }

    touchMemoryCache(memoryCache, fullKey, item);
    return item.data;
  } catch {
    return null;
  }
}

function setCache(key, data, { storage, memoryCache, now }) {
  const fullKey = `${CACHE_PREFIX}${key}`;
  const item = { data, timestamp: now };

  touchMemoryCache(memoryCache, fullKey, item);

  if (!storage) return;

  try {
    storage.setItem(fullKey, JSON.stringify(item));
  } catch (error) {
    if (error?.name === 'QuotaExceededError' || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('localStorage quota exceeded. Relying on in-memory cache.');
    } else {
      console.warn('localStorage is unavailable. Relying on in-memory cache.', error);
    }
  }
}

function safeDateMs(value) {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function normalizeRepoData({ repoInfo, languages, commitActivityRaw, contributors, issues }) {
  const commitActivity = Array.isArray(commitActivityRaw) ? commitActivityRaw : [];
  const commitsLastYear = commitActivity.reduce((acc, week) => acc + (Number(week?.total) || 0), 0);

  let avgIssueTime = null;
  if (Array.isArray(issues) && issues.length > 0) {
    const issueDurations = issues
      .filter(issue => !issue.pull_request && issue.closed_at)
      .map(issue => {
        const created = safeDateMs(issue.created_at);
        const closed = safeDateMs(issue.closed_at);
        if (created === null || closed === null || closed < created) return null;
        return closed - created;
      })
      .filter(duration => duration !== null);

    if (issueDurations.length > 0) {
      const avgMs = issueDurations.reduce((acc, duration) => acc + duration, 0) / issueDurations.length;
      const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
      avgIssueTime = avgDays === 0 ? '< 1 day' : `${avgDays} days`;
    }
  }

  return {
    info: repoInfo,
    languages: languages && typeof languages === 'object' ? languages : {},
    commitActivity,
    commitsLastYear,
    contributors: Array.isArray(contributors) ? contributors : [],
    avgIssueTime,
  };
}

export function createGitHubApiClient({
  token = '',
  fetchImpl = getFetch(),
  storage = getBrowserStorage(),
  memoryCache = sharedMemoryCache,
  now = Date.now,
  sleep = defaultSleep,
  maxRetries = DEFAULT_MAX_RETRIES,
} = {}) {
  const authToken = token.trim();
  const cacheScope = authToken ? `auth_${hashToken(authToken)}` : 'anon';
  const persistentStorage = authToken ? null : storage;

  const cacheOptions = () => ({
    storage: persistentStorage,
    memoryCache,
    now: now(),
  });

  const fetchWithToken = async (url, customAccept = null, retryCount = 0) => {
    const headers = {
      Accept: customAccept || 'application/vnd.github.v3+json',
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetchImpl(`${API_BASE_URL}${url}`, { headers });
    const remaining = response.headers?.get?.('X-RateLimit-Remaining');

    if (response.status === 429 || (response.status === 403 && remaining === '0')) {
      throw new Error('rateLimit');
    }
    if (response.status === 403) {
      throw new Error('forbidden');
    }
    if (response.status === 404) {
      throw new Error('notFound');
    }
    if (response.status === 202) {
      if (retryCount >= maxRetries) throw new Error('retryLater');
      await sleep(1000 * (retryCount + 1));
      return fetchWithToken(url, customAccept, retryCount + 1);
    }
    if (!response.ok) {
      throw new Error(`http${response.status}`);
    }

    return response.json();
  };

  const cached = async (key, loader) => {
    const cachedData = getCache(`${cacheScope}_${key}`, cacheOptions());
    if (cachedData) return cachedData;

    const data = await loader();
    setCache(`${cacheScope}_${key}`, data, cacheOptions());
    return data;
  };

  const fetchRepoData = async (ownerRepo) => {
    const normalizedRepo = normalizeRepoFullName(ownerRepo);
    const cacheKey = `repo_${normalizeForCache(normalizedRepo)}`;

    return cached(cacheKey, async () => {
      const basePath = repoApiPath(normalizedRepo);
      const [repoInfo, languages, commitActivityRaw, contributors, issues] = await Promise.all([
        fetchWithToken(basePath),
        fetchWithToken(`${basePath}/languages`).catch(error => {
          if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
          return {};
        }),
        fetchWithToken(`${basePath}/stats/commit_activity`).catch(error => {
          if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
          return [];
        }),
        fetchWithToken(`${basePath}/contributors?per_page=5`).catch(error => {
          if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
          return [];
        }),
        fetchWithToken(`${basePath}/issues?state=closed&per_page=30`).catch(error => {
          if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
          return [];
        }),
      ]);

      return normalizeRepoData({ repoInfo, languages, commitActivityRaw, contributors, issues });
    });
  };

  const searchRepos = async (query) => {
    const normalizedQuery = String(query || '').trim();
    if (normalizedQuery.length < 3) return [];

    const cacheKey = `search_${normalizeForCache(normalizedQuery)}`;
    return cached(cacheKey, async () => {
      const data = await fetchWithToken(`/search/repositories?q=${encodeURIComponent(normalizedQuery)}&per_page=5`);
      return Array.isArray(data?.items) ? data.items : [];
    });
  };

  const fetchStarHistory = async (ownerRepo, totalStars) => {
    const normalizedRepo = normalizeRepoFullName(ownerRepo);
    const safeTotalStars = Math.max(0, Number(totalStars) || 0);
    if (safeTotalStars === 0) return [{ date: null, stars: 0 }];

    const cacheKey = `stars_${normalizeForCache(normalizedRepo)}_${safeTotalStars}`;
    return cached(cacheKey, async () => {
      const maxSamples = 4;
      const totalPages = Math.ceil(safeTotalStars / 100);
      const pagesToFetch = [];

      for (let i = 1; i <= maxSamples; i += 1) {
        let page = Math.max(1, Math.floor((totalPages / maxSamples) * i));
        if (i === 1) page = 1;
        if (!pagesToFetch.includes(page)) pagesToFetch.push(page);
      }

      const basePath = repoApiPath(normalizedRepo);
      const responses = await Promise.all(
        pagesToFetch.map(page => (
          fetchWithToken(`${basePath}/stargazers?page=${page}&per_page=100`, 'application/vnd.github.v3.star+json')
            .catch(error => {
              if (error.message === 'rateLimit' || error.name === 'TypeError') throw error;
              return [];
            })
        ))
      );

      const historyPoints = [{ date: null, stars: 0 }];
      responses.forEach((pageData, index) => {
        if (!Array.isArray(pageData) || pageData.length === 0) return;
        const lastStargazer = pageData[pageData.length - 1];
        const starsSoFar = Math.min(safeTotalStars, (pagesToFetch[index] - 1) * 100 + pageData.length);
        if (lastStargazer?.starred_at) {
          historyPoints.push({
            date: lastStargazer.starred_at,
            stars: starsSoFar,
          });
        }
      });

      return historyPoints;
    });
  };

  const fetchReadmeHtml = async (ownerRepo) => {
    const readmePath = repoApiPath(ownerRepo, '/readme');
    const response = await fetchImpl(`${API_BASE_URL}${readmePath}`, {
      headers: {
        Accept: 'application/vnd.github.html',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    const remaining = response.headers?.get?.('X-RateLimit-Remaining');
    if (response.status === 429 || (response.status === 403 && remaining === '0')) {
      throw new Error('rateLimit');
    }
    if (!response.ok) throw new Error('readmeFailed');
    return response.text();
  };

  return {
    fetchRepoData,
    searchRepos,
    fetchStarHistory,
    fetchReadmeHtml,
  };
}

export function clearSharedGitHubApiCache() {
  sharedMemoryCache.clear();
}
