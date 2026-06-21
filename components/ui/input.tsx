import * as React from 'react';
import { cn } from '@/lib/utils';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-bronze focus:ring-2 focus:ring-bronze/20',
        props.className
      )}
    />
  );
}

