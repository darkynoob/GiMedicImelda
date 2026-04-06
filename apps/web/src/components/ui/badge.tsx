import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'alert'
  | 'draft'
  | 'signed';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border border-gray-200 bg-gray-50 text-gray-700',
  secondary: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border border-amber-200 bg-amber-50 text-amber-700',
  alert: 'border border-red-200 bg-red-50 text-red-700',
  draft: 'border border-amber-200 bg-amber-50 text-amber-700',
  signed: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
};

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium tracking-wide',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
