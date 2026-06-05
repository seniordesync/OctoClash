import React from 'react';
import { formatBytes } from '../../utils/helpers';
import { format } from 'date-fns';
import { StarIcon, RepoForkedIcon, EyeIcon, IssueOpenedIcon, LawIcon, BookIcon, PeopleIcon } from '@primer/octicons-react';
import { ContributorsList } from './ContributorsList';
import { useAppStore } from '../../store/appStore';
import { Tooltip } from '../ui/Tooltip';

export function ComparisonTable({ reposData }) {
  const setPreviewRepo = useAppStore(state => state.setPreviewRepo);

  if (!reposData || reposData.length === 0) return null;

  return (
    <div className="overflow-x-auto border border-border-default rounded-md bg-canvas-default shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default">
          <tr>
            <th className="px-4 py-3 font-semibold sticky left-0 bg-canvas-subtle z-10 border-r border-border-default">Repository</th>
            <th className="px-4 py-3 font-semibold"><BookIcon className="mr-1 inline" />README</th>
            <th className="px-4 py-3 font-semibold"><PeopleIcon className="mr-1 inline" />Top Contributors</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 font-semibold">Last Commit</th>
            <th className="px-4 py-3 font-semibold"><StarIcon className="mr-1 inline" />Stars</th>
            <th className="px-4 py-3 font-semibold"><RepoForkedIcon className="mr-1 inline" />Forks</th>
            <th className="px-4 py-3 font-semibold"><EyeIcon className="mr-1 inline" />Watchers</th>
            <th className="px-4 py-3 font-semibold"><IssueOpenedIcon className="mr-1 inline" />Issues (Open)</th>
            <th className="px-4 py-3 font-semibold">Avg Fix Time</th>
            <th className="px-4 py-3 font-semibold">Size</th>
            <th className="px-4 py-3 font-semibold"><LawIcon className="mr-1 inline" />License</th>
          </tr>
        </thead>
        <tbody>
          {reposData.map(({ info, contributors, avgIssueTime }) => (
            <tr key={info.full_name} className="border-b border-border-muted hover:bg-canvas-subtle transition-colors">
              <td className="px-4 py-3 font-semibold text-fg-accent sticky left-0 bg-canvas-default group-hover:bg-canvas-subtle z-10 border-r border-border-muted">
                <a href={info.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                  {info.full_name}
                </a>
              </td>
              <td className="px-4 py-3 text-center">
                <Tooltip content="View README">
                  <button 
                    onClick={() => setPreviewRepo(info.full_name)}
                    className="text-fg-muted hover:text-accent-fg p-1 rounded-md transition-colors"
                  >
                    <BookIcon size={16} />
                  </button>
                </Tooltip>
              </td>
              <td className="px-4 py-2">
                <ContributorsList contributors={contributors} />
              </td>
              <td className="px-4 py-3 text-fg-default">{format(new Date(info.created_at), 'MMM d, yyyy')}</td>
              <td className="px-4 py-3 text-fg-default">{format(new Date(info.updated_at), 'MMM d, yyyy')}</td>
              <td className="px-4 py-3 text-fg-default">{info.stargazers_count.toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default">{info.forks_count.toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default">{info.subscribers_count?.toLocaleString() || info.watchers_count.toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default">{info.open_issues_count.toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default">{avgIssueTime || <span className="text-fg-muted">-</span>}</td>
              <td className="px-4 py-3 text-fg-default">{formatBytes(info.size * 1024)}</td>
              <td className="px-4 py-3 text-fg-default">{info.license ? info.license.spdx_id : 'None'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
