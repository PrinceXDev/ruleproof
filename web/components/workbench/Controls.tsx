import { buttonVariants } from '@/components/ui/button';
import { PILL_TONES } from '@/constants/workbench';
import { Children, cloneElement, isValidElement, useId } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export {
  WORKBENCH_INPUT_CLASS as inputClass,
  WORKBENCH_CARD_CLASS as cardClass,
} from '@/constants/workbench';

export const Button = ({
  children,
  primary = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) => (
  <button
    type="button"
    className={buttonVariants({ variant: primary ? 'primary' : 'secondary', size: 'sm' })}
    {...props}
  >
    {children}
  </button>
);

export const Field = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) => {
  const id = useId();
  return (
    <div className="block min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-ink-muted">
        {label}
      </label>
      {Children.map(children, (child) => {
        if (
          !isValidElement<{ id?: string; 'aria-describedby'?: string }>(child) ||
          !['input', 'select', 'textarea'].includes(String(child.type))
        )
          return child;
        return cloneElement(child, { id, 'aria-describedby': hint ? `${id}-hint` : undefined });
      })}
      {hint && (
        <span id={`${id}-hint`} className="block text-[11px] leading-relaxed text-ink-muted">
          {hint}
        </span>
      )}
    </div>
  );
};

export const Pill = ({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: keyof typeof PILL_TONES;
}) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ${PILL_TONES[tone]}`}
  >
    {children}
  </span>
);
