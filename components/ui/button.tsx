import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'dark' | 'danger' | 'success' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-bronze text-white hover:bg-[#9f7138]',
  secondary: 'border border-bronze bg-white text-navy hover:bg-champagne',
  dark: 'bg-navy text-white hover:bg-panel',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  ghost: 'bg-transparent text-navy hover:bg-white/70'
};

export function Button({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

