import { notFound } from "next/navigation";
import { getCase } from "@/lib/simulator/cases";
import { KioskExperience } from "./KioskExperience";

export const dynamic = "force-dynamic";

export default async function SimulatorCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const patient = getCase(caseId);
  if (!patient) notFound();
  return <KioskExperience patient={patient} />;
}
