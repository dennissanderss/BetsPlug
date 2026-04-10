"""Abandoned checkout email templates (HTML + plain text).

Template variables
------------------
- first_name:     User's first name (or "there" as fallback)
- plan_name:      Plan display name (e.g. "Gold")
- coupon_code:    Unique discount code (e.g. "BP-K7M4XR")
- discount_pct:   Discount percentage (e.g. "5")
- expiry_date:    Human-readable expiry (e.g. "17 april 2026")
- recovery_url:   Full URL to resume checkout
- site_url:       Homepage URL
- support_email:  Support contact email
"""

from __future__ import annotations


def render_html(
    *,
    first_name: str,
    plan_name: str,
    coupon_code: str,
    discount_pct: str,
    expiry_date: str,
    recovery_url: str,
    site_url: str,
    support_email: str,
) -> str:
    return f"""\
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Je bestelling staat nog klaar</title>
  <!--[if mso]>
  <style>table,td{{font-family:Arial,sans-serif !important;}}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#060912;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#060912;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Inner card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0d1220;border:1px solid rgba(255,255,255,0.08);border-radius:16px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:32px 32px 24px;">
              <a href="{site_url}" style="text-decoration:none;">
                <img src="{site_url}/logo.webp" alt="BetsPlug" width="160" style="display:block;max-width:160px;height:auto;" />
              </a>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding:0 32px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;line-height:1.3;text-align:center;">
                Je bestelling staat nog klaar
              </h1>
              <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.6;text-align:center;">
                Hoi {first_name}, je was bijna klaar met het afronden van je <strong style="color:#e2e8f0;">{plan_name}</strong>-abonnement bij BetsPlug.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 32px;">
              <div style="border-top:1px solid rgba(255,255,255,0.06);"></div>
            </td>
          </tr>

          <!-- Coupon block -->
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.06));border:1px solid rgba(251,191,36,0.3);border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#fbbf24;">
                      Exclusieve korting
                    </p>
                    <p style="margin:0 0 8px;font-size:32px;font-weight:900;color:#fbbf24;letter-spacing:2px;">
                      {coupon_code}
                    </p>
                    <p style="margin:0;font-size:14px;color:#94a3b8;">
                      <strong style="color:#fbbf24;">{discount_pct}% korting</strong> op je eerste betaling
                    </p>
                    <p style="margin:6px 0 0;font-size:12px;color:#64748b;">
                      Geldig tot {expiry_date}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <a href="{recovery_url}" style="display:inline-block;background:linear-gradient(135deg,#4ade80,#22c55e);color:#052e16;font-size:15px;font-weight:800;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:-0.2px;">
                Rond je bestelling af
              </a>
            </td>
          </tr>

          <!-- Subtext -->
          <tr>
            <td style="padding:12px 32px 0;">
              <p style="margin:0;font-size:12px;color:#64748b;text-align:center;line-height:1.5;">
                Deze link brengt je direct terug naar je checkout.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:28px 32px;">
              <div style="border-top:1px solid rgba(255,255,255,0.06);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-align:center;line-height:1.6;">
                Vragen? Neem gerust contact op via
                <a href="mailto:{support_email}" style="color:#4ade80;text-decoration:none;">{support_email}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#475569;text-align:center;line-height:1.5;">
                Je ontvangt deze e-mail omdat je een checkout hebt gestart op BetsPlug.
                Dit is een eenmalige herinnering - je wordt niet opnieuw gemaild.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Inner card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>"""


def render_text(
    *,
    first_name: str,
    plan_name: str,
    coupon_code: str,
    discount_pct: str,
    expiry_date: str,
    recovery_url: str,
    site_url: str,
    support_email: str,
) -> str:
    return f"""\
Je bestelling staat nog klaar - {discount_pct}% korting

Hoi {first_name},

Je was bijna klaar met het afronden van je {plan_name}-abonnement bij BetsPlug.

Gebruik code {coupon_code} voor {discount_pct}% korting op je eerste betaling.
Je code is geldig tot {expiry_date}.

Rond je bestelling af:
{recovery_url}

---

Vragen? Mail ons op {support_email}

Je ontvangt deze e-mail omdat je een checkout hebt gestart op BetsPlug.
Dit is een eenmalige herinnering - je wordt niet opnieuw gemaild.

BetsPlug - {site_url}
"""
