import { Resend } from "resend";

/**
 * RESEND_API_KEY が未設定の開発時はメール送信をスキップし、コンソールに内容を出力するだけにする。
 * 本番投入前に .env の RESEND_API_KEY / EMAIL_FROM を設定すること。
 */
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[email skipped: RESEND_API_KEY未設定]", params.to, params.subject);
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "no-reply@example.com",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export function reservationConfirmedEmail(params: {
  guestName: string;
  menuName: string;
  dateLabel: string;
  timeLabel: string;
  manageUrl: string;
}) {
  return {
    subject: "【予約確定】ご予約ありがとうございます",
    html: `
      <p>${params.guestName} 様</p>
      <p>以下の内容でご予約を承りました。</p>
      <ul>
        <li>メニュー: ${params.menuName}</li>
        <li>日時: ${params.dateLabel} ${params.timeLabel}</li>
      </ul>
      <p>予約内容の確認・変更・キャンセルは<a href="${params.manageUrl}">こちら</a>から行えます。</p>
    `,
  };
}

export function reservationCancelledEmail(params: { guestName: string; menuName: string; dateLabel: string; timeLabel: string }) {
  return {
    subject: "【予約キャンセル】受付完了のお知らせ",
    html: `
      <p>${params.guestName} 様</p>
      <p>以下のご予約をキャンセルしました。</p>
      <ul>
        <li>メニュー: ${params.menuName}</li>
        <li>日時: ${params.dateLabel} ${params.timeLabel}</li>
      </ul>
    `,
  };
}

export function reservationReminderEmail(params: {
  guestName: string;
  menuName: string;
  dateLabel: string;
  timeLabel: string;
  manageUrl: string;
}) {
  return {
    subject: "【明日のご予約のご案内】",
    html: `
      <p>${params.guestName} 様</p>
      <p>明日は下記のご予約をお待ちしております。</p>
      <ul>
        <li>メニュー: ${params.menuName}</li>
        <li>日時: ${params.dateLabel} ${params.timeLabel}</li>
      </ul>
      <p>やむを得ずキャンセル・変更される場合は<a href="${params.manageUrl}">こちら</a>からお願いします。</p>
    `,
  };
}
