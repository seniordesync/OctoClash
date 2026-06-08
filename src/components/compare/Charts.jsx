import React, { useMemo, memo, useState, useEffect } from 'react';
import { useGitHubApi } from '../../hooks/useGitHubApi';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';
import { formatBytes } from '../../utils/helpers';
import { ContributorsList } from './ContributorsList';
import { StarIcon, RepoForkedIcon, IssueOpenedIcon, CodeIcon } from '@primer/octicons-react';

const COLORS = ['#0969da', '#2da44e', '#cf222e', '#bf3989', '#8250df', '#d4a72c', '#0550ae', '#1a7f37', '#a40e26', '#8c2666'];

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
        datesSet.add(todayStr);
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

  const pieLanguageData = useMemo(() => {
    return languageData.map(item => ({
      name: item.name,
      value: item._total
    }));
  }, [languageData]);

  const aggregateStats = useMemo(() => {
    if (!reposData) return { stars: 0, forks: 0, issues: 0, topLang: 'None' };
    let stars = 0, forks = 0, issues = 0;
    reposData.forEach(r => {
      stars += r.info.stargazers_count || 0;
      forks += r.info.forks_count || 0;
      issues += r.info.open_issues_count || 0;
    });
    const topLang = languageData.length > 0 ? languageData[0].name : 'None';
    return { stars, forks, issues, topLang };
  }, [reposData, languageData]);

  if (!reposData || reposData.length === 0) return null;

  const tooltipStyle = {
    backgroundColor: 'var(--color-canvas-default)',
    borderColor: 'var(--color-border-default)',
    color: 'var(--color-fg-default)',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
  };

  return (
    <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-canvas-default border border-border-default rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-canvas-subtle rounded-lg text-fg-accent">
            <StarIcon size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-fg-muted">Total Stars</p>
            <h4 className="text-2xl font-bold text-fg-default">{aggregateStats.stars.toLocaleString()}</h4>
          </div>
        </div>
        <div className="bg-canvas-default border border-border-default rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-canvas-subtle rounded-lg text-success-fg">
            <RepoForkedIcon size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-fg-muted">Total Forks</p>
            <h4 className="text-2xl font-bold text-fg-default">{aggregateStats.forks.toLocaleString()}</h4>
          </div>
        </div>
        <div className="bg-canvas-default border border-border-default rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-canvas-subtle rounded-lg text-danger-fg">
            <IssueOpenedIcon size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-fg-muted">Open Issues</p>
            <h4 className="text-2xl font-bold text-fg-default">{aggregateStats.issues.toLocaleString()}</h4>
          </div>
        </div>
        <div className="bg-canvas-default border border-border-default rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-canvas-subtle rounded-lg text-done-fg">
            <CodeIcon size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-fg-muted">Top Language</p>
            <h4 className="text-2xl font-bold text-fg-default truncate">{aggregateStats.topLang}</h4>
          </div>
        </div>
      </div>

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
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
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
        <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm">
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

        {/* Language Pie Chart */}
        <div className="bg-canvas-default border border-border-default rounded-xl p-6 shadow-sm">
          <h3 className="text-lg text-fg-default font-semibold mb-6">Overall Technology Stack</h3>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={pieLanguageData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieLanguageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatBytes(value), 'Total Size']}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: 13, paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
                <th className="px-4 py-3 font-semibold">Primary Language</th>
                <th className="px-4 py-3 font-semibold">Commits (1y)</th>
                <th className="px-4 py-3 font-semibold">Stars</th>
                <th className="px-4 py-3 font-semibold">Forks</th>
                <th className="px-4 py-3 font-semibold">Open Issues</th>
              </tr>
            </thead>
            <tbody>
              {reposData.map((repo) => {
                const primaryLang = repo.languages && Object.keys(repo.languages).length > 0 
                  ? Object.keys(repo.languages)[0] 
                  : 'N/A';
                return (
                  <tr key={repo.info.full_name} className="border-b border-border-muted hover:bg-canvas-subtle transition-colors">
                    <td className="px-4 py-3 font-medium text-fg-accent">
                      <a href={repo.info.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                        {repo.info.full_name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-fg-default">{primaryLang}</td>
                    <td className="px-4 py-3 text-fg-default">{repo.commitsLastYear?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3 text-fg-default">{repo.info.stargazers_count?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-fg-default">{repo.info.forks_count?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-fg-default">{repo.info.open_issues_count?.toLocaleString()}</td>
                  </tr>
                );
              })}
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
