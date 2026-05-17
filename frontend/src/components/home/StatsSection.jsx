export default function StatsSection() {
  const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '500+', label: 'Institutions' },
    { value: '12M', label: 'Active Learners' },
    { value: 'ISO', label: '27001 Certified' },
  ];

  return (
    <section className="py-16 sm:py-24 border-t border-[#e0e3e5]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
        {stats.map(({ value, label }) => (
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
  );
}