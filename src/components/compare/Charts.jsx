import React, { useMemo, memo, useState, useEffect } from 'react';
import { useGitHubApi } from '../../hooks/useGitHubApi';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { ContributorsList } from './ContributorsList';
import { StarIcon, RepoForkedIcon, PulseIcon, FlameIcon } from '@primer/octicons-react';

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

const LeaderboardCard = memo(({ title, icon: Icon, data, colorVariant, titleClass, valueSuffix = '' }) => {
  if (!data || data.length === 0) return null;
  const maxVal = data[0].value || 1;
  return (
    <div className="bg-canvas-default border border-border-default rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-[0.03] transition-opacity">
        <Icon size={80} />
      </div>
      <div className="flex items-center gap-2 text-fg-muted text-sm font-semibold uppercase tracking-wide">
        <Icon size={16} className={titleClass} /> {title}
      </div>
      <div className="flex flex-col gap-3 mt-1 z-10">
        {data.map((item, idx) => {
          const pct = ((item.value || 0) / maxVal) * 100;
          return (
            <div key={item.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-fg-default truncate pr-2" title={item.name}>
                  {idx + 1}. {item.name}
                </span>
                <span className="text-fg-muted font-mono text-xs whitespace-nowrap">
                  {(item.value || 0).toLocaleString()}{valueSuffix}
                </span>
              </div>
              <div className="w-full h-1.5 bg-canvas-subtle rounded-full overflow-hidden">
                <div className={`h-full ${colorVariant} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// GitHub default language colors
const GITHUB_LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

const COLORS = ['#0969da', '#2da44e', '#cf222e', '#bf3989', '#8250df', '#d4a72c', '#0550ae', '#1a7f37', '#a40e26', '#8c2666'];

import { useAppStore } from '../../store/appStore';

export const Charts = memo(function Charts() {
  const reposData = useAppStore(state => state.reposData);
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
        datesSet.add(todayStr);
        history.forEach(point => {
           if (point.date) datesSet.add(point.date.split('T')[0]);
        });
      });

      const sortedDates = Array.from(datesSet).sort();
      
      sortedDates.forEach(dateStr => {
         const row = { name: dateFormatter.format(new Date(dateStr)), _rawDate: dateStr };
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
      point.name = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(weekTimestamp * 1000));

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
      Object.keys(r.languages || {}).forEach(l => allLangs.add(l));
    });

    return Array.from(allLangs).map(lang => {
      const obj = { name: lang, _total: 0 };
      reposData.forEach(({ info, languages }) => {
        const bytes = (languages && languages[lang]) || 0;
        obj[info.full_name] = bytes;
        obj._total += bytes;
      });
      return obj;
    }).sort((a, b) => b._total - a._total).slice(0, 10);
  }, [reposData]);

  const globalLangColors = useMemo(() => {
    const map = {};
    let colorIdx = 0;
    languageData.forEach(l => {
      map[l.name] = GITHUB_LANG_COLORS[l.name] || COLORS[colorIdx % COLORS.length];
      if (!GITHUB_LANG_COLORS[l.name]) colorIdx++;
    });
    return map;
  }, [languageData]);

  const pieLanguageData = useMemo(() => {
    return languageData.map(item => ({
      name: item.name,
      value: item._total,
      color: globalLangColors[item.name]
    }));
  }, [languageData, globalLangColors]);

  const detailedLanguages = useMemo(() => {
    if (!reposData) return [];
    return reposData.map(repo => {
      const langs = Object.entries(repo.languages || {});
      const totalBytes = langs.reduce((acc, [_, bytes]) => acc + bytes, 0);
      
      const sortedLangs = langs.sort((a, b) => b[1] - a[1]).map(([name, bytes]) => ({
        name,
        bytes,
        percent: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
        color: globalLangColors[name] || '#57606a'
      }));

      const topLangs = sortedLangs.slice(0, 4);
      const otherLangs = sortedLangs.slice(4);
      if (otherLangs.length > 0) {
        const otherBytes = otherLangs.reduce((acc, l) => acc + l.bytes, 0);
        topLangs.push({
          name: 'Other',
          bytes: otherBytes,
          percent: totalBytes > 0 ? (otherBytes / totalBytes) * 100 : 0,
          color: '#57606a'
        });
      }

      return {
        repo: repo.info.full_name,
        html_url: repo.info.html_url,
        totalBytes,
        langs: topLangs
      };
    });
  }, [reposData, globalLangColors]);

  const leaderboards = useMemo(() => {
    if (!reposData || reposData.length === 0) return null;
    
    // Top 3 for Stars
    const byStars = [...reposData]
      .sort((a, b) => (b.info.stargazers_count || 0) - (a.info.stargazers_count || 0))
      .slice(0, 3);
      
    // Top 3 for Commits
    const byCommits = [...reposData]
      .sort((a, b) => (b.commitsLastYear || 0) - (a.commitsLastYear || 0))
      .slice(0, 3);
      
    // Top 3 for Forks (Community)
    const byForks = [...reposData]
      .sort((a, b) => (b.info.forks_count || 0) - (a.info.forks_count || 0))
      .slice(0, 3);
      
    // Top 3 for Update Frequency (Commits per week)
    const byFrequency = [...reposData].map(r => ({
      repo: r,
      commitsPerWeek: Math.round((r.commitsLastYear || 0) / 52)
    })).sort((a, b) => b.commitsPerWeek - a.commitsPerWeek).slice(0, 3);

    return { byStars, byCommits, byForks, byFrequency };
  }, [reposData]);

  if (!reposData || reposData.length === 0) return null;

  const tooltipStyle = {
    backgroundColor: 'var(--color-canvas-default)',
    borderColor: 'var(--color-border-default)',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
  };

  return (
    <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Mini-Leaderboards Cards */}
      {leaderboards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <LeaderboardCard 
            title="Popularity (Stars)"
            icon={StarIcon}
            titleClass="text-fg-warning"
            colorVariant="bg-fg-warning"
            data={leaderboards.byStars.map(r => ({ name: r.info.name, value: r.info.stargazers_count }))}
          />
          <LeaderboardCard 
            title="Total Activity (1y)"
            icon={FlameIcon}
            titleClass="text-fg-danger"
            colorVariant="bg-fg-danger"
            data={leaderboards.byCommits.map(r => ({ name: r.info.name, value: r.commitsLastYear }))}
          />
          <LeaderboardCard 
            title="Community (Forks)"
            icon={RepoForkedIcon}
            titleClass="text-fg-success"
            colorVariant="bg-fg-success"
            data={leaderboards.byForks.map(r => ({ name: r.info.name, value: r.info.forks_count }))}
          />
          <LeaderboardCard 
            title="Update Frequency"
            icon={PulseIcon}
            titleClass="text-fg-done"
            colorVariant="bg-fg-done"
            valueSuffix=" / wk"
            data={leaderboards.byFrequency.map(r => ({ name: r.repo.info.name, value: r.commitsPerWeek }))}
          />

        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Star History Line Chart */}
        <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg text-fg-default font-semibold mb-6 flex items-center gap-2">
            Star Growth History
            {loadingStars && <span className="text-xs px-2 py-1 bg-canvas-subtle rounded-full text-fg-muted font-normal animate-pulse">Syncing...</span>}
          </h3>
          <div className="h-[400px]">
            {starData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={starData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-fg-muted)" fontSize={12} dy={10} tickLine={false} axisLine={{ stroke: 'var(--color-border-muted)' }} />
                  <YAxis stroke="var(--color-fg-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 13, color: 'var(--color-fg-default)', paddingTop: '20px' }} />
                  {reposData.map((repo, idx) => (
                    <Line 
                      key={repo.info.full_name} 
                      type="monotone" 
                      dataKey={repo.info.full_name} 
                      stroke={COLORS[idx % COLORS.length]} 
                      strokeWidth={3}
                      strokeOpacity={0.85}
                      dot={false}
                      activeDot={{ r: 8 - (idx % 4), strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-fg-muted text-sm gap-3">
                {loadingStars ? (
                  <>
                    <div className="w-8 h-8 border-4 border-border-default border-t-fg-accent rounded-full animate-spin"></div>
                    <p>Fetching historical stars...</p>
                  </>
                ) : 'Not enough data to display star history.'}
              </div>
            )}
          </div>
        </div>

        {/* Commits Area Chart */}
        <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg text-fg-default font-semibold mb-6">Commit Activity (Last 12 Weeks)</h3>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={commitData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  {reposData.map((repo, idx) => (
                    <linearGradient key={`color-${idx}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-fg-muted)" fontSize={12} dy={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-fg-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 13, color: 'var(--color-fg-default)', paddingTop: '20px' }} />
                {reposData.map((repo, idx) => (
                  <Area 
                    key={repo.info.full_name} 
                    type="monotone" 
                    dataKey={repo.info.full_name} 
                    stroke={COLORS[idx % COLORS.length]} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill={`url(#color-${idx})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Language Breakdown Table */}
      <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
        <h3 className="text-lg text-fg-default font-semibold mb-6">Language Breakdown by Repository</h3>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default">
              <tr>
                <th className="px-4 py-3 font-semibold w-1/4">Repository</th>
                <th className="px-4 py-3 font-semibold w-3/4">Languages</th>
              </tr>
            </thead>
            <tbody>
              {detailedLanguages.map((details) => (
                <tr key={details.repo} className="border-b border-border-muted hover:bg-canvas-subtle transition-colors">
                  <td className="px-4 py-4 font-medium text-fg-accent align-top">
                    <a href={details.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                      {details.repo}
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    {details.langs.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-canvas-subtle">
                          {details.langs.map((lang) => (
                            <div 
                              key={lang.name}
                              style={{ width: `${lang.percent}%`, backgroundColor: lang.color }}
                              className="h-full"
                              title={`${lang.name}: ${lang.percent.toFixed(1)}%`}
                            />
                          ))}
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {details.langs.map((lang) => (
                            <div key={lang.name} className="flex items-center gap-1.5 text-xs text-fg-default">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }}></span>
                              <span className="font-semibold">{lang.name}</span>
                              <span className="text-fg-muted">{lang.percent.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-fg-muted italic">No languages detected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Data Table */}
      <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
        <h3 className="text-lg text-fg-default font-semibold mb-6">Data Summary</h3>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default">
              <tr>
                <th className="px-4 py-3 font-semibold">Repository</th>
                <th className="px-4 py-3 font-semibold">Commits (1y)</th>
                <th className="px-4 py-3 font-semibold">Stars</th>
                <th className="px-4 py-3 font-semibold">Forks</th>
                <th className="px-4 py-3 font-semibold">Open Issues</th>
              </tr>
            </thead>
            <tbody>
              {reposData.map((repo) => (
                <tr key={repo.info.full_name} className="border-b border-border-muted hover:bg-canvas-subtle transition-colors">
                  <td className="px-4 py-3 font-medium text-fg-accent">
                    <a href={repo.info.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                      {repo.info.full_name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-fg-default">{repo.commitsLastYear?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-fg-default">{(repo.info.stargazers_count || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-fg-default">{(repo.info.forks_count || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-fg-default">{(repo.info.open_issues_count || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Contributors Grid */}
      <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm">
        <h3 className="text-lg text-fg-default font-semibold mb-6">Top Contributors by Repository</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reposData.map((repo) => (
            <div key={repo.info.full_name} className="flex flex-col gap-3 p-4 border border-border-muted rounded-xl bg-canvas-subtle hover:bg-canvas-default hover:shadow-md transition-all">
              <a href={repo.info.html_url} target="_blank" rel="noreferrer" className="block text-fg-accent font-semibold hover:underline text-sm truncate">
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
