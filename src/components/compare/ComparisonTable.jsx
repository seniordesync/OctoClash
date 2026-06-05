import React from 'react';
import { formatBytes } from '../../utils/helpers';
import { format } from 'date-fns';
import { StarIcon, RepoForkedIcon, EyeIcon, IssueOpenedIcon, LawIcon } from '@primer/octicons-react';

export function ComparisonTable({ reposData }) {
  if (!reposData || reposData.length === 0) return null;

  return (
    <div className="overflow-x-auto border border-border-default rounded-md bg-canvas-default">
      <table className="w-full text-sm text-left">
        <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default">
          <tr>
            <th className="px-4 py-3 font-semibold">Repository</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 font-semibold">Last Commit</th>
            <th className="px-4 py-3 font-semibold"><StarIcon className="mr-1 inline" />Stars</th>
            <th className="px-4 py-3 font-semibold"><RepoForkedIcon className="mr-1 inline" />Forks</th>
            <th className="px-4 py-3 font-semibold"><EyeIcon className="mr-1 inline" />Watchers</th>
            <th className="px-4 py-3 font-semibold"><IssueOpenedIcon className="mr-1 inline" />Issues (Open)</th>
            <th className="px-4 py-3 font-semibold">Size</th>
            <th className="px-4 py-3 font-semibold"><LawIcon className="mr-1 inline" />License</th>
          </tr>
        </thead>
        <tbody>
          {reposData.map(({ info }) => (
            <tr key={info.full_name} className="border-b border-border-muted hover:bg-canvas-subtle transition-colors">
              <td className="px-4 py-3 font-semibold text-fg-accent">
                <a href={info.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                  {info.full_name}
                </a>
              </td>
              <td className="px-4 py-3 text-fg-default">{format(new Date(info.created_at), 'MMM d, yyyy')}</td>
              <td className="px-4 py-3 text-fg-default">{format(new Date(info.updated_at), 'MMM d, yyyy')}</td>
              <td className="px-4 py-3 text-fg-default">{info.stargazers_count.toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default">{info.forks_count.toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default">{info.subscribers_count?.toLocaleString() || info.watchers_count.toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default">{info.open_issues_count.toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default">{formatBytes(info.size * 1024)}</td>
              <td className="px-4 py-3 text-fg-default">{info.license ? info.license.spdx_id : 'None'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
