import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { MobileTopBar } from '../components/layout/MobileTopBar';
import { MobileNavDrawer } from '../pages/admin/sections/sectionRender';
import { navItems } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import { usePresence } from '../hooks/usePresence';


export default function AdminLayout({
  activeNav = '',
  setActiveNav,
  drawerActiveNav,
  activeSettings = false,
  wide = false,
  children,
}) {
  usePresence('admin');
  const { dark, setDark } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* ── Sidebar: only render on desktop ─────────────────────────── */}
      {!isMobile && (
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          dark={dark}
          setDark={setDark}
        />
      )}

      {/* ── Mobile slide-in drawer: only render on mobile ───────────── */}
      {isMobile && (
        <MobileNavDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activeNav={drawerActiveNav ?? activeNav}
          setActiveNav={setActiveNav}
          navItems={navItems}
          dark={dark}
          setDark={setDark}
          activeSettings={activeSettings}
        />
      )}

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {isMobile && (
          <MobileTopBar
            activeNav={activeNav}
            navItems={navItems}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        )}

        <div
          className={`flex-1 w-full min-w-0 max-w-[1920px] mx-auto ${
            wide ? '3xl:max-w-[2560px] 4xl:max-w-[3200px]' : ''
          } ${
            isMobile ? 'px-4 pt-[72px] pb-[88px]' : 'px-6 lg:px-8 2xl:px-10 py-9'
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}