import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export type Urgency = "GREEN" | "YELLOW" | "RED";

const config: Record<
  Urgency,
  {
    label: string;
    sub: string;
    cardClass: string;
    iconClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  GREEN: {
    label: "Routine",
    sub: "Your concerns sound common and manageable. A routine dermatology visit will give you personalized guidance and peace of mind.",
    cardClass:
      "border-[#10B981]/30 bg-[#ECFDF5] text-[#065F46]",
    iconClass: "text-[#10B981]",
    icon: CheckCircle2,
  },
  YELLOW: {
    label: "Schedule soon",
    sub: "We recommend scheduling a dermatology appointment soon to evaluate your concerns properly.",
    cardClass:
      "border-[#F59E0B]/35 bg-[#FFFBEB] text-[#92400E]",
    iconClass: "text-[#F59E0B]",
    icon: AlertTriangle,
  },
  RED: {
    label: "Within the week",
    sub: "Some features you described would benefit from prompt evaluation. We recommend scheduling within the next week.",
    cardClass: "border-[#EF4444]/35 bg-[#FEF2F2] text-[#991B1B]",
    iconClass: "text-[#EF4444]",
    icon: AlertCircle,
  },
};

export function UrgencyBadge({
  level,
  className,
}: {
  level: Urgency;
  className?: string;
}) {
  const c = config[level];
  const Icon = c.icon;
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5 flex gap-3",
        c.cardClass,
        className,
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", c.iconClass)} />
      <div className="space-y-1">
        <div className="font-medium">{c.label}</div>
        <div className="text-sm opacity-90">{c.sub}</div>
      </div>
    </div>
  );
}

export function UrgencyChip({ level }: { level: Urgency }) {
  const dotColor = {
    GREEN: "bg-[#10B981]",
    YELLOW: "bg-[#F59E0B]",
    RED: "bg-[#EF4444]",
  }[level];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80">
      <span className={cn("h-2 w-2 rounded-full", dotColor)} />
      {level === "GREEN" ? "Routine" : level === "YELLOW" ? "Soon" : "Urgent"}
    </span>
  );
}
