import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// サロン管理者のセルフサインアップ。新しいサロンを1件作成し、
// 指定メールアドレスをそのサロンの管理者として admin_users に登録する。
// ログイン自体は /admin/login のマジックリンク方式を引き続き使う(このAPIはパスワードを扱わない)。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const salonName = typeof body?.salonName === "string" ? body.salonName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!salonName) {
    return NextResponse.json({ error: "サロン名を入力してください" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (createUserError || !created?.user) {
    const alreadyExists = createUserError?.message?.toLowerCase().includes("already");
    return NextResponse.json(
      {
        error: alreadyExists
          ? "このメールアドレスは既に登録されています。ログイン画面からログインしてください。"
          : "アカウント作成に失敗しました。しばらくしてから再度お試しください。",
      },
      { status: 400 }
    );
  }

  const { data: salon, error: salonError } = await admin
    .from("salons")
    .insert({ name: salonName })
    .select("id")
    .single();

  if (salonError || !salon) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "サロンの作成に失敗しました。" }, { status: 500 });
  }

  const { error: adminUserError } = await admin
    .from("admin_users")
    .insert({ salon_id: salon.id, user_id: created.user.id });

  if (adminUserError) {
    await admin.auth.admin.deleteUser(created.user.id);
    await admin.from("salons").delete().eq("id", salon.id);
    return NextResponse.json({ error: "管理者登録に失敗しました。" }, { status: 500 });
  }

  // すぐ管理画面が使えるよう、最低限のスタッフ・営業時間を初期値として登録しておく
  // (どちらも管理画面から後で調整可能)
  await admin.from("staff").insert({ salon_id: salon.id, name: "担当スタイリスト" });
  await admin.from("business_hours").insert(
    Array.from({ length: 7 }, (_, day) => ({
      salon_id: salon.id,
      day_of_week: day,
      is_closed: false,
      open_time: "09:00",
      close_time: "18:00",
    }))
  );

  return NextResponse.json({ ok: true });
}
