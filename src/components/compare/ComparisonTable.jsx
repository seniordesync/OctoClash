import React from 'react';
import { formatBytes } from '../../utils/helpers';
import { format } from 'date-fns';
import { StarIcon, RepoForkedIcon, EyeIcon, IssueOpenedIcon, LawIcon, BookIcon, PeopleIcon, RepoIcon, ThreeBarsIcon, GitCommitIcon } from '@primer/octicons-react';
import { ContributorsList } from './ContributorsList';
import { useAppStore } from '../../store/appStore';
import { Tooltip } from '../ui/Tooltip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTableRow({ repoInfo, index, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: repoInfo.full_name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`group border-b border-border-muted hover:bg-canvas-subtle transition-colors ${isDragging ? 'bg-canvas-subtle shadow-md' : ''}`}
    >
      <td className="px-2 py-3 text-center text-fg-muted whitespace-nowrap border-r border-border-muted sticky left-0 bg-canvas-default group-hover:bg-canvas-subtle z-10">
        <div className="flex items-center gap-2 justify-center">
          <button 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:text-fg-default p-1 text-fg-muted"
          >
            <ThreeBarsIcon size={16} />
          </button>
          <span className="text-xs font-semibold">{index + 1}</span>
        </div>
      </td>
      {children}
    </tr>
  );
}

export function ComparisonTable({ reposData }) {
  const setPreviewRepo = useAppStore(state => state.setPreviewRepo);
  const repos = useAppStore(state => state.repos);
  const reorderRepos = useAppStore(state => state.reorderRepos);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      const oldIndex = repos.indexOf(active.id);
      const newIndex = repos.indexOf(over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderRepos(oldIndex, newIndex);
      }
    }
  };

  if (!reposData || reposData.length === 0) return null;

  return (
    <div className="overflow-x-auto border border-border-default rounded-md bg-canvas-default shadow-sm">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full text-sm text-left">
        <thead className="bg-canvas-subtle text-fg-muted border-b border-border-default">
          <tr>
            <th className="px-3 py-3 font-semibold sticky left-0 bg-canvas-subtle z-20 border-r border-border-default w-12 text-center">#</th>
            <th className="px-4 py-3 font-semibold sticky left-12 bg-canvas-subtle z-20 border-r border-border-default">Repository</th>
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
          <SortableContext items={reposData.map(r => r.info.full_name)} strategy={verticalListSortingStrategy}>
            {reposData.map(({ info, contributors, avgIssueTime, commitsLastYear }, index) => (
              <SortableTableRow key={info.full_name} repoInfo={info} index={index}>
                <td className="px-4 py-3 font-semibold text-fg-accent sticky left-12 bg-canvas-default group-hover:bg-canvas-subtle z-10 border-r border-border-muted">
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
                <td className="px-4 py-3 text-fg-default border-r border-border-muted">{format(new Date(info.created_at), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3 text-fg-default border-r border-border-muted">{format(new Date(info.pushed_at || info.updated_at), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3 text-fg-default border-r border-border-muted">{commitsLastYear?.toLocaleString() || '0'}</td>
                <td className="px-4 py-3 text-fg-default border-r border-border-muted">{info.stargazers_count.toLocaleString()}</td>
                <td className="px-4 py-3 text-fg-default border-r border-border-muted">{info.forks_count.toLocaleString()}</td>
                <td className="px-4 py-3 text-fg-default border-r border-border-muted">{info.subscribers_count?.toLocaleString() || info.watchers_count.toLocaleString()}</td>
                <td className="px-4 py-3 text-fg-default border-r border-border-muted">{info.open_issues_count.toLocaleString()}</td>
                <td className="px-4 py-3 text-fg-default border-r border-border-muted">{avgIssueTime || <span className="text-fg-muted">-</span>}</td>
                <td className="px-4 py-3 text-fg-default border-r border-border-muted">{formatBytes(info.size * 1024)}</td>
                <td className="px-4 py-3 text-fg-default">{info.license ? info.license.spdx_id : 'None'}</td>
              </SortableTableRow>
            ))}
          </SortableContext>
        </tbody>
      </table>
      </DndContext>
    </div>
  );
}
