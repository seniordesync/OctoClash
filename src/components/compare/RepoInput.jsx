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
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableRepoTag({ repo, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: repo });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
      setSelectedIndex(-1);
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
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      return;
    }
    
    if (!showDropdown || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        e.preventDefault();
        handleAdd(null, searchResults[selectedIndex].full_name);
      }
    }
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
            onKeyDown={handleKeyDown}
            placeholder="owner/repo (e.g., facebook/react)"
            className="pl-9 pr-9 w-full"
          />
          
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-border-default border-t-fg-accent rounded-full" />
            </div>
          )}
          
          {/* Autocomplete Dropdown */}
          {showDropdown && (inputValue.length >= 3 && !inputValue.includes('/')) && (
            <div className="absolute z-50 w-full mt-1 bg-canvas-default border border-border-default rounded-md shadow-lg overflow-hidden">
              {searchResults.length > 0 ? (
                <ul className="max-h-64 overflow-y-auto">
                  {searchResults.map((repo, index) => (
                    <li 
                      key={repo.id}
                      onClick={() => handleAdd(null, repo.full_name)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`px-3 py-2 hover:bg-canvas-subtle cursor-pointer border-b border-border-muted last:border-0 ${index === selectedIndex ? 'bg-canvas-subtle' : ''}`}
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
        <Tooltip text="Enter repository name in 'owner/repo' format to compare their statistics, commit activity, and languages." />
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
          <Tooltip text="Experimental feature: Bypass the default 10 repos limit. No guarantees on stability, performance, or correct visual rendering." />
        </label>
        {infiniteMode && (
          <div className="flex items-center gap-2 text-xs text-fg-danger bg-canvas-subtle p-2 rounded border border-border-default inline-block max-w-max">
            <ShieldLockIcon size={14} />
            Warning: Comparing an unlimited number of repositories is an experimental feature. It may break UI layouts and will quickly exhaust GitHub API limits without a token.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={repos} strategy={rectSortingStrategy}>
            {repos.map(repo => (
              <SortableRepoTag key={repo} repo={repo} onRemove={removeRepo} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
});
