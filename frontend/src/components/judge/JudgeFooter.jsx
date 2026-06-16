

export default function JudgeFooter({ sysConfig }) {
  const primary = sysConfig.primary_color || '#006c49';

  return (
    <footer
      className="mt-10 border-t border-white/10"
      style={{ backgroundColor: primary }}
    >
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {sysConfig.portal_name || 'Veridict'}
            </h2>
            <p className="text-sm mt-1 text-white/70 max-w-md leading-relaxed">
              Professional judging and tabulation platform for Catholic schools
              and academic institutions in the Philippines.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Secure System Active</p>
              <p className="text-xs text-white/60">Encrypted judging session</p>
            </div>
          </div>
        </div>
        <div className="w-full h-px bg-white/10 my-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-white/60 text-center md:text-left">
            © {new Date().getFullYear()}{' '}
            {sysConfig.school_name || 'Veridict'}.
            All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-white/60">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security</span>
            <span className="hover:text-white transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}