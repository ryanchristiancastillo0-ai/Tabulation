export default function inputCls(error) {
  return [
    'w-full px-3.5 py-2.5 rounded-sm text-sm outline-none transition-all',
    'bg-[#F3F6F1] text-[#14201A] placeholder-[#8FA192]',
    error
      ? 'border border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : 'border border-[#BBCABB] focus:border-[#1B4332] focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15',
  ].join(' ');
}