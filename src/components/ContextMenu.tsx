import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
  anchorRect?: DOMRect | null;
  children: React.ReactNode;
  align?: 'left' | 'right';
  offsetY?: number;
}

export default function ContextMenu({ isOpen, onClose, anchorRef, anchorRect, children, align = 'right', offsetY = 8 }: ContextMenuProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      let rect = anchorRect;
      if (!rect && anchorRef?.current) {
        rect = anchorRef.current.getBoundingClientRect();
      }
      
      if (rect) {
        setPosition({
          top: rect.bottom + offsetY,
          left: rect.left,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [isOpen, anchorRef, anchorRect, offsetY]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (anchorRef?.current && anchorRef.current.contains(e.target as Node)) {
          return; // Let the button's onClick handle it
        }
        // If anchorRect is used, the button click will toggle it, but here we just close it
        onClose();
      }
    };

    const handleScroll = () => {
      // Option to close on scroll, or re-calculate
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-surface-container-highest border border-on-surface/20 rounded-lg p-1 min-w-[160px] flex flex-col gap-1 shadow-xl"
      style={{ 
        top: position.top, 
        ...(align === 'right' ? { right: position.right } : { left: position.left })
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
