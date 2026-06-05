import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#0969da', '#2da44e', '#cf222e', '#bf3989', '#8250df', '#d4a72c', '#1f2328', '#57606a'];

export function Charts({ reposData }) {
  // Process commit activity for the last 12 weeks (approx 3 months)
  const commitData = useMemo(() => {
    if (!reposData || reposData.length === 0) return [];
    
    // We assume commitActivity has 52 weeks. We take the last 12.
    // If some repos are missing activity, we pad with 0s.
    const weeksCount = 12;
    const finalData = [];

    // Find a repo that has data to extract the timestamp for the x-axis
    let referenceActivity = reposData.find(r => r.commitActivity && r.commitActivity.length >= weeksCount)?.commitActivity;
    
    for (let i = 0; i < weeksCount; i++) {
      const point = {};
      const targetIndex = 52 - weeksCount + i; // typically length is 52
      
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

  // Process languages
  const languageData = useMemo(() => {
    if (!reposData || reposData.length === 0) return [];
    const allLangs = new Set();
    reposData.forEach(r => {
      Object.keys(r.languages).forEach(l => allLangs.add(l));
    });

    return Array.from(allLangs).map(lang => {
      const obj = { name: lang };
      reposData.forEach(({ info, languages }) => {
        obj[info.full_name] = languages[lang] || 0;
      });
      return obj;
    }).sort((a, b) => {
      // Sort by total sum descending
      const sumA = reposData.reduce((acc, r) => acc + (a[r.info.full_name] || 0), 0);
      const sumB = reposData.reduce((acc, r) => acc + (b[r.info.full_name] || 0), 0);
      return sumB - sumA;
    }).slice(0, 10); // Top 10 languages
  }, [reposData]);

  if (!reposData || reposData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <div className="bg-canvas-default border border-border-default rounded-md p-4">
        <h3 className="text-fg-default font-semibold mb-4">Commits (Last 3 Months)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={commitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
              <XAxis dataKey="name" stroke="var(--color-fg-muted)" fontSize={12} />
              <YAxis stroke="var(--color-fg-muted)" fontSize={12} />
              <RechartsTooltip 
                cursor={{ fill: 'transparent' }}
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

      <div className="bg-canvas-default border border-border-default rounded-md p-4">
        <h3 className="text-fg-default font-semibold mb-4">Languages (Bytes)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={languageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
              <XAxis dataKey="name" stroke="var(--color-fg-muted)" fontSize={12} />
              <YAxis stroke="var(--color-fg-muted)" fontSize={12} />
              <RechartsTooltip 
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
    </div>
  );
}
