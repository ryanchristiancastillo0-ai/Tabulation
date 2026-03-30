import { LayoutGrid, Trophy, Sparkles, Scale, Users, UserPlus, Moon, Sun, LogOut } from 'lucide-react';

export default function Sidebar({ activeNav, setActiveNav, dark, setDark }) {
  const navItems = [
    { id: 'overview', icon: LayoutGrid, label: 'Overview' },
    { id: 'contest', icon: Trophy, label: 'Contest Info' },
    { id: 'ai', icon: Sparkles, label: 'AI Prompt' },
    { id: 'criteria', icon: Scale, label: 'Criteria' },
    { id: 'judges', icon: Users, label: 'Judges' },
    { id: 'contestants', icon: UserPlus, label: 'Contestants' },
  ];


    const handleLogout = () => {
  localStorage.removeItem('adminToken'); // The Guard in App.jsx checks for THIS
  window.location.href = '/login';       // Force a refresh to clear the "Bouncer"
}

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">C</div>
          <div>
            <h2 className="text-sm font-bold dark:text-white">CompPortal</h2>
            <p className="text-[10px] text-slate-400 font-mono">ADMIN v1.2</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeNav === item.id 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <item.icon size={18} strokeWidth={activeNav === item.id ? 2.5 : 2} />
            {item.label}
          </button>
        ))}
      </nav>

     {/* Logout Button Section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={handleLogout}
          className="group w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:border-red-100 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:border-red-900/20 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Sign Out</span>
          </div>
        </button>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => setDark(!dark)}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium dark:text-slate-300"
        >
          <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>
          {dark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </aside>
  );
}