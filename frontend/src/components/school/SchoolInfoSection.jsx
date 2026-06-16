import { Building2, Mail, Phone, Upload } from 'lucide-react';
import { Field, AddressSection, inputCls } from './index';

export default function SchoolInfoSection({ form, setField, errors, setErrors, logoRef, handleLogo, loc }) {
  return (
    <div className="px-4 sm:px-9 py-6 sm:py-8 border-b border-slate-200">
      <div className="text-sm font-bold text-emerald-700 mb-5 sm:mb-6 flex items-center gap-2">
        <Building2 size={14} /> School Information
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">

        {/* Logo Upload */}
        <Field label="School Logo">
          <div
            onClick={() => logoRef.current.click()}
            className={[
              'border-2 border-dashed rounded-xl p-3 sm:p-4 cursor-pointer flex items-center gap-3 transition-all duration-200',
              form.school_logo
                ? 'border-emerald-400 bg-emerald-50/50'
                : 'border-slate-300 bg-slate-50 hover:border-emerald-400',
            ].join(' ')}
          >
            {form.school_logo ? (
              <>
                <img src={form.school_logo} alt="logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-700">Logo uploaded</div>
                  <div className="text-xs text-slate-600">Click to replace</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                  <Upload size={18} className="text-slate-400" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-600">Click to upload logo</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">PNG, JPG, SVG — recommended 300×300px</div>
                </div>
              </>
            )}
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </Field>

        {/* School Name */}
        <Field label="School Name *" icon={Building2} error={errors.school_name}>
          <input
            className={inputCls(errors.school_name)}
            placeholder="e.g. University of Santo Tomas"
            value={form.school_name}
            onChange={(e) => setField('school_name', e.target.value)}
          />
        </Field>

        {/* Email + Phone — stacks on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="School Email *" icon={Mail} error={errors.school_email}>
            <input
              className={inputCls(errors.school_email)}
              placeholder="info@school.edu.ph"
              type="email"
              value={form.school_email}
              onChange={(e) => setField('school_email', e.target.value)}
            />
          </Field>
          <Field label="Phone Number" icon={Phone}>
            <input
              className={inputCls(false)}
              placeholder="+63 912 345 6789"
              value={form.school_phone}
              onChange={(e) => setField('school_phone', e.target.value)}
            />
          </Field>
        </div>

        {/* Address */}
        <AddressSection loc={loc} errors={errors} setErrors={setErrors} />

      </div>
    </div>
  );
}