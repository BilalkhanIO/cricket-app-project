import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

const baseInput = [
  "w-full px-3.5 py-2.5 rounded-2xl border bg-[color:var(--card-bg)] text-[color:var(--color-ink)]",
  "focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)]",
  "placeholder:text-[#9a8569] text-sm transition-colors",
].join(" ");

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-[color:var(--color-ink)]">{label}</label>}
      <input
        ref={ref}
        className={cn(baseInput, error ? "border-red-400" : "border-[color:var(--border-color)]", className)}
        {...props}
      />
      {error      && <p className="text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="text-xs text-[color:var(--color-ink-soft)]">{helperText}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-[color:var(--color-ink)]">{label}</label>}
      <select
        ref={ref}
        className={cn(baseInput, error ? "border-red-400" : "border-[color:var(--border-color)]", className)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-[color:var(--color-ink)]">{label}</label>}
      <textarea
        ref={ref}
        className={cn(baseInput, "resize-none", error ? "border-red-400" : "border-[color:var(--border-color)]", className)}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
