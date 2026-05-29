import { redirect } from "next/navigation";

// The case picker lives at "/" (the app landing). Keep this route working by
// redirecting to it.
export default function SimulatorHome() {
  redirect("/");
}
