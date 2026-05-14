import React from 'react';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────
   Tailwind config is assumed to be set up in
   your project with the same tokens as the
   original HTML (primary, outline-variant, etc.)
   If not, the inline-style fallbacks below keep
   things working out-of-the-box.
───────────────────────────────────────────── */

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-['Inter',sans-serif] min-h-screen selection:bg-[#10b981]/20 selection:text-[#00422b]">

      {/* ── Top Nav ── */}
      <nav className="bg-[#f7f9fb] sticky top-0 z-50 border-b border-[#e0e3e5] w-full">
        <div className="flex justify-between items-center max-w-[1280px] mx-auto px-12 h-20">
          <div className="text-2xl font-bold text-[#006c49] tracking-tight">
           Veridict
          </div>

       
          <div className="flex items-center gap-4">
            <button onClick={()=>navigate('/login')} className="text-base text-[#3c4a42] hover:text-[#006c49] transition-colors">
              Sign In
            </button>
            <button onClick={()=>navigate('/school')} className="bg-[#10b981] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all">
              Get Started
            </button>
          </div>
        </div>
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
          <div className="relative z-10 max-w-[1280px] mx-auto px-12 py-24">
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 bg-[#10b981]/10 text-[#006c49] text-xs font-semibold rounded-full mb-6 uppercase tracking-widest">
                Competition Portal
              </span>

              <h1 className="text-5xl md:text-6xl font-extrabold text-[#191c1e] mb-6 leading-tight tracking-tight">
                Professional Online Judging Platform{' '}
                <span className="text-[#006c49]">for Schools & Competitions</span>
              </h1>

              <p className="text-lg text-[#3c4a42] mb-10 max-w-2xl leading-relaxed">
               Create your school's judging workspace,
manage judges, contestants, and scoring
in real time.
              </p>

              <div className="flex flex-wrap gap-4">
                <button onClick={()=>navigate('/school')} className="bg-[#10b981] text-white px-8 py-4 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all">
                 Create School Account
                  <span className="text-lg leading-none">→</span>
                </button>
                <button onClick={()=>navigate('/login')} className="bg-white border border-[#bbcabf] text-[#545f73] px-8 py-4 rounded-lg text-sm font-bold hover:bg-[#f2f4f6] transition-all">
                 Sign In
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Role Cards ── */}
        <section className="py-32 bg-[#f7f9fb]">
          <div className="max-w-[1280px] mx-auto px-12">
            <div className="text-center mb-20">
              <h2 className="text-3xl font-semibold text-[#191c1e] mb-4 tracking-tight">
                Specialized Evaluation Portals
              </h2>
              <p className="text-base text-[#3c4a42]">
                Purpose-built interfaces for the keystones of your organization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <section className="py-24 border-t border-[#e0e3e5]">
          <div className="max-w-[1280px] mx-auto px-12 grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '500+', label: 'Institutions' },
              { value: '12M', label: 'Active Learners' },
              { value: 'ISO', label: '27001 Certified' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-[40px] font-extrabold text-[#006c49] mb-2 leading-none">
                  {value}
                </div>
                <div className="text-xs font-semibold text-[#3c4a42] uppercase tracking-widest">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#f2f4f6] w-full py-16 border-t border-[#e0e3e5]">
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-[1280px] mx-auto px-12 gap-12">
          <div>
            <div className="text-xl font-bold text-[#191c1e] mb-4">
              Lumina Global Education
            </div>
            <p className="text-sm text-[#3c475a] max-w-sm leading-relaxed">
              Pioneering the future of institutional intelligence through secure,
              scalable, and intuitive software solutions.
            </p>
            <div className="mt-8 text-sm text-[#3c475a]">
              © {new Date().getFullYear()} Lumina Global Education. All rights reserved.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#191c1e] uppercase mb-2 tracking-wider">
                Legal
              </span>
              {['Privacy Policy', 'Terms of Service', 'Compliance'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm text-[#3c475a] hover:text-[#006c49] transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#191c1e] uppercase mb-2 tracking-wider">
                Support
              </span>
              {['Contact Us', 'Security Whitepaper', 'API Status'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm text-[#3c475a] hover:text-[#006c49] transition-colors"
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
};

/* ─────────────────────────────────────────────
   RoleCard — same props interface as before,
   new Lumina visual style
───────────────────────────────────────────── */
const RoleCard = ({ type, icon, title, desc, features, ctaLabel, ctaVariant, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#bbcabf] p-10 rounded-xl cursor-pointer flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:border-[#10b981] hover:shadow-[0px_10px_30px_rgba(30,41,59,0.06)]"
    >
      {/* Icon badge */}
      <div className="w-14 h-14 bg-[#f2f4f6] rounded-lg flex items-center justify-center mb-8 text-3xl">
        {icon}
      </div>

      <h3 className="text-2xl font-semibold text-[#191c1e] mb-4">{title}</h3>

      <p className="text-base text-[#3c4a42] mb-8 flex-grow leading-relaxed">{desc}</p>

      <ul className="space-y-3 mb-10">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-sm text-[#3c4a42] font-medium">
            {/* Checkmark */}
            <svg
              className="w-5 h-5 text-[#006c49] flex-shrink-0"
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
        <button className="w-full bg-[#10b981] text-white py-4 rounded-lg text-sm font-bold hover:opacity-90 transition-all">
          {ctaLabel}
        </button>
      ) : (
        <button className="w-full bg-white border border-[#006c49] text-[#006c49] py-4 rounded-lg text-sm font-bold hover:bg-[#006c49]/5 transition-all">
          {ctaLabel}
        </button>
      )}
    </div>
  );
};

export default Home;