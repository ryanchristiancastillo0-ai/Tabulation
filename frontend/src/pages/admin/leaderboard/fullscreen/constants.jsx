import { GiTrophy } from 'react-icons/gi';
import { RiMedalLine } from 'react-icons/ri';

export const MEDAL_ICONS = [
  <GiTrophy className="text-amber-400" size={22} />,
  <RiMedalLine className="text-slate-300" size={22} />,
  <RiMedalLine className="text-orange-400" size={22} />,
];

export const MEDAL_LABEL = ['1st', '2nd', '3rd'];

// Podium display order (left → right) and relative stage height per rank
export const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd
export const PODIUM_HEIGHT = { 0: 132, 1: 92, 2: 68 };

export const STAGE_DEPTH = 16; // px "thickness" of the 3D block sides

export const CONFETTI_COLORS = ['#F59E0B', '#EF4444', '#22C55E', '#3B82F6', '#EC4899', '#A855F7'];