import React from 'react';
import { Menu } from 'lucide-react';

const MobileTopBar = ({ activeNav, navItems, onOpenMenu }) => {
  const current = navItems.find(n => n.id === activeNav);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] shadow-[0_1px_8px_rgba(0,0,0,0.06)] transition-shadow duration-200 lg:hidden">
      <button
        onClick={onOpenMenu}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] transition-all duration-150 hover:bg-[var(--border)] active:scale-90"
      >
        <Menu size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <div
          key={current?.id}
          className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--text1)] animate-[fadeSlideIn_0.2s_ease]"
        >
          <span className="flex text-[var(--accent)]">{current?.icon}</span>
          {current?.label || 'Settings'}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MobileTopBar;