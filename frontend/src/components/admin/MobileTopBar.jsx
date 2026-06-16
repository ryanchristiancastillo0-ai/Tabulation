 import React, { useState, useEffect, useRef } from 'react';
import {

  Menu
} from 'lucide-react';

 const MobileTopBar = ({ activeNav, navItems, onOpenMenu }) => {
  const current = navItems.find(n => n.id === activeNav);
  return (
    <div
      className="lg:hidden"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}
    >
      <button
        onClick={onOpenMenu}
        style={{
          width: 36, height: 36, borderRadius: 9,
          border: '1px solid var(--border)',
          background: 'var(--surface2)',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--text2)', flexShrink: 0,
        }}
      >
        <Menu size={18} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--accent)', display: 'flex' }}>{current?.icon}</span>
          {current?.label || 'Settings'}
        </div>
      </div>
    </div>
  );
};
export default MobileTopBar