import type { PatientCase } from "../types";
import { margaretMelanoma } from "./margaret-melanoma";

// Register patient cases here. Add a new file under cases/ and append it.
const CASES: PatientCase[] = [margaretMelanoma];

export function listCases(): PatientCase[] {
  return CASES;
}

export function getCase(id: string): PatientCase | undefined {
  return CASES.find((c) => c.id === id);
}
