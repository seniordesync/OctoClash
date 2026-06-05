import { create } from 'zustand'

const getInitialTheme = () => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return 'system';
};

const getInitialToken = () => {
  const saved = localStorage.getItem('github_pat');
  return saved || '';
};

export const useAppStore = create((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  token: getInitialToken(),
  setToken: (token) => {
    localStorage.setItem('github_pat', token);
    set({ token });
  },

  repos: [],
  setRepos: (repos) => set({ repos }),
  addRepo: (repo) => set((state) => {
    if (state.repos.includes(repo)) return state;
    return { repos: [...state.repos, repo] };
  }),
  removeRepo: (repo) => set((state) => ({
    repos: state.repos.filter(r => r !== repo)
  })),

  infiniteMode: false,
  setInfiniteMode: (infiniteMode) => set({ infiniteMode }),
}))
