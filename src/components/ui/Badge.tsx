import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "live";
  className?: string;
}

const variantStyles = {
  default: "bg-gray-100 text-gray-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  live: "bg-red-500 text-white animate-pulse",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps["variant"]> = {
    LIVE: "live",
    UPCOMING: "info",
    COMPLETED: "success",
    INNINGS_BREAK: "warning",
    ABANDONED: "default",
    DELAYED: "warning",
    CANCELED: "danger",
    TOSS: "info",
    ACTIVE: "success",
    DRAFT: "default",
    REGISTRATION: "info",
    APPROVED: "success",
    PENDING: "warning",
    REJECTED: "danger",
  };

  return (
    <Badge variant={variantMap[status] || "default"}>
      {status.replace("_", " ")}
    </Badge>
  );
}
