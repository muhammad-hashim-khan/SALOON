import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PlaceholderCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  badgeText?: string;
  actions?: React.ReactNode;
}

export const PlaceholderCard: React.FC<PlaceholderCardProps> = ({
  title,
  subtitle,
  description,
  icon: Icon,
  badgeText = 'Phase 1 Foundation',
  actions,
}) => {
  return (
    <div className="bg-[#15171e] border border-white/10 rounded-2xl p-8 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#c5a880]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#c5a880]/20 to-[#846356]/10 border border-[#c5a880]/30 flex items-center justify-center text-[#c5a880]">
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30">
                {badgeText}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      <div className="bg-[#1c1e27] border border-white/5 rounded-xl p-5 mt-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Architecture Status
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
