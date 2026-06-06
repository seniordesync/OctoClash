import React, { useMemo, memo, useState, useEffect } from 'react';
import { useGitHubApi } from '../../hooks/useGitHubApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { ContributorsList } from './ContributorsList';

const COLORS = ['#0969da', '#2da44e', '#cf222e', '#bf3989', '#8250df', '#d4a72c', '#1f2328', '#57606a'];

export const Charts = memo(function Charts({ reposData }) {
  const { fetchStarHistory } = useGitHubApi();
  const [starData, setStarData] = useState([]);
  const [loadingStars, setLoadingStars] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStars = async () => {
      if (!reposData || reposData.length === 0) return;
      setLoadingStars(true);
      
      const allHistories = await Promise.all(
        reposData.map(repo => fetchStarHistory(repo.info.full_name, repo.info.stargazers_count))
      );
      
      if (!isMounted) return;

      const combined = [];
      const datesSet = new Set();
      const todayStr = new Date().toISOString().split('T')[0];
      
      allHistories.forEach((history) => {
        datesSet.add(todayStr); // Always ensure today is in the set
        history.forEach(point => {
           if (point.date) datesSet.add(point.date.split('T')[0]);
        });
      });

      const sortedDates = Array.from(datesSet).sort();
      
      sortedDates.forEach(dateStr => {
         const row = { name: format(new Date(dateStr), 'MMM yyyy'), _rawDate: dateStr };
         allHistories.forEach((history, idx) => {
            const repoInfo = reposData[idx].info;
            let starsAtDate = 0;
            
            for (let point of history) {
              if (!point.date) continue;
              const pointDate = point.date.split('T')[0];
              if (pointDate <= dateStr) {
                starsAtDate = Math.max(starsAtDate, point.stars);
              }
            }
            
            if (dateStr === todayStr) {
               starsAtDate = Math.max(starsAtDate, repoInfo.stargazers_count);
            }
            
            row[repoInfo.full_name] = starsAtDate;
         });
         combined.push(row);
      });
      
      // Deduplicate by name (month year) so x-axis is clean, take highest values for that month
      const deduped = [];
      const seenNames = new Set();
      for (let i = combined.length - 1; i >= 0; i--) {
        if (!seenNames.has(combined[i].name)) {
          seenNames.add(combined[i].name);
          deduped.unshift(combined[i]);
        }
      }

      setStarData(deduped);
      setLoadingStars(false);
    };

    loadStars();
    return () => { isMounted = false; };
  }, [reposData, fetchStarHistory]);

  const commitData = useMemo(() => {
    if (!reposData || reposData.length === 0) return [];
    const weeksCount = 12;
    const finalData = [];
    let referenceActivity = reposData.find(r => r.commitActivity && r.commitActivity.length >= weeksCount)?.commitActivity;
    
    for (let i = 0; i < weeksCount; i++) {
      const point = {};
      const targetIndex = 52 - weeksCount + i; 
      let weekTimestamp = Date.now() / 1000;
      if (referenceActivity && referenceActivity[targetIndex]) {
        weekTimestamp = referenceActivity[targetIndex].week;
      }
      point.name = format(new Date(weekTimestamp * 1000), 'MMM d');

      reposData.forEach(({ info, commitActivity }) => {
        if (commitActivity && commitActivity[targetIndex]) {
          point[info.full_name] = commitActivity[targetIndex].total;
        } else {
          point[info.full_name] = 0;
        }
      });
      finalData.push(point);
    }
    return finalData;
  }, [reposData]);

  const languageData = useMemo(() => {
    if (!reposData || reposData.length === 0) return [];
    const allLangs = new Set();
    reposData.forEach(r => {
      Object.keys(r.languages).forEach(l => allLangs.add(l));
    });

    return Array.from(allLangs).map(lang => {
      const obj = { name: lang, _total: 0 };
      reposData.forEach(({ info, languages }) => {
        const bytes = languages[lang] || 0;
        obj[info.full_name] = bytes;
        obj._total += bytes;
      });
      return obj;
    }).sort((a, b) => b._total - a._total).slice(0, 10);
  }, [reposData]);

  if (!reposData || reposData.length === 0) return null;

  return (
    <div className="mt-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-canvas-default border border-border-default rounded-md p-4 shadow-sm">
          <h3 className="text-fg-default font-semibold mb-4">Commits (Last 3 Months)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
                <XAxis dataKey="name" stroke="var(--color-fg-muted)" fontSize={12} />
                <YAxis stroke="var(--color-fg-muted)" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--color-canvas-default)', borderColor: 'var(--color-border-default)', color: 'var(--color-fg-default)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-fg-default)' }} />
                {reposData.map((repo, idx) => (
                  <Line 
                    key={repo.info.full_name} 
                    type="monotone" 
                    dataKey={repo.info.full_name} 
                    stroke={COLORS[idx % COLORS.length]} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-canvas-default border border-border-default rounded-md p-4 shadow-sm">
          <h3 className="text-fg-default font-semibold mb-4">Languages (Bytes)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
                <XAxis dataKey="name" stroke="var(--color-fg-muted)" fontSize={12} />
                <YAxis stroke="var(--color-fg-muted)" fontSize={12} />
                <RechartsTooltip 
                  cursor={false}
                  contentStyle={{ backgroundColor: 'var(--color-canvas-default)', borderColor: 'var(--color-border-default)', color: 'var(--color-fg-default)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-fg-default)' }} />
                {reposData.map((repo, idx) => (
                  <Bar 
                    key={repo.info.full_name} 
                    dataKey={repo.info.full_name} 
                    fill={COLORS[idx % COLORS.length]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Star History Chart */}
        <div className="bg-canvas-default border border-border-default rounded-md p-4 shadow-sm lg:col-span-2">
          <h3 className="text-fg-default font-semibold mb-4 flex items-center gap-2">
            Star History (Sampled)
            {loadingStars && <span className="text-xs text-fg-muted font-normal animate-pulse">Loading...</span>}
          </h3>
          <div className="h-96">
            {starData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={starData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
                  <XAxis dataKey="name" stroke="var(--color-fg-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-fg-muted)" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--color-canvas-default)', borderColor: 'var(--color-border-default)', color: 'var(--color-fg-default)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-fg-default)' }} />
                  {reposData.map((repo, idx) => (
                    <Line 
                      key={repo.info.full_name} 
                      type="monotone" 
                      dataKey={repo.info.full_name} 
                      stroke={COLORS[idx % COLORS.length]} 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-fg-muted text-sm">
                {loadingStars ? 'Fetching historical stars...' : 'Not enough data to display star history.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-canvas-default border border-border-default rounded-md p-4 shadow-sm">
        <h3 className="text-fg-default font-semibold mb-4">Top Contributors by Repository</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reposData.map((repo) => (
            <div key={repo.info.full_name} className="flex flex-col gap-3 p-4 border border-border-muted rounded-md bg-canvas-subtle hover:bg-canvas-default transition-colors">
              <a href={repo.info.html_url} target="_blank" rel="noreferrer" className="text-fg-accent font-semibold hover:underline text-sm truncate">
                {repo.info.full_name}
              </a>
              <ContributorsList contributors={repo.contributors} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
