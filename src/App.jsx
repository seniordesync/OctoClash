import React, { useEffect, useState, useCallback, lazy, Suspense, startTransition } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { RepoInput } from './components/compare/RepoInput';
import { ComparisonTable } from './components/compare/ComparisonTable';
import { SharePanel } from './components/compare/SharePanel';
import { Alert } from './components/ui/Alert';
import { MonaOctocat } from './assets/MonaOctocat';
import { useGitHubApi } from './hooks/useGitHubApi';
import { useAppStore } from './store/appStore';

const Charts = lazy(() => import('./components/compare/Charts').then(m => ({ default: m.Charts })));
const ReadmeModal = lazy(() => import('./components/compare/ReadmeModal').then(m => ({ default: m.ReadmeModal })));

function App() {
  const repos = useAppStore(state => state.repos);
  const setRepos = useAppStore(state => state.setRepos);
  const addRepo = useAppStore(state => state.addRepo);

  const { fetchRepoData, loading, error, setError } = useGitHubApi();

  const reposData = useAppStore(state => state.reposData);
  const setReposData = useAppStore(state => state.setReposData);
  const previewRepo = useAppStore(state => state.previewRepo);
  
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'charts'
  const [isUrlInitialized, setIsUrlInitialized] = useState(false);

  // Sync state between URL and Zustand
  useEffect(() => {
    if (!isUrlInitialized) {
      const params = new URLSearchParams(window.location.search);
      const reposParam = params.get('repos');
      if (reposParam) {
        setRepos(reposParam.split(',').filter(Boolean));
      }
      setIsUrlInitialized(true);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (repos.length > 0) {
      params.set('repos', repos.join(','));
    } else {
      params.delete('repos');
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [repos, isUrlInitialized, setRepos]);

  // Fetch data for missing repos in parallel
  useEffect(() => {
    let isMounted = true;

    const loadMissing = async () => {
      if (repos.length === 0) {
        if (isMounted && reposData.length > 0) setReposData([]);
        return;
      }

      const missingRepos = repos.filter(repo => !reposData.some(rd => rd.info.full_name.toLowerCase() === repo.toLowerCase()));
      if (missingRepos.length === 0) return; // No fetching needed if just reordering

      try {
        const fetchPromises = missingRepos.map(repo => fetchRepoData(repo));
        const newResults = await Promise.all(fetchPromises);
        
        if (isMounted) {
          const combined = [...reposData, ...newResults.filter(Boolean)];
          const sorted = repos.map(repo => combined.find(rd => rd.info.full_name.toLowerCase() === repo.toLowerCase())).filter(Boolean);
          setReposData(sorted);
        }
      } catch (e) {
        console.error('Failed to load repos in parallel', e);
      }
    };

    loadMissing();

    return () => {
      isMounted = false;
    };
  }, [repos, reposData, fetchRepoData, setReposData]);

  const handleFetchRepo = useCallback(async (ownerRepo) => {
    if (repos.includes(ownerRepo)) return;
    try {
      const data = await fetchRepoData(ownerRepo);
      if (data) {
        addRepo(ownerRepo);
      }
    } catch (e) {
      console.error(e);
    }
  }, [repos, fetchRepoData, addRepo]);

  const getErrorMessage = useCallback((err) => {
    if (err === 'notFound') return 'Repository not found.';
    if (err === 'rateLimit') return 'API Rate limit exceeded. Please add a Personal Access Token.';
    return err;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8">
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
            <div className="border-b border-border-default mb-6">
              <nav className="-mb-px flex space-x-6" role="tablist" aria-label="Compare Views">
                <button
                  role="tab"
                  aria-selected={activeTab === 'table'}
                  onClick={() => startTransition(() => setActiveTab('table'))}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'table' 
                      ? 'border-fg-accent text-fg-default' 
                      : 'border-transparent text-fg-muted hover:text-fg-default hover:border-border-muted'
                  }`}
                >
                  Table View
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'charts'}
                  onClick={() => startTransition(() => setActiveTab('charts'))}
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
              <ComparisonTable />
            ) : (
              <Suspense fallback={
                <div className="py-24 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-fg-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-fg-muted">Loading charts...</p>
                </div>
              }>
                <Charts />
              </Suspense>
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
      {previewRepo && (
        <Suspense fallback={null}>
          <ReadmeModal />
        </Suspense>
      )}
    </div>
  );
}

export default App;
