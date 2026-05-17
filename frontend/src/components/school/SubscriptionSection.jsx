import {PLANS} from '../../constant/navlist'
import {Check,
 Star
} from 'lucide-react';
export default function SubscriptionSection({ value, setField }) {
  return (
    <div className="px-9 py-8 border-b border-slate-200">
      <div className="text-sm font-bold text-emerald-700 mb-5 flex items-center gap-2">
        <Star size={14} /> Subscription Plan
      </div>
      <div className="grid grid-cols-3 gap-3">
        {PLANS.map((plan) => {
          const active = value === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setField('subscription_plan', plan.id)}
              className={[
                'p-4 rounded-xl cursor-pointer relative border-2 transition-all duration-150',
                active
                  ? 'border-emerald-400 bg-emerald-50/60 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              ].join(' ')}
            >
              {plan.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-widest uppercase whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div className={`text-lg font-extrabold mb-0.5 ${active ? 'text-emerald-700' : 'text-slate-900'}`}>
                {plan.price}
              </div>
              <div className={`text-sm font-bold ${active ? 'text-emerald-700' : 'text-slate-900'}`}>
                {plan.label}
              </div>
              <div className="text-xs text-slate-600 mt-1">{plan.desc}</div>
              {active && (
                <div
                  className="absolute top-2.5 right-2.5 rounded-full bg-emerald-400 flex items-center justify-center"
                  style={{ width: 18, height: 18 }}
                >
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