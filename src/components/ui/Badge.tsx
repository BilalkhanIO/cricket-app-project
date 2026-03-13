import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "live" | "primary";
  className?: string;
}

const variantStyles = {
  default:  "bg-[#D6E6F2] text-[#1B3A5C]",
  primary:  "bg-[#769FCD] text-white",
  success:  "bg-emerald-100 text-emerald-800",
  warning:  "bg-amber-100 text-amber-800",
  danger:   "bg-red-100 text-red-700",
  info:     "bg-[#D6E6F2] text-[#2D5484]",
  live:     "bg-red-500 text-white",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        variantStyles[variant],
        variant === "live" && "live-dot",
        className
      )}
    >
      {variant === "live" && <span className="w-1.5 h-1.5 bg-white rounded-full inline-block"></span>}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps["variant"]> = {
    LIVE:          "live",
    UPCOMING:      "info",
    COMPLETED:     "success",
    INNINGS_BREAK: "warning",
    ABANDONED:     "default",
    DELAYED:       "warning",
    CANCELED:      "danger",
    TOSS:          "info",
    ACTIVE:        "success",
    DRAFT:         "default",
    REGISTRATION:  "primary",
    APPROVED:      "success",
    PENDING:       "warning",
    REJECTED:      "danger",
  };

  return (
    <Badge variant={variantMap[status] || "default"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
