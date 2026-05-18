import { ViewportInspector } from "./ViewportInspector";

export const dynamic = "force-dynamic";

// Dev-only page: load this on any device to confirm responsive breakpoints.
// Safe to leave deployed — it carries no PHI and is unlinked from the rest of the app.
export default function ViewportPage() {
  return <ViewportInspector />;
}
