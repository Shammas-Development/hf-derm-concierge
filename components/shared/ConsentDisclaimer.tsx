import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConsentDisclaimer({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#003DA5]/15 bg-[#EEF2FB]/60 p-4 sm:p-5 flex gap-3",
        className,
      )}
    >
      <ShieldCheck className="h-5 w-5 text-[#003DA5] mt-0.5 shrink-0" />
      <div className="text-sm leading-relaxed text-[#1F2937]">
        <p className="font-medium text-[#002C75]">
          {compact
            ? "Educational tool only"
            : "This is an educational tool — not a medical diagnosis"}
        </p>
        <p className="mt-1 text-[#1F2937]/80">
          {compact
            ? "We'll connect you with a Henry Ford dermatologist for personalized care."
            : "We'll help you understand your concerns and connect you with a Henry Ford dermatologist for personalized care. Your conversation is private and not stored after your visit."}
        </p>
      </div>
    </div>
  );
}
