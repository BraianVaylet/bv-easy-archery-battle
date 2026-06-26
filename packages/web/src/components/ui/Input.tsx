import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 w-full rounded-lg border bg-surface px-3 text-fg placeholder:text-dim',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        invalid ? 'border-danger' : 'border-border',
        className,
      )}
      {...rest}
    />
  );
});
