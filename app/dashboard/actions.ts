"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_NAME = "hf-dash-auth";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string") {
    return { error: "Missing password." };
  }
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return {
      error: "Server isn't configured — set DASHBOARD_PASSWORD in .env.local.",
    };
  }
  if (password !== expected) {
    return { error: "Wrong password." };
  }
  const c = await cookies();
  c.set(COOKIE_NAME, password, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function logoutAction() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
  revalidatePath("/dashboard");
}
