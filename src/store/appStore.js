import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const normalizeRepo = (repo) => repo.trim().toLowerCase();

const areReposEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((repo, index) => normalizeRepo(repo) === normalizeRepo(b[index]));
};

export const useAppStore = create(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      token: '',
      setToken: (token) => set({ token }),

      repos: [],
      setRepos: (repos) => set((state) => {
        const uniqueRepos = [];
        const seen = new Set();
        for (const r of repos) {
          const lower = normalizeRepo(r);
          if (!seen.has(lower)) {
            seen.add(lower);
            uniqueRepos.push(r.trim());
          }
        }

        if (areReposEqual(state.repos, uniqueRepos)) {
          return state;
        }
        
        const sortedData = uniqueRepos.map(repo => 
          state.reposData.find(rd => rd?.info?.full_name?.toLowerCase() === repo.toLowerCase())
        ).filter(Boolean);
        return { repos: uniqueRepos, reposData: sortedData };
      }),
      addRepo: (repo) => set((state) => {
        const nextRepo = repo.trim();
        if (state.repos.some(existing => normalizeRepo(existing) === normalizeRepo(nextRepo))) return state;
        return { repos: [...state.repos, nextRepo] };
      }),
      removeRepo: (repo) => set((state) => ({
        repos: state.repos.filter(r => normalizeRepo(r) !== normalizeRepo(repo)),
        reposData: state.reposData.filter(rd => rd?.info?.full_name?.toLowerCase() !== normalizeRepo(repo))
      })),
      reorderRepos: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.repos);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        const sortedData = result.map(repo => 
          state.reposData.find(rd => rd?.info?.full_name?.toLowerCase() === repo.toLowerCase())
        ).filter(Boolean);

        return { repos: result, reposData: sortedData };
      }),

      previewRepo: null,
      setPreviewRepo: (previewRepo) => set({ previewRepo }),

      infiniteMode: false,
      setInfiniteMode: (infiniteMode) => set({ infiniteMode }),

      reposData: [],
      setReposData: (reposData) => set({ reposData }),
    }),
    {
      name: 'octoclash-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        theme: state.theme, 
        token: state.token,
        repos: state.repos,
        infiniteMode: state.infiniteMode
      }),
    }
  )
)
