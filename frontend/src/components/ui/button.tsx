import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';

        // Map variant to CSS class
        const variantClass = {
            default: 'btn-primary',
            destructive: 'btn-danger',
            outline: 'btn-outline',
            secondary: 'btn-outline',
            ghost: 'btn-ghost',
            link: 'btn-ghost',
            success: 'btn-success',
        }[variant];

        // Map size to CSS class
        const sizeClass = {
            default: '',
            sm: 'btn-sm',
            lg: 'btn-lg',
            icon: 'btn-icon',
        }[size];

        return (
            <Comp
                className={cn('btn', variantClass, sizeClass, className)}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button };
