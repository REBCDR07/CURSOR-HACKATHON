import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "primary" | "success" | "warning" | "info" | "destructive";
  delay?: number;
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

export default function StatCard({ label, value, icon: Icon, color = "primary", delay = 0 }: StatCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 opacity-0 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{label}</p>
          <p className="mt-0.5 sm:mt-1 font-display text-lg sm:text-2xl font-bold">{value}</p>
        </div>
        <div className={cn("flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl shrink-0", colorMap[color])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}
