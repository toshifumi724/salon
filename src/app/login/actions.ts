"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, createSessionCookieValue } from "@/lib/auth";
import { verifyPasswordHash } from "@/lib/password";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" };
  }

  const supabase = createServiceRoleClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("id, password_hash")
    .eq("email", email)
    .maybeSingle();

  if (!salon?.password_hash || !verifyPasswordHash(password, salon.password_hash)) {
    return { error: "メールアドレスまたはパスワードが違います" };
  }

  const token = await createSessionCookieValue(salon.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7日間
  });

  redirect("/admin");
}
