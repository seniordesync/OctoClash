import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      token: '',
      setToken: (token) => set({ token }),

      repos: [],
      setRepos: (repos) => set((state) => {
        const sortedData = repos.map(repo => 
          state.reposData.find(rd => rd.info.full_name.toLowerCase() === repo.toLowerCase())
        ).filter(Boolean);
        return { repos, reposData: sortedData };
      }),
      addRepo: (repo) => set((state) => {
        if (state.repos.includes(repo)) return state;
        return { repos: [...state.repos, repo] };
      }),
      removeRepo: (repo) => set((state) => ({
        repos: state.repos.filter(r => r !== repo),
        reposData: state.reposData.filter(rd => rd.info.full_name.toLowerCase() !== repo.toLowerCase())
      })),
      reorderRepos: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.repos);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        const sortedData = result.map(repo => 
          state.reposData.find(rd => rd.info.full_name.toLowerCase() === repo.toLowerCase())
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
      partialize: (state) => ({ 
        theme: state.theme, 
        token: state.token,
        repos: state.repos,
        infiniteMode: state.infiniteMode
      }),
    }
  )
)
