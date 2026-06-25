import { Lock, Shield, BadgeCheck } from 'lucide-react';
import { authGlass } from './authStyles';
import { cn } from '@/lib/utils';

const BADGES = [
  { Icon: Lock, label: '256-bit Encryption' },
  { Icon: Shield, label: 'GDPR Compliant' },
  { Icon: BadgeCheck, label: 'SOC2 Type II' },
] as const;

export default function SecurityBadges() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {BADGES.map(({ Icon, label }) => (
        <div
          key={label}
          className={cn(
            authGlass,
            'flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] text-slate-400',
          )}
        >
          <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          {label}
        </div>
      ))}
    </div>
  );
}
