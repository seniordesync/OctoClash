import React from 'react';
import { formatBytes } from '../../utils/helpers';
import { format } from 'date-fns';
import { StarIcon, RepoForkedIcon, EyeIcon, IssueOpenedIcon, LawIcon, BookIcon, PeopleIcon, RepoIcon, ChevronUpIcon, ChevronDownIcon, GitCommitIcon } from '@primer/octicons-react';
import { ContributorsList } from './ContributorsList';
import { useAppStore } from '../../store/appStore';
import { Tooltip } from '../ui/Tooltip';

export function ComparisonTable({ reposData }) {
  const setPreviewRepo = useAppStore(state => state.setPreviewRepo);
  const reorderRepos = useAppStore(state => state.reorderRepos);

  if (!reposData || reposData.length === 0) return null;

  const moveUp = (index) => {
    if (index > 0) reorderRepos(index, index - 1);
  };

  const moveDown = (index) => {
    if (index < reposData.length - 1) reorderRepos(index, index + 1);
  };

  return (
    <div className="overflow-x-auto border border-border-default rounded-md bg-canvas-default shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default">
          <tr>
            <th className="px-2 py-3 font-semibold sticky left-0 bg-canvas-subtle z-20 border-r border-border-default w-14 text-center">#</th>
            <th className="px-4 py-3 font-semibold sticky left-14 bg-canvas-subtle z-20 border-r border-border-default">Repository</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default"><RepoIcon className="mr-1 inline" />README</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default"><PeopleIcon className="mr-1 inline" />Top Contributors</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default">Created</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default">Last Commit</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default"><GitCommitIcon className="mr-1 inline" />Commits (1y)</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default"><StarIcon className="mr-1 inline" />Stars</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default"><RepoForkedIcon className="mr-1 inline" />Forks</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default"><EyeIcon className="mr-1 inline" />Watchers</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default"><IssueOpenedIcon className="mr-1 inline" />Issues (Open)</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default">Avg Fix Time</th>
            <th className="px-4 py-3 font-semibold border-r border-border-default">Size</th>
            <th className="px-4 py-3 font-semibold"><LawIcon className="mr-1 inline" />License</th>
          </tr>
        </thead>
        <tbody>
          {reposData.map(({ info, contributors, avgIssueTime, commitsLastYear }, index) => (
            <tr key={info.full_name} className="group border-b border-border-muted hover:bg-canvas-subtle transition-colors relative">
              <td className="px-1 py-1 text-center whitespace-nowrap border-r border-border-muted sticky left-0 bg-canvas-default group-hover:bg-canvas-subtle z-10">
                <div className="flex flex-col items-center justify-center">
                  <button 
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={`p-0 rounded ${index === 0 ? 'text-transparent cursor-default' : 'text-fg-muted hover:text-fg-default hover:bg-btn-hover-bg'}`}
                    aria-label="Move up"
                  >
                    <ChevronUpIcon size={16} />
                  </button>
                  <span className="text-xs font-semibold text-fg-muted leading-none my-0.5">{index + 1}</span>
                  <button 
                    onClick={() => moveDown(index)}
                    disabled={index === reposData.length - 1}
                    className={`p-0 rounded ${index === reposData.length - 1 ? 'text-transparent cursor-default' : 'text-fg-muted hover:text-fg-default hover:bg-btn-hover-bg'}`}
                    aria-label="Move down"
                  >
                    <ChevronDownIcon size={16} />
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 font-semibold text-fg-accent sticky left-14 bg-canvas-default group-hover:bg-canvas-subtle z-10 border-r border-border-muted">
                <a href={info.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                  {info.full_name}
                </a>
              </td>
              <td className="px-4 py-3 text-center border-r border-border-muted">
                <Tooltip text="View README">
                  <button 
                    onClick={() => setPreviewRepo(info.full_name)}
                    className="text-fg-muted hover:text-accent-fg p-1 rounded-md transition-colors"
                  >
                    <BookIcon size={16} />
                  </button>
                </Tooltip>
              </td>
              <td className="px-4 py-2 border-r border-border-muted">
                <ContributorsList contributors={contributors} />
              </td>
              <td className="px-4 py-3 text-fg-default border-r border-border-muted">{info.created_at ? format(new Date(info.created_at), 'MMM d, yyyy') : '-'}</td>
              <td className="px-4 py-3 text-fg-default border-r border-border-muted">{(info.pushed_at || info.updated_at) ? format(new Date(info.pushed_at || info.updated_at), 'MMM d, yyyy') : '-'}</td>
              <td className="px-4 py-3 text-fg-default border-r border-border-muted">{commitsLastYear?.toLocaleString() || '0'}</td>
              <td className="px-4 py-3 text-fg-default border-r border-border-muted">{(info.stargazers_count || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default border-r border-border-muted">{(info.forks_count || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default border-r border-border-muted">{(info.subscribers_count || info.watchers_count || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default border-r border-border-muted">{(info.open_issues_count || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-fg-default border-r border-border-muted">{avgIssueTime || <span className="text-fg-muted">-</span>}</td>
              <td className="px-4 py-3 text-fg-default border-r border-border-muted">{formatBytes(info.size * 1024)}</td>
              <td className="px-4 py-3 text-fg-default">{info.license ? info.license.spdx_id : 'None'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
