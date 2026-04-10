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
  <title>Je laat winst liggen, {first_name}</title>
  <!--[if mso]>
  <style>table,td{{font-family:Arial,sans-serif !important;}}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#080b14;font-family:'Lato',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#080b14;">
    <tr>
      <td align="center" style="padding:0;">

        <!-- Top ambient glow -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:radial-gradient(ellipse at top center, rgba(74,222,128,0.08) 0%, transparent 60%);max-width:640px;">
          <tr>
            <td style="padding:48px 24px 0;">

              <!-- Inner card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background-color:#0d1220;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">

                <!-- Green top accent line -->
                <tr>
                  <td style="height:3px;background:linear-gradient(90deg,transparent,#4ade80,transparent);font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <!-- Logo -->
                <tr>
                  <td align="center" style="padding:36px 32px 20px;">
                    <a href="{site_url}" style="text-decoration:none;">
                      <img src="{site_url}/logo.webp" alt="BetsPlug" width="140" style="display:block;max-width:140px;height:auto;" />
                    </a>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td style="padding:0 36px;">
                    <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#f8fafc;line-height:1.25;text-align:center;letter-spacing:-0.5px;">
                      Je laat winst liggen, {first_name}
                    </h1>
                    <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.7;text-align:center;">
                      Je was een stap verwijderd van slimmere voorspellingen met het
                      <strong style="color:#4ade80;">{plan_name}</strong>-abonnement.
                      We houden je plek nog even warm.
                    </p>
                  </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="padding:20px 0 0;"></td></tr>

                <!-- Coupon block -->
                <tr>
                  <td style="padding:0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141b2e;border:1px solid rgba(74,222,128,0.2);border-radius:16px;overflow:hidden;">
                      <!-- Coupon inner glow -->
                      <tr>
                        <td style="background:radial-gradient(ellipse at center, rgba(74,222,128,0.06) 0%, transparent 70%);padding:24px 28px;text-align:center;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#4ade80;">
                            Jouw exclusieve code
                          </p>

                          <!-- Code box with dashed border -->
                          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px auto 12px;">
                            <tr>
                              <td style="padding:12px 32px;border:2px dashed rgba(74,222,128,0.4);border-radius:12px;background-color:rgba(74,222,128,0.06);">
                                <span style="font-size:30px;font-weight:900;color:#4ade80;letter-spacing:3px;font-family:'Courier New',monospace;">{coupon_code}</span>
                              </td>
                            </tr>
                          </table>

                          <p style="margin:0 0 4px;font-size:15px;color:#e2e8f0;">
                            <strong style="color:#4ade80;">{discount_pct}% korting</strong> op je eerste betaling
                          </p>
                          <p style="margin:8px 0 0;font-size:12px;color:#ef4444;font-weight:700;">
                            Verloopt over 24 uur (geldig t/m {expiry_date})
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding:28px 36px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background:linear-gradient(135deg,#4ade80,#22c55e);border-radius:14px;box-shadow:0 6px 24px rgba(74,222,128,0.28);">
                          <a href="{recovery_url}" style="display:inline-block;color:#0a0e1a;font-size:16px;font-weight:800;text-decoration:none;padding:16px 48px;letter-spacing:-0.2px;text-transform:uppercase;">
                            Claim je korting
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Urgency subtext -->
                <tr>
                  <td style="padding:14px 36px 0;">
                    <p style="margin:0;font-size:12px;color:#64748b;text-align:center;line-height:1.5;">
                      Klik hierboven en je checkout wordt automatisch hervat.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:28px 36px;">
                    <div style="border-top:1px solid rgba(255,255,255,0.06);"></div>
                  </td>
                </tr>

                <!-- USP blocks -->
                <tr>
                  <td style="padding:0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="padding:0 6px;text-align:center;vertical-align:top;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                            <tr>
                              <td style="padding:16px 8px;">
                                <p style="margin:0 0 4px;font-size:20px;line-height:1;">&#9889;</p>
                                <p style="margin:0;font-size:11px;font-weight:700;color:#e2e8f0;line-height:1.3;">AI-Powered</p>
                                <p style="margin:2px 0 0;font-size:10px;color:#64748b;line-height:1.3;">Voorspellingen</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="33%" style="padding:0 6px;text-align:center;vertical-align:top;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                            <tr>
                              <td style="padding:16px 8px;">
                                <p style="margin:0 0 4px;font-size:20px;line-height:1;">&#128200;</p>
                                <p style="margin:0;font-size:11px;font-weight:700;color:#e2e8f0;line-height:1.3;">Bewezen</p>
                                <p style="margin:2px 0 0;font-size:10px;color:#64748b;line-height:1.3;">Track Record</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="33%" style="padding:0 6px;text-align:center;vertical-align:top;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                            <tr>
                              <td style="padding:16px 8px;">
                                <p style="margin:0 0 4px;font-size:20px;line-height:1;">&#128274;</p>
                                <p style="margin:0;font-size:11px;font-weight:700;color:#e2e8f0;line-height:1.3;">Cancel</p>
                                <p style="margin:2px 0 0;font-size:10px;color:#64748b;line-height:1.3;">Wanneer je wilt</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:24px 36px;">
                    <div style="border-top:1px solid rgba(255,255,255,0.06);"></div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:0 36px 32px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-align:center;line-height:1.6;">
                      Vragen? Mail ons op
                      <a href="mailto:{support_email}" style="color:#4ade80;text-decoration:none;font-weight:700;">{support_email}</a>
                    </p>
                    <p style="margin:0;font-size:10px;color:#475569;text-align:center;line-height:1.6;">
                      Je ontvangt deze mail omdat je een checkout hebt gestart op
                      <a href="{site_url}" style="color:#475569;text-decoration:underline;">BetsPlug</a>.
                      Dit is een eenmalige herinnering.
                    </p>
                  </td>
                </tr>

              </table>
              <!-- /Inner card -->

              <!-- Bottom spacing -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 0 48px;text-align:center;">
                    <a href="{site_url}" style="font-size:11px;color:#334155;text-decoration:none;">
                      &copy; 2026 BetsPlug. Alle rechten voorbehouden.
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

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
Je laat winst liggen, {first_name}

Je was een stap verwijderd van slimmere voorspellingen met het {plan_name}-abonnement bij BetsPlug.

We hebben een exclusieve kortingscode voor je:

    {coupon_code} - {discount_pct}% korting op je eerste betaling

    LET OP: Deze code verloopt over 24 uur (geldig t/m {expiry_date}).

Rond je bestelling nu af:
{recovery_url}

Wat je krijgt:
- AI-powered voorspellingen
- Bewezen track record
- Cancel wanneer je wilt

---

Vragen? Mail ons op {support_email}

Dit is een eenmalige herinnering. Je wordt niet opnieuw gemaild.

BetsPlug - {site_url}
"""
