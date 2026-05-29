import type { PatientCase } from "../types";
import { marcusMelanoma } from "./marcus-melanoma";

// Register patient cases here. Add a new file under cases/ and append it.
const CASES: PatientCase[] = [marcusMelanoma];

export function listCases(): PatientCase[] {
  return CASES;
}

export function getCase(id: string): PatientCase | undefined {
  return CASES.find((c) => c.id === id);
}
