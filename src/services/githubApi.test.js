import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  clearSharedGitHubApiCache,
  createGitHubApiClient,
  normalizeRepoData,
  normalizeRepoFullName,
} from './githubApi';

function response(body, { status = 200, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => headers[name] ?? null,
    },
    json: async () => body,
    text: async () => String(body),
  };
}

function createStorage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key: (index) => Array.from(data.keys())[index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe('githubApi service', () => {
  beforeEach(() => {
    clearSharedGitHubApiCache();
  });

  it('normalizes supported GitHub repository inputs', () => {
    expect(normalizeRepoFullName(' facebook/react ')).toBe('facebook/react');
    expect(normalizeRepoFullName('https://github.com/vitejs/vite.git')).toBe('vitejs/vite');
    expect(normalizeRepoFullName('git@github.com:owner-name/repo_name.git')).toBe('owner-name/repo_name');
  });

  it('rejects repository names that would create unsafe API paths', () => {
    expect(() => normalizeRepoFullName('../react')).toThrow('invalidRepo');
    expect(() => normalizeRepoFullName('facebook/react/issues')).toThrow('invalidRepo');
    expect(() => normalizeRepoFullName('face book/react')).toThrow('invalidRepo');
  });

  it('normalizes repository payloads and ignores invalid issue durations', () => {
    const result = normalizeRepoData({
      repoInfo: { full_name: 'owner/repo' },
      languages: null,
      commitActivityRaw: [{ total: 2 }, { total: '3' }, { total: null }],
      contributors: null,
      issues: [
        { created_at: '2024-01-01T00:00:00Z', closed_at: '2024-01-03T00:00:00Z' },
        { created_at: 'bad', closed_at: '2024-01-03T00:00:00Z' },
        { created_at: '2024-01-01T00:00:00Z', closed_at: '2023-01-01T00:00:00Z' },
        { pull_request: {}, created_at: '2024-01-01T00:00:00Z', closed_at: '2024-01-03T00:00:00Z' },
      ],
    });

    expect(result.languages).toEqual({});
    expect(result.commitsLastYear).toBe(5);
    expect(result.contributors).toEqual([]);
    expect(result.avgIssueTime).toBe('2 days');
  });

  it('caches anonymous repository data in storage and memory', async () => {
    const storage = createStorage();
    const fetchImpl = vi.fn(async (url) => {
      if (url.endsWith('/languages')) return response({ JavaScript: 100 });
      if (url.endsWith('/stats/commit_activity')) return response([{ total: 7 }]);
      if (url.includes('/contributors')) return response([{ login: 'dev' }]);
      if (url.includes('/issues')) return response([]);
      return response({ full_name: 'facebook/react', name: 'react' });
    });

    const client = createGitHubApiClient({ fetchImpl, storage, now: () => 10_000 });
    const first = await client.fetchRepoData('Facebook/React');
    const second = await client.fetchRepoData('facebook/react');

    expect(first).toEqual(second);
    expect(first.commitsLastYear).toBe(7);
    expect(fetchImpl).toHaveBeenCalledTimes(5);
    expect(storage.length).toBe(1);
  });

  it('keeps authenticated responses out of persistent storage', async () => {
    const storage = createStorage();
    const fetchImpl = vi.fn(async (url) => {
      if (url.endsWith('/languages')) return response({});
      if (url.endsWith('/stats/commit_activity')) return response([]);
      if (url.includes('/contributors')) return response([]);
      if (url.includes('/issues')) return response([]);
      return response({ full_name: 'private/repo', name: 'repo' });
    });

    const client = createGitHubApiClient({ token: 'secret-token', fetchImpl, storage });
    await client.fetchRepoData('private/repo');

    expect(storage.length).toBe(0);
  });

  it('retries 202 responses with backoff before returning data', async () => {
    const sleeps = [];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response({}, { status: 202 }))
      .mockResolvedValueOnce(response({}, { status: 202 }))
      .mockResolvedValueOnce(response({ items: [{ full_name: 'owner/repo' }] }));

    const client = createGitHubApiClient({
      fetchImpl,
      storage: null,
      sleep: async (ms) => sleeps.push(ms),
    });

    const results = await client.searchRepos('owner');

    expect(results).toEqual([{ full_name: 'owner/repo' }]);
    expect(sleeps).toEqual([1000, 2000]);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('surfaces rate limits and does not cache failed searches', async () => {
    const storage = createStorage();
    const fetchImpl = vi.fn(async () => response({}, {
      status: 403,
      headers: { 'X-RateLimit-Remaining': '0' },
    }));
    const client = createGitHubApiClient({ fetchImpl, storage });

    await expect(client.searchRepos('react')).rejects.toThrow('rateLimit');

    expect(storage.length).toBe(0);
  });
});
