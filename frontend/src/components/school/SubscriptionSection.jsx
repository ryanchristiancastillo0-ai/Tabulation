import { PLANS } from '../../constant/navlist';
import { Check, Star } from 'lucide-react';

export default function SubscriptionSection({ value, setField }) {
  return (
    <div className="px-4 sm:px-9 py-6 sm:py-8 border-b border-[#E1E8DE]">
      <div
        className="text-sm font-bold text-[#1B4332] mb-4 sm:mb-5 flex items-center gap-2"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        <Star size={14} /> Subscription Plan
      </div>

      {/* 1 col on mobile, 3 on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map((plan) => {
          const active = value === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setField('subscription_plan', plan.id)}
              className={[
                'p-4 rounded-sm cursor-pointer relative border-2 transition-all duration-150',
                active
                  ? 'border-[#1B4332] bg-[#F3F6F1] shadow-[0_0_0_3px_rgba(27,67,50,0.1)]'
                  : 'border-[#E1E8DE] bg-white hover:border-[#BBCABB]',
              ].join(' ')}
            >
              {plan.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#1B4332] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-sm tracking-widest uppercase whitespace-nowrap">
                  Most Popular
                </div>
              )}

              {/* Row layout on mobile, stacked on sm+ */}
              <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                <div
                  className={`text-base sm:text-lg font-bold sm:mb-0.5 ${active ? 'text-[#1B4332]' : 'text-[#14201A]'}`}
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {plan.price}
                </div>
                <div className="flex flex-col">
                  <div className={`text-sm font-bold ${active ? 'text-[#1B4332]' : 'text-[#14201A]'}`}>
                    {plan.label}
                  </div>
                  <div className="text-xs text-[#4B5A4D] sm:mt-1">{plan.desc}</div>
                </div>
              </div>

              {active && (
                <div className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-sm bg-[#1B4332] flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}