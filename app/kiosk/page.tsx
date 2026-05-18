import { randomUUID } from "crypto";
import { KioskScreen } from "./KioskScreen";

export const dynamic = "force-dynamic";

export default function KioskPage() {
  const sessionId = randomUUID();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const sessionUrl = `${baseUrl}/session/${sessionId}`;
  return <KioskScreen sessionUrl={sessionUrl} />;
}
