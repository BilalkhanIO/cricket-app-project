import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost" | "outline" | "navy";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary:   "bg-[#769FCD] hover:bg-[#5A8BBE] text-white border-transparent shadow-sm",
  navy:      "bg-[#1B3A5C] hover:bg-[#2D5484] text-white border-transparent shadow-sm",
  secondary: "bg-[#D6E6F2] hover:bg-[#B9D7EA] text-[#1B3A5C] border-transparent",
  danger:    "bg-red-600 hover:bg-red-700 text-white border-transparent",
  success:   "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent",
  ghost:     "bg-transparent hover:bg-[#D6E6F2] text-[#1B3A5C] border-transparent",
  outline:   "bg-transparent hover:bg-[#D6E6F2] text-[#769FCD] border-[#769FCD]",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size = "md", loading, fullWidth, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium border transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-[#769FCD] focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
