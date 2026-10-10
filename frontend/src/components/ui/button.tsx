import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Brand CTA: copper gradient + brushed-metal sheen, graphite text (AA 5:1).
        default:
          'metal-sheen bg-copper-gradient text-graphite shadow-copper-glow hover:shadow-[0_0_0_1px_rgb(221_162_124/0.6),0_12px_40px_-8px_rgb(184_117_74/0.6)]',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-foreground/25 bg-transparent text-foreground hover:border-primary hover:bg-primary/10',
        // Outline for use on photos/video — always light text.
        glass:
          'glass border-white/25 bg-white/10 text-white hover:border-copper-light hover:bg-white/20',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-link underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6',
        sm: 'h-10 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
