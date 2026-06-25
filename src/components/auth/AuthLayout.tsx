import { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import LeftShowcase from './LeftShowcase';
import SecurityBadges from './SecurityBadges';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-[#020617] font-sans text-white lg:flex lg:h-dvh lg:flex-col">
      <div className="flex items-center gap-2 px-6 py-3 lg:hidden shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-white">myPDF.reader</span>
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[58fr_42fr]">
        <LeftShowcase />

        <div className="relative flex min-h-0 flex-col overflow-y-auto px-6 py-6 sm:px-8 lg:px-8 lg:py-6">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-violet-950/20 via-transparent to-transparent"
            aria-hidden
          />
          <div className="relative z-10 mx-auto my-auto flex w-full max-w-[470px] flex-col items-center py-2">
            {children}
            <SecurityBadges />
          </div>
        </div>
      </div>
    </div>
  );
}
