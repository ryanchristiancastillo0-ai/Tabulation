import {
  LayoutGrid, Trophy, Sparkles, Scale,
  Users, UserPlus, MonitorCog,
} from "lucide-react";

export const navItems = [
  { id: "overview",    label: "Overview",     icon: <LayoutGrid  size={16}/> },
  { id: "contest",     label: "Contest Info", icon: <Trophy      size={16}/> },
  { id: "ai",          label: "AI Prompt",    icon: <Sparkles    size={16}/> },
  { id: "criteria",    label: "Criteria",     icon: <Scale       size={16}/> },
  { id: "judges",      label: "Judges",       icon: <Users       size={16}/> },
  { id: "contestants", label: "Contestants",  icon: <UserPlus    size={16}/> },
  { id: "system",      label: "System",       icon: <MonitorCog  size={16}/> },
];


export const PLANS = [
  { id: 'free',      label: 'Free',     desc: 'Up to 5 judges + 3 AI prompt',       price: '₱0',   highlight: false },
  { id: 'standard', label: 'Standard', desc: 'Up to 10 judges + 10 AI prompt',      price: '₱599', highlight: false },
  { id: 'premium',  label: 'Premium',  desc: 'Unlimited judges + 1 month of AI prompt',
     price: '₱1799', highlight: true  },
];
