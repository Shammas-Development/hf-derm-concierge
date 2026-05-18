import { cookies } from "next/headers";
import { DashboardView } from "./DashboardView";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "hf-dash-auth";

export default async function DashboardPage() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  const authed = !!token && token === process.env.DASHBOARD_PASSWORD;

  if (!authed) {
    return <LoginForm />;
  }
  return <DashboardView />;
}
