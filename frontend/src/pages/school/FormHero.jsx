export default function FormHero() {
  return (
    <div className="max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto px-6 pt-12 pb-0 text-center">
      <div className="w-14 h-[2px] bg-[#1B4332] mx-auto mb-5" />
      <span className="inline-block px-3.5 py-1 mb-4 bg-[#1B4332]/10 text-[#1B4332] rounded-sm border border-[#1B4332]/20 text-xs font-bold tracking-widest uppercase">
        School Registration
      </span>
      <h1
        className="text-4xl xl:text-5xl font-bold text-[#14201A] mb-2.5 tracking-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Create your school account
      </h1>
      <p className="text-base text-[#4B5A4D] leading-relaxed">
        Set up your competition portal in under 2 minutes.
      </p>
    </div>
  );
}