export function HFFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <span>
          © {new Date().getFullYear()} Skin Health Concierge. Educational tool — not
          a substitute for medical diagnosis.
        </span>
        <span className="opacity-70">
          Demo by Shammas Development LLC · Synthetic data only
        </span>
      </div>
    </footer>
  );
}
