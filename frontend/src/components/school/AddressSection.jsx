import {
MapPin, Check,
 
} from 'lucide-react';
import {LocationSelect} from './index'
export default function AddressSection({ loc, errors, setErrors }) {
  return (
    <div>
      <div className="text-xs font-bold tracking-widest uppercase text-slate-600 flex items-center gap-1.5 mb-3">
        <MapPin size={12} className="text-emerald-700" /> School Address *
      </div>

      {loc.fullAddress && (
        <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 rounded-lg px-3 py-1.5 mb-3 flex items-center gap-1.5">
          <Check size={12} />
          {loc.fullAddress}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <LocationSelect
          label="Region *"
          icon={MapPin}
          value={loc.selectedRegion}
          onChange={(e) => { loc.setSelectedRegion(e.target.value); setErrors((prev) => ({ ...prev, region: '' })); }}
          options={loc.regions}
          loading={loc.loadingR}
          disabled={false}
          placeholder="Select Region"
          error={errors.region}
        />
        <LocationSelect
          label="Province *"
          icon={MapPin}
          value={loc.selectedProvince}
          onChange={(e) => { loc.setSelectedProvince(e.target.value); setErrors((prev) => ({ ...prev, province: '' })); }}
          options={loc.provinces}
          loading={loc.loadingP}
          disabled={!loc.selectedRegion}
          placeholder={loc.selectedRegion ? 'Select Province' : 'Select a region first'}
          error={errors.province}
        />
        <LocationSelect
          label="City / Municipality *"
          icon={MapPin}
          value={loc.selectedCity}
          onChange={(e) => { loc.setSelectedCity(e.target.value); setErrors((prev) => ({ ...prev, city: '' })); }}
          options={loc.cities}
          loading={loc.loadingC}
          disabled={!loc.selectedProvince}
          placeholder={loc.selectedProvince ? 'Select City / Municipality' : 'Select a province first'}
          error={errors.city}
        />
        <LocationSelect
          label="Barangay *"
          icon={MapPin}
          value={loc.selectedBarangay}
          onChange={(e) => { loc.setSelectedBarangay(e.target.value); setErrors((prev) => ({ ...prev, barangay: '' })); }}
          options={loc.barangays}
          loading={loc.loadingB}
          disabled={!loc.selectedCity}
          placeholder={loc.selectedCity ? 'Select Barangay' : 'Select a city first'}
          error={errors.barangay}
        />
      </div>
    </div>
  );
}
