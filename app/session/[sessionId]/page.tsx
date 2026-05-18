import { SessionExperience } from "./SessionExperience";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <SessionExperience sessionId={sessionId} />;
}
