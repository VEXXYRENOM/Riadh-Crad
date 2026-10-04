/**
 * lib/email-templates/reward.ts
 *
 * Notifies a customer when they earn or redeem a reward.
 */

interface RewardEmailProps {
  customerName: string;
  merchantName: string;
  eventType: 'earned' | 'redeemed';
  points: number;
  totalPoints: number;
  cardUrl: string;
}

export function rewardEmail({
  customerName,
  merchantName,
  eventType,
  points,
  totalPoints,
  cardUrl,
}: RewardEmailProps): string {
  const isEarned = eventType === 'earned';

  const headline = isEarned
    ? `🌟 لقد ربحت ${points} نقطة!`
    : `🎁 تم استخدام ${points} نقطة!`;

  const bodyText = isEarned
    ? `تهانينا! لقد أضفنا <strong style="color:#fbbf24;">${points} نقطة</strong> إلى رصيدك في <strong>${merchantName}</strong>.`
    : `تم استبدال <strong style="color:#f59e0b;">${points} نقطة</strong> من رصيدك في <strong>${merchantName}</strong>. نتمنى أن تكون قد استمتعت بمكافأتك!`;

  return /* html */ `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#1e293b;border-radius:16px;overflow:hidden;
                 border:1px solid rgba(255,215,0,0.2);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:28px;text-align:center;">
              <h1 style="color:#0f172a;margin:0;font-size:22px;font-weight:800;">${headline}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 16px;">
                أهلاً <strong style="color:#fbbf24;">${customerName}</strong>،
              </p>
              <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 32px;">
                ${bodyText}
              </p>

              <!-- Points Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <div style="background:#0f172a;border:2px solid #fbbf24;border-radius:12px;
                                padding:16px 32px;display:inline-block;text-align:center;">
                      <div style="color:#64748b;font-size:12px;margin-bottom:4px;">رصيدك الحالي</div>
                      <div style="color:#fbbf24;font-size:36px;font-weight:900;">${totalPoints}</div>
                      <div style="color:#94a3b8;font-size:12px;">نقطة</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${cardUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);
                              color:#0f172a;text-decoration:none;font-weight:700;font-size:16px;
                              padding:14px 40px;border-radius:50px;">
                      عرض بطاقتي
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:20px 32px;text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Riadh Card — ${merchantName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
