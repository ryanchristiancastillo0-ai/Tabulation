import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './admin/LoginForm';

const Home = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('portal');

  const handleLogin = (data) => {
    if (data.role === 'admin') navigate('/admin');
    else navigate('/judge-entry');
  };

  return (
    <div className="relative min-h-screen bg-[#f5f6fa] font-sans flex items-center justify-center p-6 overflow-hidden">
      {/* Background Pattern & Gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-55 [mask-image:radial-gradient(ellipse_85%_85%_at_50%_50%,black_0%,transparent_100%)]" 
           style={{ backgroundImage: 'radial-gradient(circle, #d1d5e0 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute inset-0 pointer-events-none opacity-20"
           style={{ background: 'radial-gradient(ellipse 55% 40% at 20% 10%, rgba(79,70,229,0.3) 0%, transparent 70%), radial-gradient(ellipse 45% 35% at 85% 85%, rgba(16,185,129,0.3) 0%, transparent 70%)' }} />

      {/* ── PORTAL SCREEN ── */}
      {screen === 'portal' && (
        <div className="relative z-10 w-full max-w-[860px] animate-[fadeUp_0.6s_ease-out]">
          <header className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-[10.5px] font-bold tracking-[0.18em] text-indigo-600 uppercase font-mono mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600/50" />
              Official Access Portal
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600/50" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-none tracking-tight mb-4">
              Competition <span className="text-indigo-600 relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:right-0 after:h-1 after:bg-indigo-600/30 after:rounded-full">Portal</span>
            </h1>
            <p className="text-slate-500 max-w-md mx-auto text-sm md:text-base leading-relaxed">
              Select your access level to proceed to your designated workspace
            </p>
          </header>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Choose Your Role</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RoleCard 
              type="admin"
              title="Administrator"
              badge="Admin"
              icon="🔐"
              desc="Full system access to manage the competition lifecycle — from setup through to final results."
              features={['Manage scoring criteria & weights', 'Register contestants & judges', 'View tabulated results']}
              onClick={() => setScreen('admin-login')}
            />
            <RoleCard 
              type="judge"
              title="Official Judge"
              badge="Judge"
              icon="⚖️"
              desc="Access your dedicated scoring panel to evaluate contestants and submit scores in real-time."
              features={['Real-time scoring panel', 'Per-criterion evaluation', 'Live score submission']}
            
            />
          </div>

          <footer className="mt-12 flex flex-wrap items-center justify-center gap-4 text-slate-400 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]">
            <span>Secure System</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Powered by Gemini 3.1 & MySQL</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span>v1.0</span>
          </footer>
        </div>
      )}

      {/* ── LOGIN SCREENS ── */}
      {screen !== 'portal' && (
        <div className="relative z-10 w-full max-w-[440px] animate-[fadeIn_0.42s_ease-out]">
          <LoginForm
            role={screen === 'admin-login' ? 'admin' : ''}
            onBack={() => setScreen('portal')}
            onLogin={handleLogin}
          />
        </div>
      )}
    </div>
  );
};

// Sub-component for clean cards
const RoleCard = ({ type, title, badge, icon, desc, features, onClick }) => {
  const isAdmin = type === 'admin';
  const colorClass = isAdmin ? 'hover:border-indigo-200 border-indigo-100 hover:shadow-indigo-100/50' : 'hover:border-emerald-200 border-emerald-100 hover:shadow-emerald-100/50';
  const accentClass = isAdmin ? 'bg-indigo-600' : 'bg-emerald-500';

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white border-[1.5px] rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl border-slate-200 ${colorClass}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity opacity-0 group-hover:opacity-100 ${accentClass}`} />
      
      <span className={`absolute top-5 right-5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md border font-mono ${isAdmin ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
        {badge}
      </span>

      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-6 transition-transform group-hover:scale-110 border ${isAdmin ? 'bg-indigo-50 border-indigo-200' : 'bg-emerald-50 border-emerald-200'}`}>
        {icon}
      </div>

      <h2 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">{title}</h2>
      <p className="text-[13.5px] text-slate-500 leading-relaxed mb-6">{desc}</p>

      <ul className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 mb-7">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[12.5px] font-semibold text-slate-600">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accentClass}`} />
            {f}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className={`text-xs font-bold tracking-wider uppercase ${isAdmin ? 'text-indigo-600' : 'text-emerald-600'}`}>
          Enter {isAdmin ? 'Dashboard' : 'Scoring'}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:translate-x-1 ${isAdmin ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
          →
        </div>
      </div>
    </div>
  );
};

export default Home;