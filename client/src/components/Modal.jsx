import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-3xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full ${maxWidth} bg-soc-900 border border-soc-700 rounded-lg shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-soc-750 bg-soc-950">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyber-blue" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-soc-800 transition text-xs font-mono"
            title="Press Esc to close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[82vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
