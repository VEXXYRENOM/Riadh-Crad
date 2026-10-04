/**
 * lib/email-templates/campaign.ts
 *
 * Promotional / campaign blast email sent by merchants.
 */

interface CampaignEmailProps {
  customerName: string;
  merchantName: string;
  campaignTitle: string;
  campaignBody: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  unsubscribeUrl?: string;
}

export function campaignEmail({
  customerName,
  merchantName,
  campaignTitle,
  campaignBody,
  ctaLabel = 'اكتشف العرض',
  ctaUrl,
  imageUrl,
  unsubscribeUrl,
}: CampaignEmailProps): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${campaignTitle} — ${merchantName}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#1e293b;border-radius:16px;overflow:hidden;
                 border:1px solid rgba(255,215,0,0.2);">

          <!-- Optional Hero Image -->
          ${
            imageUrl
              ? `<tr>
                  <td>
                    <img src="${imageUrl}" alt="${campaignTitle}"
                         width="600" style="display:block;width:100%;height:auto;" />
                  </td>
                </tr>`
              : ''
          }

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:28px;text-align:center;">
              <p style="color:#0f172a;margin:0 0 4px;font-size:13px;font-weight:600;opacity:0.7;">
                ${merchantName}
              </p>
              <h1 style="color:#0f172a;margin:0;font-size:24px;font-weight:800;">
                ${campaignTitle}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">
                أهلاً <strong style="color:#fbbf24;">${customerName}</strong>،
              </p>
              <div style="color:#94a3b8;font-size:15px;line-height:1.8;margin:16px 0 32px;">
                ${campaignBody}
              </div>

              ${
                ctaUrl
                  ? `<table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${ctaUrl}"
                             style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);
                                    color:#0f172a;text-decoration:none;font-weight:700;font-size:16px;
                                    padding:14px 40px;border-radius:50px;">
                            ${ctaLabel}
                          </a>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:20px 32px;text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0 0 8px;">
                © ${new Date().getFullYear()} Riadh Card — ${merchantName}
              </p>
              ${
                unsubscribeUrl
                  ? `<p style="margin:0;">
                      <a href="${unsubscribeUrl}" style="color:#475569;font-size:11px;">
                        إلغاء الاشتراك
                      </a>
                    </p>`
                  : ''
              }
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
