import type { LabelHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Label({ className, children, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: la asociación (htmlFor) la provee quien lo usa vía ...rest
    <label className={cn('mb-1 block font-medium text-muted text-sm', className)} {...rest}>
      {children}
    </label>
  );
}
