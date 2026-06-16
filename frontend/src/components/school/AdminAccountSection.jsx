import { useState } from 'react';
import {
  Mail, Check, User, Lock, Eye, EyeOff,
} from 'lucide-react';
import { inputCls, StrengthBar, Field } from './index';

export default function AdminAccountSection({ form, setField, errors }) {
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="px-4 sm:px-9 py-6 sm:py-8 border-b border-slate-200">

      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-1.5">
        <div className="text-sm font-bold text-emerald-700 flex items-center gap-2">
          <User size={14} /> Admin Account
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full self-start xs:self-auto">
          Linked to this school
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-5 sm:mb-6 leading-relaxed">
        This will be the primary admin login for your school's portal.
        Each school gets its own isolated admin account.
      </p>

      <div className="flex flex-col gap-4 sm:gap-5">

        {/* Name + Email — stacks on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Admin Name *" icon={User} error={errors.admin_name}>
            <input
              className={inputCls(errors.admin_name)}
              placeholder="e.g. Juan dela Cruz"
              value={form.admin_name}
              onChange={(e) => setField('admin_name', e.target.value)}
            />
          </Field>
          <Field label="Admin Email *" icon={Mail} error={errors.admin_email}>
            <input
              className={inputCls(errors.admin_email)}
              placeholder="admin@school.edu.ph"
              type="email"
              value={form.admin_email}
              onChange={(e) => setField('admin_email', e.target.value)}
            />
          </Field>
        </div>

        {/* Password + Confirm — stacks on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Password *" icon={Lock} error={errors.admin_password}>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className={`${inputCls(errors.admin_password)} pr-10`}
                placeholder="Min. 8 characters"
                value={form.admin_password}
                onChange={(e) => setField('admin_password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <StrengthBar pw={form.admin_password} />
          </Field>

          <Field label="Confirm Password *" icon={Lock} error={errors.admin_confirm}>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`${inputCls(errors.admin_confirm)} pr-10`}
                placeholder="Re-enter password"
                value={form.admin_confirm}
                onChange={(e) => setField('admin_confirm', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.admin_confirm && form.admin_password === form.admin_confirm && (
              <span className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                <Check size={11} /> Passwords match
              </span>
            )}
          </Field>
        </div>

      </div>
    </div>
  );
}