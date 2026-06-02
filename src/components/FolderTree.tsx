import React, { useState } from 'react';
import { type Folder } from '../context/NoteContext';
import type { SidebarFilter } from '../pages/Notes';

interface FolderTreeProps {
  folders: Folder[];
  parentId: string | null;
  activeFilter: SidebarFilter;
  onSelect: (folderId: string) => void;
  onEdit: (folderId: string) => void;
  depth?: number;
  getNoteCount: (folderId: string) => number;
}

export default function FolderTree({ folders, parentId, activeFilter, onSelect, onEdit, depth = 0, getNoteCount }: FolderTreeProps) {
  const children = folders.filter(f => (f.parent_id || null) === parentId);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (children.length === 0) return null;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col w-full">
      {children.map(f => {
        const hasChildren = folders.some(child => child.parent_id === f.id);
        const isExpanded = expanded[f.id];
        const isActive = typeof activeFilter === 'object' && activeFilter.type === 'folder' && activeFilter.id === f.id;
        const count = getNoteCount(f.id);
        
        return (
          <div key={f.id} className="w-full flex flex-col">
            <div 
              className={`group flex items-center note-sidebar-item ${isActive ? 'active' : ''}`}
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
              onClick={() => onSelect(f.id)}
            >
              {hasChildren ? (
                <button 
                  onClick={(e) => toggleExpand(f.id, e)}
                  className="material-symbols-outlined text-[16px] mr-1 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                  aria-label={isExpanded ? `Collapse ${f.name}` : `Expand ${f.name}`}
                >
                  {isExpanded ? 'expand_more' : 'chevron_right'}
                </button>
              ) : (
                <div className="w-[16px] mr-1" /> // Spacer for alignment
              )}
              <span className="material-symbols-outlined text-[16px] mr-2 text-on-surface-variant/70">{f.icon}</span>
              <span className="flex-grow truncate text-[13px]">{f.name}</span>
              <span className="font-data-display text-[10px] opacity-50 mr-2">{count}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(f.id); }}
                className="material-symbols-outlined text-[14px] text-on-surface-variant/20 hover:text-primary-fixed-dim transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                title="Edit folder"
                aria-label={`Edit ${f.name}`}
              >
                edit
              </button>
            </div>
            {hasChildren && isExpanded && (
              <FolderTree
                folders={folders}
                parentId={f.id}
                activeFilter={activeFilter}
                onSelect={onSelect}
                onEdit={onEdit}
                depth={depth + 1}
                getNoteCount={getNoteCount}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
