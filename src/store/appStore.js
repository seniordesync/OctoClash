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
