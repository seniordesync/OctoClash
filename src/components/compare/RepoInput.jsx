import React, { useState, useEffect, useRef, memo } from 'react';
import { useAppStore } from '../../store/appStore';
import { useGitHubApi } from '../../hooks/useGitHubApi';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { RepoIcon, XIcon, ShieldLockIcon, StarIcon } from '@primer/octicons-react';
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
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableRepoTag({ repo, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: repo });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes} 
      {...listeners}
      className="flex items-center gap-2 px-3 py-1 bg-btn-bg border border-btn-border rounded-full text-sm text-fg-default cursor-grab active:cursor-grabbing hover:bg-canvas-subtle"
    >
      <RepoIcon size={14} className="text-fg-muted" />
      <span className="font-semibold">{repo}</span>
      <button 
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking remove
        onClick={() => onRemove(repo)}
        className="text-fg-muted hover:text-fg-danger transition-colors cursor-pointer"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}

export const RepoInput = memo(function RepoInput({ onFetchRepo }) {
  const repos = useAppStore(state => state.repos);
  const removeRepo = useAppStore(state => state.removeRepo);
  const reorderRepos = useAppStore(state => state.reorderRepos);
  const infiniteMode = useAppStore(state => state.infiniteMode);
  const setInfiniteMode = useAppStore(state => state.setInfiniteMode);
  const { searchRepos } = useGitHubApi();
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      const oldIndex = repos.indexOf(active.id);
      const newIndex = repos.indexOf(over.id);
      reorderRepos(oldIndex, newIndex);
    }
  };
  
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const val = inputValue.trim();
    if (val.length < 3 || val.includes('/')) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      const results = await searchRepos(val);
      setSearchResults(results);
      setShowDropdown(true);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputValue, searchRepos]);

  const handleAdd = (e, overrideVal = null) => {
    if (e) e.preventDefault();
    const val = (overrideVal || inputValue).trim();
    if (!val || !val.includes('/')) return;
    
    if (!infiniteMode && repos.length >= 10) {
      alert("Max 10 repos. Enable infinite mode to add more.");
      return;
    }

    onFetchRepo(val);
    setInputValue('');
    setShowDropdown(false);
  };

  return (
    <div className="mb-8">
      <form onSubmit={handleAdd} className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md" ref={dropdownRef}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">
            <RepoIcon />
          </span>
          <Input 
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            placeholder="owner/repo (e.g., facebook/react)"
            className="pl-9 w-full"
          />
          
          {/* Autocomplete Dropdown */}
          {showDropdown && (inputValue.length >= 3 && !inputValue.includes('/')) && (
            <div className="absolute z-50 w-full mt-1 bg-canvas-default border border-border-default rounded-md shadow-lg overflow-hidden">
              {isSearching && searchResults.length === 0 ? (
                <div className="p-3 text-sm text-fg-muted text-center">Searching...</div>
              ) : searchResults.length > 0 ? (
                <ul className="max-h-64 overflow-y-auto">
                  {searchResults.map(repo => (
                    <li 
                      key={repo.id}
                      onClick={() => handleAdd(null, repo.full_name)}
                      className="px-3 py-2 hover:bg-canvas-subtle cursor-pointer border-b border-border-muted last:border-0"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-fg-default truncate">{repo.full_name}</span>
                        <span className="flex items-center gap-1 text-xs text-fg-muted whitespace-nowrap">
                          {repo.stargazers_count.toLocaleString()} <StarIcon size={12} />
                        </span>
                      </div>
                      {repo.description && (
                        <p className="text-xs text-fg-muted truncate mt-0.5">{repo.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                !isSearching && <div className="p-3 text-sm text-fg-muted text-center">No results found</div>
              )}
            </div>
          )}
        </div>
        <Button type="submit" variant="primary">
          Add
        </Button>
        <Tooltip text="Enter repository name in 'owner/repo' format. Max 10 by default." />
      </form>

      {/* Infinite Mode Toggle */}
      <div className="flex flex-col gap-2 mb-6">
        <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
          <input 
            type="checkbox" 
            checked={infiniteMode}
            onChange={(e) => setInfiniteMode(e.target.checked)}
            className="rounded border-border-default bg-canvas-default text-fg-accent focus:ring-fg-accent"
          />
          Enable infinite comparison
          <Tooltip text="Bypass the 10 repos limit." />
        </label>
        {infiniteMode && (
          <div className="flex items-center gap-2 text-xs text-fg-danger bg-canvas-subtle p-2 rounded border border-border-default inline-block max-w-max">
            <ShieldLockIcon size={14} />
            Warning: Comparing more than 10 repos can quickly exhaust GitHub API limits. Use a Personal Access Token.
          </div>
        )}
      </div>

      {/* Tag List */}
      <div className="flex flex-wrap gap-2">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={repos} strategy={horizontalListSortingStrategy}>
            {repos.map(repo => (
              <SortableRepoTag key={repo} repo={repo} onRemove={removeRepo} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
});
