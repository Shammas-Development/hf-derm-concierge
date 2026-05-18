import { cn } from "@/lib/utils";

export function HFLogo({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const stroke = variant === "dark" ? "#003DA5" : "#ffffff";
  const text = variant === "dark" ? "#002C75" : "#ffffff";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="1" y="1" width="34" height="34" rx="8" stroke={stroke} strokeWidth="2" />
        <path
          d="M11 10v16M11 18h14M25 10v16"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className="font-heading font-semibold text-[15px] tracking-tight"
          style={{ color: text }}
        >
          Henry Ford Health
        </span>
        <span
          className="text-[11px] uppercase tracking-[0.16em] font-medium opacity-70"
          style={{ color: text }}
        >
          Dermatology
        </span>
      </div>
    </div>
  );
}
