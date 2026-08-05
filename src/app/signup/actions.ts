"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, createSessionCookieValue } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type SignupState = { error?: string };

const MIN_PASSWORD_LENGTH = 8;

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const salonName = String(formData.get("salon_name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!salonName || !email || !password) {
    return { error: "すべての項目を入力してください" };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `パスワードは${MIN_PASSWORD_LENGTH}文字以上で設定してください` };
  }

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("salons")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  const passwordHash = hashPassword(password);
  let salonId: string;

  // 初期セットアップ時に作成された「サンプルサロン」(メール未設定)が1件だけ残っていれば、
  // 新規に作らずそのアカウントを引き継ぐ(既存の投稿データを保持するため)。
  const { data: unclaimedSalons } = await supabase
    .from("salons")
    .select("id")
    .is("email", null)
    .limit(2);

  if (unclaimedSalons && unclaimedSalons.length === 1) {
    const { data: updated, error } = await supabase
      .from("salons")
      .update({ name: salonName, email, password_hash: passwordHash })
      .eq("id", unclaimedSalons[0].id)
      .select("id")
      .single();

    if (error || !updated) {
      return { error: `登録に失敗しました: ${error?.message}` };
    }
    salonId = updated.id;
  } else {
    const { data: created, error } = await supabase
      .from("salons")
      .insert({ name: salonName, email, password_hash: passwordHash })
      .select("id")
      .single();

    if (error || !created) {
      return { error: `登録に失敗しました: ${error?.message}` };
    }
    salonId = created.id;
  }

  const token = await createSessionCookieValue(salonId);
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
