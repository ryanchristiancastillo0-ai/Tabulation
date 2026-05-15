import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-['Inter',sans-serif] min-h-screen selection:bg-[#10b981]/20 selection:text-[#00422b]">

     
    {/* ── Top Nav ── */}
<nav className="bg-[#f7f9fb] sticky top-0 z-50 border-b border-[#e0e3e5] w-full">
  <div className="flex justify-between items-center max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 h-20">
    <div className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-[#006c49] tracking-tight">
      {/* Thematic Logo Badge */}
      <img 
        src="/img/USAL_LOGO.png" 
        alt="Veridict Logo" 
        className="w-12 h-12 sm:w-14 sm:h-14 object-contain flex-shrink-0"
      />
      Veridict
    </div>

    {/* Desktop Navigation Link Block */}
    <div className="hidden md:flex items-center gap-4">
      <button onClick={()=>navigate('/login')} className="text-base text-[#3c4a42] hover:text-[#006c49] transition-colors px-2 py-1">
        Sign In
      </button>
      <button onClick={()=>navigate('/school')} className="bg-[#10b981] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all">
        Get Started
      </button>
    </div>

    {/* Responsive Hamburger Mobile Menu Button */}
    <div className="flex md:hidden">
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)} 
        className="text-[#3c4a42] hover:text-[#006c49] focus:outline-none p-2"
        aria-label="Toggle menu"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          viewBox="0 0 24 24"
        >
          {isMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
    </div>
  </div>

  {/* Sliding Responsive Dropdown Mobile Menu Block */}
  {isMenuOpen && (
    <div className="md:hidden bg-[#f7f9fb] border-b border-[#e0e3e5] px-4 pt-2 pb-6 space-y-3 absolute left-0 w-full shadow-lg z-40 transition-all duration-200">
      <button 
        onClick={() => { navigate('/login'); setIsMenuOpen(false); }} 
        className="block w-full text-left text-base text-[#3c4a42] hover:text-[#006c49] font-medium py-2.5 border-b border-[#e0e3e5]/50"
      >
        Sign In
      </button>
      <button 
        onClick={() => { navigate('/school'); setIsMenuOpen(false); }} 
        className="block w-full text-center bg-[#10b981] text-white py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-sm"
      >
        Get Started
      </button>
    </div>
  )}
</nav>
      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-[80vh] flex items-center overflow-hidden">
          {/* Background image + overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUuamHQHsEjOeAOmQU5psjn0fOyEY_Xge0mfvs0kgNHFS8whxXhAg4IV-BbJS4G4PGar5R2u4jjgIiBjIYv7Ss7H8RJvvucD8538JvUeEPUoyMni1dVuVVNCc7n818O4IfyTt8mrdXK9EhkK8kzBf8-qgLGg1NGItlTMfmuuTnD0J9UV_Cu3Ylh-EPRLUkHk_y_PgINEfuOgjsLc5rL56CFkNWSXPUt7ikcb08zajwwnrD1hgUjcyqMeTW9OaNP9PPVeClU5b2hyON"
              alt="Academic Innovation"
              className="w-full h-full object-cover"
            />
            {/* Glass overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'rgba(247, 249, 251, 0.85)',
                backdropFilter: 'blur(8px)',
              }}
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-20 md:py-24">
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 bg-[#10b981]/10 text-[#006c49] text-xs font-semibold rounded-full mb-4 sm:mb-6 uppercase tracking-widest">
                Competition Portal
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-[#191c1e] mb-4 sm:mb-6 leading-tight tracking-tight">
                Professional Online Judging Platform{' '}
                <span className="text-[#006c49] block sm:inline">for Schools & Competitions</span>
              </h1>

              <p className="text-base sm:text-lg text-[#3c4a42] mb-8 sm:mb-10 max-w-2xl leading-relaxed">
               Create your school's judging workspace,
manage judges, contestants, and scoring
in real time.
              </p>

              <div className="flex flex-wrap gap-3 sm:gap-4">
                <button onClick={()=>navigate('/school')} className="bg-[#10b981] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all">
                 Create School Account
                  <span className="text-base sm:text-lg leading-none">→</span>
                </button>
                <button onClick={()=>navigate('/login')} className="bg-white border border-[#bbcabf] text-[#545f73] px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold hover:bg-[#f2f4f6] transition-all">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Role Cards ── */}
        <section className="py-16 sm:py-24 md:py-32 bg-[#f7f9fb]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12">
            <div className="text-center mb-12 sm:mb-20">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#191c1e] mb-4 tracking-tight">
                Specialized Evaluation Portals
              </h2>
              <p className="text-sm sm:text-base text-[#3c4a42]">
                Purpose-built interfaces for the keystones of your organization.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Administrator Card */}
              <RoleCard
                type="admin"
                icon="🔐"
                title="System Coordinator"
                desc="Oversee the entire evaluation lifecycle. Design custom rubrics, manage judge assignments, and monitor real-time scoring progress and data aggregation."
                features={[
                  'Manage scoring criteria',
                  'Register contestants',
                  'View tabulated results',
                ]}
                ctaLabel="Access Dashboard"
                ctaVariant="filled"
                onClick={() => navigate('/login')}
              />

              {/* Judge Card */}
              <RoleCard
                type="judge"
                icon="⚖️"
                title="Expert Evaluator"
                desc="Deliver high-quality assessments within a distraction-free environment. Utilize advanced tools for consistent scoring and detailed qualitative feedback."
                features={[
                  'Real-time scoring',
                  'Criterion evaluation',
                  'Live score submission',
                ]}
                ctaLabel="Start Judging"
                ctaVariant="outline"
                onClick={() => navigate('/judge')}
              />
            </div>
          </div>
        </section>

        {/* ── Stats / Trust ── */}
        <section className="py-16 sm:py-24 border-t border-[#e0e3e5]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {[
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '500+', label: 'Institutions' },
              { value: '12M', label: 'Active Learners' },
              { value: 'ISO', label: '27001 Certified' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl sm:text-[40px] font-extrabold text-[#006c49] mb-2 leading-none">
                  {value}
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-[#3c4a42] uppercase tracking-widest">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#f2f4f6] w-full py-12 sm:py-16 border-t border-[#e0e3e5]">
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 gap-12">
          <div>
            <div className="text-lg sm:text-xl font-bold text-[#191c1e] mb-4">
              Lumina Global Education
            </div>
            <p className="text-sm text-[#3c475a] max-w-sm leading-relaxed">
              Pioneering the future of institutional intelligence through secure,
              scalable, and intuitive software solutions.
            </p>
            <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-[#3c475a]">
              © {new Date().getFullYear()} Lumina Global Education. All rights reserved.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            <div className="flex flex-col gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs font-bold text-[#191c1e] uppercase mb-1 sm:mb-2 tracking-wider">
                Legal
              </span>
              {['Privacy Policy', 'Terms of Service', 'Compliance'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs sm:text-sm text-[#3c475a] hover:text-[#006c49] transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs font-bold text-[#191c1e] uppercase mb-1 sm:mb-2 tracking-wider">
                Support
              </span>
              {['Contact Us', 'Security Whitepaper', 'API Status'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs sm:text-sm text-[#3c475a] hover:text-[#006c49] transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({ type, icon, title, desc, features, ctaLabel, ctaVariant, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#bbcabf] p-6 sm:p-10 rounded-xl cursor-pointer flex flex-col h-full transition-all duration-300 sm:hover:-translate-y-1 sm:hover:border-[#10b981] sm:hover:shadow-[0px_10px_30px_rgba(30,41,59,0.06)]"
    >
      {/* Icon badge */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#f2f4f6] rounded-lg flex items-center justify-center mb-6 sm:mb-8 text-2xl sm:text-3xl">
        {icon}
      </div>

      <h3 className="text-xl sm:text-2xl font-semibold text-[#191c1e] mb-3 sm:mb-4">{title}</h3>

      <p className="text-sm sm:text-base text-[#3c4a42] mb-6 sm:mb-8 flex-grow leading-relaxed">{desc}</p>

      <ul className="space-y-2 sm:space-y-3 mb-8 sm:mb-10">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#3c4a42] font-medium">
            {/* Checkmark */}
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#006c49] flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA button */}
      {ctaVariant === 'filled' ? (
        <button className="w-full bg-[#10b981] text-white py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold hover:opacity-90 transition-all mt-auto">
          {ctaLabel}
        </button>
      ) : (
        <button className="w-full bg-white border border-[#006c49] text-[#006c49] py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold hover:bg-[#006c49]/5 transition-all mt-auto">
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

export default Home;