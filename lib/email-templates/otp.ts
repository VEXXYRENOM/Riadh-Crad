/**
 * lib/email-templates/otp.ts
 *
 * One-Time Password verification email.
 */

interface OtpEmailProps {
  otp: string;
  expiresInMinutes?: number;
}

export function otpEmail({
  otp,
  expiresInMinutes = 10,
}: OtpEmailProps): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>رمز التحقق - Riadh Card</title>
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
            <td style="background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:24px;text-align:center;">
              <h1 style="color:#0f172a;margin:0;font-size:22px;font-weight:800;">
                🔐 رمز التحقق
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <p style="color:#94a3b8;font-size:15px;margin:0 0 32px;">
                استخدم الرمز التالي لتسجيل الدخول إلى حسابك على Riadh Card:
              </p>

              <!-- OTP Box -->
              <div style="background:#0f172a;border:2px solid #fbbf24;border-radius:12px;
                          padding:24px;display:inline-block;margin:0 auto;">
                <span style="color:#fbbf24;font-size:42px;font-weight:900;letter-spacing:12px;
                             font-family:'Courier New',monospace;">
                  ${otp}
                </span>
              </div>

              <p style="color:#64748b;font-size:13px;margin:24px 0 0;">
                ⏱ صالح لمدة <strong style="color:#f59e0b;">${expiresInMinutes} دقائق</strong> فقط.
                لا تشارك هذا الرمز مع أحد.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:20px 32px;text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">
                إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد بأمان.
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
