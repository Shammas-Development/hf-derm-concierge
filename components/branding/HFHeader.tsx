import Link from "next/link";
import { HFLogo } from "./HFLogo";
import { cn } from "@/lib/utils";

export function HFHeader({
  className,
  showBack,
  rightSlot,
}: {
  className?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Home">
          <HFLogo />
        </Link>
        {rightSlot ? (
          <div className="flex items-center gap-3">{rightSlot}</div>
        ) : showBack ? (
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Exit
          </Link>
        ) : null}
      </div>
    </header>
  );
}
