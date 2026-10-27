import { cva, type VariantProps } from 'class-variance-authority';

// Applied to <button>, <a> and <Link> alike, so it is exported as classes
// rather than a component.
export const buttonVariants = cva(
  'group/btn inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-45 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-brand-ink shadow-[0_0_0_1px_rgba(213,248,121,.4),0_8px_30px_-8px_rgba(213,248,121,.55)] hover:bg-[#e4ffa3] hover:shadow-[0_0_0_1px_rgba(213,248,121,.6),0_12px_40px_-8px_rgba(213,248,121,.7)]',
        secondary:
          'border border-border bg-panel/70 text-ink backdrop-blur hover:border-ink-faint hover:bg-panel-elevated',
        ghost: 'text-ink-muted hover:bg-panel-elevated hover:text-ink',
      },
      size: {
        sm: 'h-9 px-3.5 text-[13px]',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-6 text-[15px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
