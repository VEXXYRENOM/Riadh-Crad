/**
 * lib/email-templates/welcome.ts
 *
 * Sent once when a customer creates their Riadh Card account.
 */

interface WelcomeEmailProps {
  customerName: string;
  merchantName: string;
  cardUrl: string;       // deep-link to their digital card / PWA
  logoUrl?: string;
}

export function welcomeEmail({
  customerName,
  merchantName,
  cardUrl,
  logoUrl = 'https://riadhcard.tn/logo.png',
}: WelcomeEmailProps): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>مرحباً بك في ${merchantName}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);
                 border-radius:16px;overflow:hidden;
                 border:1px solid rgba(255,215,0,0.2);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:32px;text-align:center;">
              <img src="${logoUrl}" alt="Riadh Card" width="80" style="border-radius:50%;" />
              <h1 style="color:#0f172a;margin:16px 0 0;font-size:24px;font-weight:800;">
                مرحباً بك في ${merchantName} 🎉
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 24px;">
                أهلاً <strong style="color:#fbbf24;">${customerName}</strong>،
              </p>
              <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 32px;">
                تم إنشاء بطاقة الولاء الخاصة بك بنجاح. يمكنك الآن تجميع النقاط عند كل زيارة
                والاستفادة من العروض والمكافآت الحصرية.
              </p>

              <!-- CTA Button -->
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
                © ${new Date().getFullYear()} Riadh Card. جميع الحقوق محفوظة.
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
