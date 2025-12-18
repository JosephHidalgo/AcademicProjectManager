import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <div className="w-full">
                <input
                    type={type}
                    className={cn(
                        'flex h-11 w-full rounded-lg border bg-white px-4 py-2 text-sm transition-colors',
                        'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-950',
                        'placeholder:text-slate-400',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : 'border-slate-300 focus-visible:ring-blue-500',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
