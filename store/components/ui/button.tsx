import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'on-dark-primary'
    | 'on-dark-outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const baseClasses =
    "inline-flex items-center justify-center uppercase font-bold tracking-[0.1em] text-xs rounded-none transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:bg-border disabled:text-white";

const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-ink text-white border border-ink hover:bg-white hover:text-ink",
    secondary: "bg-transparent text-ink border border-border-strong hover:bg-ink hover:text-white",
    ghost: "bg-transparent text-text border-0 hover:text-muted hover:underline",
    'on-dark-primary': "bg-white text-ink border border-white hover:bg-transparent hover:text-white",
    'on-dark-outline': "bg-transparent text-white border border-white hover:bg-white hover:text-ink",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-6 py-3",
    md: "px-9 py-4",
    lg: "px-12 py-5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    children,
    disabled,
    type = 'button',
    variant = 'primary',
    size = 'md',
    ...props
}, ref) => {
    return (
        <button
            disabled={disabled}
            ref={ref}
            type={type}
            {...props}
            className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        >
            {children}
        </button>
    )
});

Button.displayName = 'Button';
export default Button;
