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
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  success: 'border-transparent bg-clinical-success text-clinical-success-foreground',
  warning: 'border-transparent bg-clinical-warning text-clinical-warning-foreground',
  alert: 'border-transparent bg-clinical-alert text-clinical-alert-foreground',
  draft: 'border-clinical-warning/30 bg-clinical-warning/10 text-clinical-warning',
  signed: 'border-clinical-success/30 bg-clinical-success/10 text-clinical-success',
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
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
