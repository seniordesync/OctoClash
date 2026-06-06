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
      setRepos: (repos) => set({ repos }),
      addRepo: (repo) => set((state) => {
        if (state.repos.includes(repo)) return state;
        return { repos: [...state.repos, repo] };
      }),
      removeRepo: (repo) => set((state) => ({
        repos: state.repos.filter(r => r !== repo)
      })),
      reorderRepos: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.repos);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { repos: result };
      }),

      previewRepo: null,
      setPreviewRepo: (previewRepo) => set({ previewRepo }),

      infiniteMode: false,
      setInfiniteMode: (infiniteMode) => set({ infiniteMode }),
    }),
    {
      name: 'octoclash-storage',
      partialize: (state) => ({ theme: state.theme, token: state.token }),
    }
  )
)
