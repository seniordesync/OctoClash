import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { RepoInput } from './components/compare/RepoInput';
import { ComparisonTable } from './components/compare/ComparisonTable';
import { Charts } from './components/compare/Charts';
import { ReadmeModal } from './components/compare/ReadmeModal';
import { SharePanel } from './components/compare/SharePanel';
import { Alert } from './components/ui/Alert';
import { MonaOctocat } from './assets/MonaOctocat';
import { useGitHubApi } from './hooks/useGitHubApi';
import { useAppStore } from './store/appStore';

function App() {
  const repos = useAppStore(state => state.repos);
  const setRepos = useAppStore(state => state.setRepos);
  const addRepo = useAppStore(state => state.addRepo);

  const { fetchRepoData, loading, error, setError } = useGitHubApi();

  const [reposData, setReposData] = useState([]);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'charts'

  // Initialize repos from URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reposParam = params.get('repos');
    if (reposParam) {
      const initialRepos = reposParam.split(',').filter(Boolean);
      setRepos(initialRepos);
    }
  }, [setRepos]);

  // Sync state repos to URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (repos.length > 0) {
      params.set('repos', repos.join(','));
    } else {
      params.delete('repos');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [repos]);

  // Fetch data for all current repos
  useEffect(() => {
    let isMounted = true;

    const loadAll = async () => {
      if (repos.length === 0) {
        if (isMounted) setReposData([]);
        return;
      }

      const results = [];
      for (const repo of repos) {
        // Try fetching or getting from cache
        const data = await fetchRepoData(repo);
        if (data && isMounted) {
          results.push(data);
        }
      }
      
      if (isMounted) {
        setReposData(results);
      }
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [repos, fetchRepoData]);

  const handleFetchRepo = useCallback(async (ownerRepo) => {
    if (repos.includes(ownerRepo)) return;
    const data = await fetchRepoData(ownerRepo);
    if (data) {
      addRepo(ownerRepo);
    }
  }, [repos, fetchRepoData, addRepo]);

  const getErrorMessage = (err) => {
    if (err === 'notFound') return 'Repository not found.';
    if (err === 'rateLimit') return 'API Rate limit exceeded. Please add a Personal Access Token.';
    return err;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <RepoInput onFetchRepo={handleFetchRepo} />

        {error && (
          <div className="mb-6">
            <Alert 
              message={getErrorMessage(error)} 
              onClose={() => setError(null)} 
            />
          </div>
        )}

        {loading && (
          <div className="flex flex-col justify-center items-center py-12 gap-4">
            <MonaOctocat className="w-24 h-24" />
            <p className="text-fg-muted font-medium animate-pulse">Loading data from GitHub...</p>
          </div>
        )}

        {!loading && reposData.length > 0 && (
          <div className="mt-8" id="compare-container">
            <div className="border-b border-border-default mb-6" data-html2canvas-ignore="true">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('table')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'table' 
                      ? 'border-fg-accent text-fg-default' 
                      : 'border-transparent text-fg-muted hover:text-fg-default hover:border-border-muted'
                  }`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setActiveTab('charts')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'charts' 
                      ? 'border-fg-accent text-fg-default' 
                      : 'border-transparent text-fg-muted hover:text-fg-default hover:border-border-muted'
                  }`}
                >
                  Charts View
                </button>
              </nav>
            </div>

            {activeTab === 'table' ? (
              <ComparisonTable reposData={reposData} />
            ) : (
              <Charts reposData={reposData} />
            )}
            
            <SharePanel targetId="compare-container" />
          </div>
        )}

        {!loading && reposData.length === 0 && repos.length === 0 && (
          <div className="py-24 text-center">
            <MonaOctocat className="w-32 h-32 mx-auto mb-6 opacity-20 grayscale" />
            <h2 className="text-xl font-semibold text-fg-default mb-2">No repositories added yet</h2>
            <p className="text-fg-muted max-w-md mx-auto text-sm">
              Start by adding a GitHub repository in the format <code>owner/repo</code> above to compare their statistics, commit activity, and languages.
            </p>
          </div>
        )}
      </main>

      <Footer />
      <ReadmeModal />
    </div>
  );
}

export default App;
