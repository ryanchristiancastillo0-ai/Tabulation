import { useState, useEffect } from "react";
import {getSchoolId} from '../../utils/judge'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export function useSystemConfig() {
  const [sysConfig, setSysConfig] = useState({
    school_name:     '',
    portal_name:     '',
    school_logo:     '',
    background_logo: '',
    primary_color:   '#006c49',
    secondary_color: '#10b981',
    footer_text:     '',
    logo_radius:     12,
    header_template: 'structured',
  });

  useEffect(() => {
    const school_id = getSchoolId();
    const fetchConfig = async () => {
      try {
        const res  = await fetch(`${API_BASE}/public/system-config?school_id=${school_id}`);
        const data = await res.json();
        if (data && !data.error) {
          const clean = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)
          );
          setSysConfig(prev => ({ ...prev, ...clean }));
        }
      } catch (err) {
        console.error('system-config error:', err);
      }
    };
    fetchConfig();
  }, []);

  return sysConfig;
}